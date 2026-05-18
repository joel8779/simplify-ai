from app.services.gemini_service import RAG_SYSTEM_INSTRUCTION


def test_rag_prompt_allows_grounded_inference() -> None:
    prompt = RAG_SYSTEM_INSTRUCTION.lower()

    assert "reasonable inferences" in prompt
    assert "recommendations" in prompt
    assert "based on your uploaded documents" in prompt


def test_rag_prompt_blocks_unsupported_resume_claims() -> None:
    prompt = RAG_SYSTEM_INSTRUCTION.lower()

    assert "do not invent experience" in prompt
    assert "certifications" in prompt
    assert "skills" in prompt
