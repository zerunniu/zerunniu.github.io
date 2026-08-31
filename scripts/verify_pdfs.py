from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "output/pdf/Zerun_Niu_Research_Engineer_Resume.pdf": 2,
    ROOT / "output/pdf/Zerun_Niu_Academic_CV.pdf": 3,
}
REQUIRED = (
    "first author",
    "algorithm design",
    "literature review",
    "experimental design",
    "implementation",
    "deployment",
    "under review",
)


def render_and_check(path: Path, expected_pages: int) -> list[Image.Image]:
    reader = PdfReader(str(path))
    if len(reader.pages) != expected_pages:
        raise ValueError(f"{path.name}: expected {expected_pages} pages, found {len(reader.pages)}")

    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    lower = text.lower()
    missing = [phrase for phrase in REQUIRED if phrase not in lower]
    if missing:
        raise ValueError(f"{path.name}: missing required phrases: {', '.join(missing)}")
    if "�" in text:
        raise ValueError(f"{path.name}: contains text-extraction replacement characters")

    document = pdfium.PdfDocument(str(path))
    rendered = []
    for index in range(len(document)):
        page = document[index]
        image = page.render(scale=1.2).to_pil().convert("RGB")
        if image.getbbox() is None:
            raise ValueError(f"{path.name}: page {index + 1} rendered blank")
        rendered.append(image)
    return rendered


def contact_sheet(pages: list[tuple[str, Image.Image]]) -> Path:
    padding = 24
    label_height = 30
    columns = 2
    cell_width = max(image.width for _, image in pages)
    cell_height = max(image.height for _, image in pages) + label_height
    rows = (len(pages) + columns - 1) // columns
    sheet = Image.new(
        "RGB",
        (columns * cell_width + (columns + 1) * padding, rows * cell_height + (rows + 1) * padding),
        "#d8dde7",
    )
    draw = ImageDraw.Draw(sheet)
    for index, (label, image) in enumerate(pages):
        column = index % columns
        row = index // columns
        x = padding + column * (cell_width + padding)
        y = padding + row * (cell_height + padding)
        draw.text((x, y), label, fill="#1f2937")
        sheet.paste(image, (x, y + label_height))

    destination = ROOT / "tmp/pdf-qa/contact-sheet.png"
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)
    return destination


all_pages: list[tuple[str, Image.Image]] = []
for pdf_path, page_count in FILES.items():
    images = render_and_check(pdf_path, page_count)
    all_pages.extend((f"{pdf_path.stem} · page {index + 1}", image) for index, image in enumerate(images))

preview = contact_sheet(all_pages)
print(f"Verified {len(FILES)} PDFs and rendered {len(all_pages)} pages: {preview}")
