from __future__ import annotations

import importlib
import sys
from types import SimpleNamespace

import pytest


class FakeMarkItDown:
    def __init__(self, enable_plugins: bool) -> None:
        self.enable_plugins = enable_plugins

    def convert(self, input_path: str) -> SimpleNamespace:
        return SimpleNamespace(text_content=f"converted:{input_path}")


@pytest.fixture(autouse=True)
def fake_markitdown(monkeypatch):
    fake_module = SimpleNamespace(MarkItDown=FakeMarkItDown)
    monkeypatch.setitem(sys.modules, "markitdown", fake_module)


def import_fresh(module_name: str):
    sys.modules.pop(module_name, None)
    return importlib.import_module(module_name)


@pytest.mark.parametrize(
    "module_name",
    [
        "tools.markitdown_tool",
        "convert_markitdown_standalone",
    ],
)
def test_convert_to_markdown_returns_text_and_writes_output(module_name, tmp_path):
    module = import_fresh(module_name)
    input_file = tmp_path / "source.txt"
    output_file = tmp_path / "nested" / "output.md"
    input_file.write_text("source", encoding="utf-8")

    markdown = module.convert_to_markdown(str(input_file), str(output_file))

    expected = f"converted:{input_file}"
    assert markdown == expected
    assert output_file.read_text(encoding="utf-8") == expected


@pytest.mark.parametrize(
    "module_name",
    [
        "tools.markitdown_tool",
        "convert_markitdown_standalone",
    ],
)
def test_convert_to_markdown_raises_for_missing_input(module_name, tmp_path):
    module = import_fresh(module_name)
    missing_file = tmp_path / "missing.pdf"

    with pytest.raises(FileNotFoundError, match="File not found"):
        module.convert_to_markdown(str(missing_file))
