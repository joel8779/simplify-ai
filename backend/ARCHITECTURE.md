# Simplify Backend Architecture

## Folder structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, lifespan, exception handlers
│   ├── api/
│   │   ├── deps.py             # Dependency injection (DB, repos, services, auth)
│   │   └── v1/
│   │       ├── router.py       # Aggregates v1 routes
│   │       └── endpoints/
│   │           ├── auth.py     # signup, login, refresh, logout
│   │           ├── users.py    # profile, password
│   │           ├── documents.py# upload, list, delete
│   │           ├── chat.py     # sessions, messages (document-scoped)
│   │           └── health.py
│   ├── core/
│   │   ├── config.py           # Pydantic settings from .env
│   │   ├── security.py         # JWT + bcrypt
│   │   └── exceptions.py       # AppError hierarchy
│   ├── db/
│   │   ├── mongodb.py          # Motor client lifecycle
│   │   └── indexes.py          # Collection indexes
│   ├── models/                 # Domain documents (Mongo shape)
│   ├── schemas/                # API request/response (Pydantic)
│   ├── repositories/           # Data access only
│   ├── services/               # Business logic
│   │   └── rag/                # Chunking, embeddings, Chroma, retriever, orchestrator
│   ├── integrations/
│   │   └── gemini.py           # LLM client (streaming-ready)
│   └── utils/
│       └── file_parsers.py     # PDF, DOCX, text extraction
├── requirements.txt
├── .env.example
└── ARCHITECTURE.md
```

## Request lifecycle

```
Client → CORS → FastAPI Router → Depends(get_current_user)
       → Endpoint → Service → Repository → MongoDB
                              → VectorStore (Chroma) / Gemini
       ← Pydantic response ← Service ← Repository
```

## Auth flow

1. `POST /api/v1/auth/signup` or `/login` → `AuthService` hashes password, stores user.
2. Issues **access JWT** (short-lived) + **refresh token** (stored hashed in MongoDB).
3. Protected routes require `Authorization: Bearer <access_token>`.
4. `deps.get_current_user` decodes JWT → loads user from `users` collection.
5. `POST /api/v1/auth/refresh` rotates refresh token; old token revoked.

## RAG flow

1. **Upload** (`DocumentService.upload_documents`)
   - Save file to `UPLOAD_DIR/{user_id}/`
   - Parse text → `split_text()` chunks
   - Embed chunks → upsert into Chroma collection `simplify_user_{user_id}`
   - Store chunk metadata in `document_chunks`, document row in `documents`

2. **Chat** (`ChatService.send_message`)
   - Resolve `document_ids` from message body or session defaults
   - Validate ownership + `status=indexed`
   - `RAGRetriever.retrieve(user_id, query, document_ids)` — Chroma query with `where document_id IN (...)`
   - `RAGOrchestrator.build_context_block()` → inject into Gemini prompt
   - Persist user + assistant messages with `citations[]`

## Document retrieval flow

```
document_ids (from frontend activeDocumentIds)
    → DocumentRepository.find_many_by_ids (ownership + indexed)
    → EmbeddingService.embed_query(message)
    → VectorStore.query(where={document_id: {$in: ids}})
    → top-k chunks → citations in response
```

## MongoDB collections

| Collection        | Purpose                                      |
|-------------------|----------------------------------------------|
| `users`           | Accounts, bcrypt passwords                   |
| `refresh_tokens`  | Hashed refresh tokens, TTL on `expires_at`   |
| `documents`       | File metadata, status, ownership             |
| `document_chunks` | Chunk text + Chroma id mapping               |
| `chat_sessions`   | Session title, default `document_ids`        |
| `chat_messages`   | History, per-turn `document_ids`, citations  |

## API routes (`/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/auth/signup` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | No |
| GET/PATCH | `/users/me` | Yes |
| POST | `/users/me/password` | Yes |
| GET/POST/DELETE | `/documents/*` | Yes |
| GET/POST | `/chat/sessions/*` | Yes |

## Frontend integration

- Store tokens from `/auth/login`; send `Authorization: Bearer` on API calls.
- Wire `frontend/app/api/auth/refresh` to `POST /api/v1/auth/refresh`.
- Documents page → `GET/POST/DELETE /documents`.
- Chat: `activeDocumentIds` from Zustand → `document_ids` in `ChatMessageCreate`.
- Match `lib/types/chat-api.ts` `ChatCompletionRequest.documentIds`.

## Phase 2 (implemented)

- `integrations/gemini.py` — async Gemini SDK wrapper with retries
- `services/gemini_service.py` — grounded chat completion helper
- `services/rag/embeddings.py` — batched Gemini embeddings
- `services/rag/vector_store.py` — async Chroma upsert/query
- `services/rag/retriever.py` — document-scoped top-k retrieval
- `services/rag/orchestrator.py` — retrieval → prompt → Gemini

## Phase 3 targets

- SSE streaming via `GeminiClient.generate_content_stream`
- `POST /chat/sessions/{id}/messages/stream`

## Common mistakes to avoid

- Skipping `document_ids` validation (leaks cross-user retrieval)
- Indexing without user-scoped Chroma collections
- Storing refresh tokens in plain text (always hash)
- Blocking the event loop with sync Chroma/Gemini calls (use thread pool if needed)
- Returning unbounded chat history to the LLM (cap at N messages)
