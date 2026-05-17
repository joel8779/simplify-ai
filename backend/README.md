# Simplify Backend API

Production-style FastAPI backend for document-scoped RAG chat.

## Quick start

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with MongoDB Atlas URI, JWT secret, Gemini key

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## Development order

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system design.

1. **Phase 1 (scaffold — current)** — structure, auth, MongoDB, route stubs
2. **Phase 2** — Gemini embeddings + chat, document indexing end-to-end
3. **Phase 3** — SSE streaming for chat responses
4. **Phase 4** — tests, rate limits, observability
