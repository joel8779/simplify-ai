from dataclasses import dataclass
from typing import Iterable

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.utils.file_parsers import ParsedPage


@dataclass(frozen=True)
class TextChunk:
    content: str
    chunk_index: int
    page_number: int | None = None


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


def split_pages(pages: Iterable[ParsedPage]) -> list[TextChunk]:
    splitter = get_text_splitter()
    chunks: list[TextChunk] = []

    for page in pages:
        if not page.text.strip():
            continue
        for content in splitter.split_text(page.text):
            clean_content = content.strip()
            if not clean_content:
                continue
            chunks.append(
                TextChunk(
                    content=clean_content,
                    chunk_index=len(chunks),
                    page_number=page.page_number,
                )
            )

    return chunks
