# Simplify API

FastAPI backend for Simplify AI: JWT auth, OTP verification, document ingestion, Supabase Storage, Pinecone retrieval, Gemini RAG orchestration, streaming chat, citations, and persistent chat history.

## Local Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

## Production

Railway start command:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set all production environment variables in Railway. Do not deploy a `.env` file.

See the root `README.md` for full deployment, provider setup, and environment variable documentation.
