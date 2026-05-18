# Simplify Backend Architecture

## Folder structure

```text
backend/
|-- app/
|   |-- main.py                 # FastAPI app factory, lifespan, exception handlers
|   |-- api/                    # Dependency injection and v1 routes
|   |-- core/                   # Config, security, logging, exceptions
|   |-- db/                     # Motor client lifecycle and indexes
|   |-- models/                 # Domain documents
|   |-- schemas/                # API request/response models
|   |-- repositories/           # Data access
|   |-- services/               # Business logic
|   |   `-- rag/                # Chunking, embeddings, Pinecone, retrieval, orchestration
|   |-- integrations/           # Gemini and Pinecone clients
|   `-- utils/                  # File parsing
|-- requirements.txt
|-- .env.example
`-- ARCHITECTURE.md
```

## Request lifecycle

```text
Client -> CORS -> FastAPI Router -> Depends(get_current_user)
       -> Endpoint -> Service -> Repository -> MongoDB
                              -> VectorStore (Pinecone) / Gemini
       <- Pydantic response <- Service <- Repository
```

## Auth flow

1. `POST /api/v1/auth/signup` or `/login` -> `AuthService` hashes password and stores the user.
2. Issues a short-lived access JWT and a hashed refresh token stored in MongoDB.
3. Protected routes require `Authorization: Bearer <access_token>`.
4. `deps.get_current_user` decodes JWT and loads the user from the `users` collection.
5. `POST /api/v1/auth/refresh` rotates the refresh token and revokes the old token.

## RAG flow

1. Upload through `DocumentService.upload_documents`.
2. Store the source file, parse text, split pages into chunks, and embed chunks with Gemini.
3. Upsert vectors into Pinecone with `user_id`, `document_id`, citation metadata, and chunk content.
4. Store document and chunk metadata in MongoDB.
5. For chat, validate document ownership, embed the query, search Pinecone with user/document filters, build grounded context, and persist citations.

## MongoDB collections

| Collection | Purpose |
| --- | --- |
| `users` | Accounts and bcrypt passwords |
| `refresh_tokens` | Hashed refresh tokens, TTL on `expires_at` |
| `documents` | File metadata, status, ownership |
| `document_chunks` | Chunk text and vector id mapping |
| `chat_sessions` | Session title and default `document_ids` |
| `chat_messages` | History, per-turn `document_ids`, citations |

## Phase 2 Components

- `integrations/gemini.py` - async Gemini SDK wrapper with retries
- `integrations/pinecone.py` - Pinecone client and index access
- `services/gemini_service.py` - grounded chat completion helper
- `services/rag/embeddings.py` - batched Gemini embeddings
- `services/rag/vector_store.py` - async Pinecone upsert/query/delete
- `services/rag/retriever.py` - document-scoped top-k retrieval
- `services/rag/orchestrator.py` - retrieval -> prompt -> Gemini

## Common mistakes to avoid

- Skipping `document_ids` validation, which can leak cross-user retrieval.
- Indexing without `user_id` and `document_id` Pinecone metadata filters.
- Storing refresh tokens in plain text.
- Blocking the event loop with sync Pinecone/Gemini calls.
- Returning unbounded chat history to the LLM.
