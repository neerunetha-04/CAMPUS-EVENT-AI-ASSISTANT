import re

def clean_text(text: str) -> str:
    """Clean extracted document text, normalize whitespace and line breaks."""
    if not text:
        return ""
    # Replace multiple carriage returns and tabs
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace non-breaking spaces
    text = text.replace("\u00a0", " ")
    # Replace sequences of 3+ newlines with double newline
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Replace multiple inline spaces
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()
