# Simplify AI

Simplify AI is a production-oriented SaaS RAG application for chatting with private documents. Users can create an account, verify their email with OTP, upload documents, build a searchable knowledge base, and receive streamed AI answers with source citations.

The project is built as a portfolio-grade full-stack system: a Next.js dashboard on Vercel, a FastAPI backend on Railway, MongoDB Atlas for application data, Supabase Storage for original files, Pinecone for vector retrieval, and Gemini for embeddings and generation.

## Features

- JWT authentication with refresh-token rotation
- Email OTP verification during signup
- Global logout with access-token denylisting and refresh-token revocation
- Persistent chat sessions with delete and rename support
- Document upload and processing pipeline
- Supabase-backed original file storage
- Pinecone vector retrieval for production RAG
- Gemini embeddings and streaming response generation
- Hybrid RAG assistant with general fallback behavior
- Citation cards with document names, chunks, excerpts, and page metadata
- Dashboard analytics for documents, chats, and messages
- Responsive dark SaaS UI built with Next.js and Tailwind CSS

## Architecture

```text
Browser / Vercel
  Next.js dashboard
  Auth state + streaming chat UI
        |
        | HTTPS REST + fetch streaming
        v
Railway
  FastAPI API
  JWT auth, OTP, uploads, chat, RAG orchestration
        |
        +--> MongoDB Atlas: users, sessions, messages, document metadata
        +--> Supabase Storage: uploaded source files
        +--> Pinecone: document chunk vectors
        +--> Gemini: embeddings and streamed answer generation
        +--> SMTP: OTP delivery
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, Uvicorn |
| Auth | JWT, refresh tokens, OTP email verification |
| Database | MongoDB Atlas |
| Storage | Supabase Storage |
| Vector DB | Pinecone |
| AI | Gemini chat + embedding models |
| Deployment | Vercel frontend, Railway backend |


## Local Setup

Prerequisites:

- Node.js 20+
- Python 3.11+
- MongoDB Atlas cluster
- Gemini API key
- Supabase project and storage bucket
- Pinecone index for production-like RAG
- SMTP account for OTP delivery

Clone and install:

```bash
git clone <your-repo-url>
cd saas-rag
```

## Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Fill `backend/.env`, then run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set local frontend env:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_MAX_DOCUMENTS_PER_CHAT=8
```

Open `http://localhost:3000`.

## Environment Variables

Backend variables are documented in `backend/.env.example`.

Required for Railway production:

```env
APP_ENV=production
DEBUG=false
API_V1_PREFIX=/api/v1
CORS_ORIGINS=https://your-vercel-app.vercel.app
MONGODB_URI=...
MONGODB_DB_NAME=simplify
MONGODB_OPTIONAL=false
JWT_SECRET_KEY=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OTP_EXPIRE_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_RATE_LIMIT_WINDOW_MINUTES=15
OTP_MAX_REQUESTS_PER_WINDOW=3
SMTP_HOST=...
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=Simplify AI
SMTP_USE_TLS=true
GEMINI_API_KEY=...
GEMINI_CHAT_MODEL=models/gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
VECTOR_STORE_PROVIDER=pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=simplify-documents
PINECONE_NAMESPACE=simplify
PINECONE_DIMENSION=3072
PINECONE_METRIC=cosine
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET=documents
MAX_UPLOAD_SIZE_MB=25
ALLOWED_EXTENSIONS=.pdf,.docx,.txt,.md
```

Required for Vercel production:

```env
NEXT_PUBLIC_API_URL=https://your-railway-service.up.railway.app
NEXT_PUBLIC_MAX_DOCUMENTS_PER_CHAT=8
```

## Railway Deployment

This repository includes `railway.json` for the backend.

1. Create a new Railway project from the GitHub repository.
2. Set the Railway root to the repository root.
3. Add all backend environment variables listed above.
4. Ensure `APP_ENV=production` and `DEBUG=false`.
5. Set `CORS_ORIGINS` to your Vercel URL.
6. Deploy.

Exact Railway start command:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway health check:

```text
/api/v1/health
```

## Vercel Deployment

This repository includes `vercel.json` for the frontend.

