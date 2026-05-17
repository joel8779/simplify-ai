from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings


def get_text_splitter() -> RecursiveCharacterTextSplitter:
    settings = get_settings()
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def split_text(text: str) -> list[str]:
    splitter = get_text_splitter()
    return splitter.split_text(text)
