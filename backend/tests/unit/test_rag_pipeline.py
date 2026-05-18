from pathlib import Path

from app.services.rag.chunking import split_pages
from app.services.rag.retriever import RAGRetriever
from app.utils.file_parsers import ParsedPage, parse_file


def test_split_pages_preserves_page_metadata() -> None:
    chunks = split_pages(
        [
            ParsedPage(text="alpha beta gamma. " * 80, page_number=2),
            ParsedPage(text="delta epsilon zeta. " * 80, page_number=3),
        ]
    )

    assert chunks
    assert {chunk.page_number for chunk in chunks} == {2, 3}
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))


def test_parse_text_file_normalizes_text(tmp_path: Path) -> None:
    file_path = tmp_path / "sample.txt"
    file_path.write_text("First line\n\n  Second line  \n", encoding="utf-8")

    parsed = parse_file(file_path, "text/plain")

    assert parsed.text == "First line\nSecond line"
    assert parsed.pages[0].text == parsed.text


def test_retriever_parse_results_filters_scope_and_preserves_citations() -> None:
    results = {
        "ids": [["doc-1_chunk_0", "doc-2_chunk_0"]],
        "documents": [["selected text", "other text"]],
        "metadatas": [
            [
                {
                    "document_id": "doc-1",
                    "chunk_index": 0,
                    "page_number": 4,
                    "original_name": "selected.pdf",
                },
                {
                    "document_id": "doc-2",
                    "chunk_index": 0,
                    "original_name": "other.pdf",
                },
            ]
        ],
        "distances": [[0.1, 0.2]],
    }

    chunks = RAGRetriever._parse_results(results, ["doc-1"], 0.0)

    assert len(chunks) == 1
    assert chunks[0].document_id == "doc-1"
    assert chunks[0].content == "selected text"
    assert chunks[0].page_number == 4
    assert chunks[0].original_name == "selected.pdf"


def test_retriever_parse_results_accepts_pinecone_scores() -> None:
    results = {
        "ids": [["doc-1_chunk_0"]],
        "documents": [["selected text"]],
        "metadatas": [
            [
                {
                    "document_id": "doc-1",
                    "chunk_index": 0,
                    "filename": "selected.pdf",
                },
            ]
        ],
        "scores": [[0.82]],
    }

    chunks = RAGRetriever._parse_results(results, ["doc-1"], 0.8)

    assert len(chunks) == 1
    assert chunks[0].score == 0.82
    assert chunks[0].original_name == "selected.pdf"