1. Import the GitHub repository into Vercel.
2. Set the project root/build settings through `vercel.json`.
3. Add frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-service.up.railway.app
NEXT_PUBLIC_MAX_DOCUMENTS_PER_CHAT=8
```

4. Deploy the frontend.
5. Copy the Vercel production URL into Railway `CORS_ORIGINS`.
6. Redeploy Railway after changing CORS.

## MongoDB Atlas Setup

1. Create an Atlas cluster.
2. Create a database user with read/write access.
3. Add your local IP for development and Railway outbound access for production.
4. Copy the connection string into `MONGODB_URI`.
5. Use `MONGODB_DB_NAME=simplify` or your chosen database name.

The backend creates required indexes on startup, including users, pending OTP signups, refresh tokens, access-token denylist, documents, chunks, chat sessions, and messages.

## Supabase Setup

1. Create a Supabase project.
2. Create a private storage bucket, for example `documents`.
3. Copy the project URL into `SUPABASE_URL`.
4. Use a service-role key for `SUPABASE_SERVICE_KEY` on the backend only.
5. Set `SUPABASE_BUCKET=documents`.

Never expose the service-role key to the frontend.

## Pinecone Setup

1. Create a Pinecone index.
2. Use dimension `3072` for Gemini embeddings.
3. Use cosine similarity.
4. Set:

```env
VECTOR_STORE_PROVIDER=pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=simplify-documents
PINECONE_NAMESPACE=simplify
PINECONE_DIMENSION=3072
PINECONE_METRIC=cosine
```

`PINECONE_INDEX_HOST` is optional if the SDK can resolve by index name.

## Gemini Setup

1. Create a Gemini API key in Google AI Studio.
2. Set `GEMINI_API_KEY`.
3. Recommended models:

```env
GEMINI_CHAT_MODEL=models/gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
```

## RAG Pipeline

1. User uploads a supported document.
2. Backend validates file type and size.
3. Original file is stored in Supabase Storage.
4. Text is extracted and chunked with overlap.
5. Gemini creates embeddings for each chunk.
6. Chunks and metadata are stored in MongoDB.
7. Vectors are upserted into Pinecone.
8. During chat, the retriever searches relevant chunks within the user's scope.
9. The RAG orchestrator builds a grounded prompt.
10. Gemini streams an answer back with citations.

## Streaming Architecture

The frontend uses `fetch` with a readable stream against the FastAPI streaming endpoint. The backend emits server-sent-event-style chunks for metadata, deltas, and completion. The chat UI progressively appends assistant tokens, then finalizes the message with persisted content, response mode, and citations.

This keeps responses fast while still preserving complete chat history in MongoDB.

## Folder Structure

```text
saas-rag/
  backend/
    app/
      api/              FastAPI routers and dependencies
      core/             settings, logging, security, exceptions
      db/               MongoDB connection, indexes, repositories
      integrations/     Pinecone and provider integrations
      models/           database/domain models
      schemas/          Pydantic request/response schemas
      services/         auth, chat, document, storage, RAG services
      workers/          background task scaffolding
    tests/              unit and integration tests
    requirements.txt
  frontend/
    app/                Next.js app routes
    components/         UI, auth, layout, chat, docs, settings
    hooks/              client-side workflow hooks
    lib/                API clients, services, utilities
    store/              Zustand stores
    package.json
  railway.json
  vercel.json
```

## Production Notes

- Use HTTPS URLs in `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL`.
- Keep `DEBUG=false` in production so API docs are disabled.
- Use a strong random `JWT_SECRET_KEY`.
- Use a real SMTP/domain setup with SPF, DKIM, and DMARC for OTP deliverability.
- Use Pinecone in production instead of local Chroma persistence.
- Do not commit `data/`, `.env`, local Chroma files, or uploaded documents.

## Final Testing Checklist

- Signup creates a pending OTP verification and sends email.
- OTP verification creates the real user and logs in.
- Login works after verification.
- Logout clears local/session storage and redirects.
- Document upload stores file in Supabase and metadata in MongoDB.
- Uploaded documents index into Pinecone.
- Chat streams responses in production.
- Citations render with document metadata.
- Chat sessions persist, reload, rename, and delete.
- Dashboard counts load correctly.
- Health endpoint returns `status=ok`.

## Future Improvements

- Add a formal migration system for MongoDB indexes and schema changes.
- Add background queue processing for large document ingestion.
- Add organization/team workspaces and role-based access control.
- Add Stripe billing and plan-based limits.
- Add observability with structured logs, tracing, and error reporting.
- Add automated CI for backend tests, frontend typecheck, and production builds.

## License

Add your preferred license before public distribution. MIT is a common choice for portfolio SaaS projects.
