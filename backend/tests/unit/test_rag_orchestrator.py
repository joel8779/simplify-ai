import pytest

from app.schemas.chat import ResponseMode
from app.services.rag.orchestrator import RAGOrchestrator
from app.services.rag.retriever import RetrievedChunk


class FakeRetriever:
    def __init__(self, chunks: list[RetrievedChunk]) -> None:
        self.chunks = chunks

    async def retrieve(
        self, user_id: str, query: str, document_ids: list[str]
    ) -> list[RetrievedChunk]:
        return self.chunks


class FakeGemini:
    async def generate_grounded_reply(
        self, *, context_block: str, question: str, history: list[dict[str, str]]
    ) -> str:
        return "grounded answer"

    async def generate_general_reply(
        self, *, question: str, history: list[dict[str, str]]
    ) -> str:
        return "general answer"


def chunk(score: float) -> RetrievedChunk:
    return RetrievedChunk(
        document_id="doc-1",
        chunk_index=0,
        content="Relevant document text",
        score=score,
        page_number=1,
        original_name="source.pdf",
    )


@pytest.mark.asyncio
async def test_orchestrator_uses_rag_mode_for_relevant_chunks() -> None:
    orchestrator = RAGOrchestrator(FakeRetriever([chunk(0.9)]), FakeGemini())

    answer = await orchestrator.generate_answer(
        user_id="user-1",
        query="What does the document say?",
        document_ids=["doc-1"],
        history=[],
    )

    assert answer.response_mode == ResponseMode.RAG
    assert answer.content == "grounded answer"
    assert len(answer.chunks) == 1


@pytest.mark.asyncio
async def test_orchestrator_falls_back_for_low_confidence_chunks() -> None:
    orchestrator = RAGOrchestrator(FakeRetriever([chunk(0.1)]), FakeGemini())

    answer = await orchestrator.generate_answer(
        user_id="user-1",
        query="Unrelated question",
        document_ids=["doc-1"],
        history=[],
    )

    assert answer.response_mode == ResponseMode.GENERAL
    assert answer.content == "general answer"
    assert answer.chunks == []
