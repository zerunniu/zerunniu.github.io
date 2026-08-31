from __future__ import annotations

import json
import shutil
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, HRFlowable, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "tmp" / "pdfs" / "resume-data.json"
OUTPUT_DIR = ROOT / "output" / "pdf"
PUBLIC_DIR = ROOT / "public" / "assets"
NAVY = colors.HexColor("#101827")
CYAN = colors.HexColor("#087C91")
INDIGO = colors.HexColor("#4359A7")
MUTED = colors.HexColor("#566273")
LINE = colors.HexColor("#DCE3EA")
PAPER = colors.HexColor("#FAFBFC")


def clean(value: object) -> str:
    text = str(value or "")
    return text.replace("–", "-").replace("—", "-").replace("‑", "-").replace("’", "'").replace("“", '"').replace("”", '"')


def make_styles():
    base = getSampleStyleSheet()
    return {
        "name": ParagraphStyle("Name", parent=base["Title"], fontName="Helvetica-Bold", fontSize=27, leading=30, textColor=NAVY, spaceAfter=3),
        "headline": ParagraphStyle("Headline", parent=base["Normal"], fontName="Helvetica", fontSize=10.5, leading=14, textColor=CYAN),
        "contact": ParagraphStyle("Contact", parent=base["Normal"], fontName="Helvetica", fontSize=7.8, leading=11, textColor=MUTED, alignment=TA_RIGHT),
        "section": ParagraphStyle("Section", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=CYAN, spaceBefore=9, spaceAfter=5, uppercase=True),
        "title": ParagraphStyle("ItemTitle", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=9.3, leading=12, textColor=NAVY, spaceAfter=1),
        "meta": ParagraphStyle("Meta", parent=base["Normal"], fontName="Helvetica", fontSize=7.5, leading=10, textColor=INDIGO, spaceAfter=2),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontName="Helvetica", fontSize=8.05, leading=11.1, textColor=MUTED, spaceAfter=3),
        "small": ParagraphStyle("Small", parent=base["Normal"], fontName="Helvetica", fontSize=7.2, leading=9.8, textColor=MUTED),
    }


S = make_styles()


def header(profile, academic=False):
    label = "Academic CV" if academic else "AI Research Engineer"
    left = [Paragraph(clean(profile["name"]), S["name"]), Paragraph(label, S["headline"])]
    socials = {item["label"]: item["url"] for item in profile["socials"]}
    contact = (
        f'{clean(profile["location"])}<br/>{escape(clean(profile["email"]))}<br/>'
        f'<a href="{socials.get("LinkedIn", "")}" color="#566273">LinkedIn</a> / '
        f'<a href="{socials.get("GitHub", "")}" color="#566273">GitHub</a> / '
        f'<a href="{socials.get("Google Scholar", "")}" color="#566273">Scholar</a>'
    )
    table = Table([[left, Paragraph(contact, S["contact"])]], colWidths=[112 * mm, 58 * mm])
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [table, Spacer(1, 4), HRFlowable(width="100%", thickness=1, color=CYAN), Spacer(1, 5)]


def section(label):
    return Paragraph(label.upper(), S["section"])


def item(title, meta, body, bullets=None):
    result = [Paragraph(escape(clean(title)), S["title"]), Paragraph(escape(clean(meta)), S["meta"]), Paragraph(escape(clean(body)), S["body"])]
    for bullet in bullets or []:
        result.append(Paragraph(f"- {escape(clean(bullet))}", S["small"]))
    result.append(Spacer(1, 4))
    return result


def project_item(project, detailed=True):
    metrics = "; ".join(f'{clean(metric["value"])} {clean(metric["label"])}' for metric in project.get("metrics", []))
    body = clean(project["role"])
    if detailed and metrics:
        body += f" Evidence: {metrics}."
    return item(project["title"], f'{clean(project["period"])} | {clean(project["status"]).replace("-", " ")}', body)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, A4[0], 11 * mm, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 6 * mm, "Zerun Niu | generated from zerunniu.github.io Markdown")
    canvas.drawRightString(A4[0] - 20 * mm, 6 * mm, f"{doc.page}")
    canvas.restoreState()


def document(path: Path):
    doc = BaseDocTemplate(str(path), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=16 * mm, bottomMargin=16 * mm, title="Zerun Niu CV", author="Zerun Niu")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="cv", frames=[frame], onPage=footer))
    return doc


def build_industry(data, path):
    profile = data["profile"]
    projects = sorted([project for project in data["projects"] if project.get("featured")], key=lambda value: value.get("order", 99))
    experience = sorted(data["experience"], key=lambda value: value.get("order", 99))
    research_roles = [entry for entry in experience if entry["kind"] in ("research", "teaching")]
    education = [entry for entry in experience if entry["kind"] == "education"]
    story = header(profile)
    story += [section("Profile"), Paragraph(escape(clean(profile["summary"])), S["body"])]
    story += [section("Current research and teaching")]
    for entry in research_roles:
        story += item(entry["role"], f'{entry["organisation"]} | {entry["start"]} - {entry["end"]}', entry["summary"], entry.get("evidence", [])[:3])
    story += [section("Selected research")]
    for project in projects[:3]:
        story += project_item(project)
    story += [PageBreak()]
    story += header(profile)
    story += [section("Research engineering casework")]
    for project in projects[3:]:
        story += project_item(project)
    story += item("BRAVE - first-author evidence", "Under review at TMLR", "Designed controlled evidence feedback for sparse crowdsourcing and led the complete research pipeline.", ["14 benchmarks; lowest NLL on 5/14; best or tied-best ECE on 9/14.", "Accuracy within 0.03 of the strongest external baseline on 11/14.", "Completed downstream reward-model calibration transfer experiments."])
    story += [section("Technical practice")]
    skill_rows = [[Paragraph(group["category"], S["title"]), Paragraph(" · ".join(clean(value) for value in group["skills"]), S["small"])] for group in profile["skillGroups"]]
    skill_table = Table(skill_rows, colWidths=[36 * mm, 134 * mm])
    skill_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 3), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    story.append(skill_table)
    story += [section("Education")]
    for entry in education:
        story += item(entry["role"], f'{entry["organisation"]} | {entry["start"]} - {entry["end"]}', entry["summary"], entry.get("evidence", []))
    document(path).build(story)


def build_academic(data, path):
    profile = data["profile"]
    experience = sorted(data["experience"], key=lambda value: value.get("order", 99))
    projects = sorted(data["projects"], key=lambda value: value.get("order", 99))
    publications = sorted(data["publications"], key=lambda value: (-value["year"], value["title"]))
    story = header(profile, academic=True)
    story += [section("Research profile"), Paragraph(escape(clean(profile["summary"])), S["body"]), section("Research interests"), Paragraph(" · ".join(clean(value) for value in profile["researchInterests"]), S["body"]), section("Appointments and education")]
    for entry in experience:
        story += item(entry["role"], f'{entry["organisation"]} | {entry["start"]} - {entry["end"]} | {entry["location"]}', entry["summary"], entry.get("evidence", []))
    story += [PageBreak()]
    story += header(profile, academic=True)
    story += [section("Publications")]
    for paper in publications:
        authors = ", ".join(clean(value) for value in paper["authors"])
        story += item(paper["title"], f'{paper["venue"]}, {paper["year"]} | {clean(paper["status"]).replace("-", " ")}', authors)
    story += [section("Selected research projects")]
    for project in projects:
        story += project_item(project)
    story += [PageBreak()]
    story += header(profile, academic=True)
    story += [section("Teaching")]
    for entry in experience:
        if entry["kind"] == "teaching":
            story += item(entry["role"], f'{entry["organisation"]} | {entry["start"]} - {entry["end"]}', entry["summary"], entry.get("evidence", []))
    story += [section("Technical practice")]
    for group in profile["skillGroups"]:
        story += item(group["category"], "Methods and tools", " · ".join(clean(value) for value in group["skills"]))
    story += [section("Public links"), Paragraph('Website: <a href="https://zerunniu.github.io" color="#087C91">zerunniu.github.io</a><br/>OpenReview (BRAVE): <a href="https://openreview.net/forum?id=iWFI5hO1dZ" color="#087C91">openreview.net/forum?id=iWFI5hO1dZ</a>', S["body"])]
    document(path).build(story)


def main():
    with DATA_PATH.open(encoding="utf-8") as handle:
        data = json.load(handle)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    industry = OUTPUT_DIR / "Zerun_Niu_Research_Engineer_Resume.pdf"
    academic = OUTPUT_DIR / "Zerun_Niu_Academic_CV.pdf"
    build_industry(data, industry)
    build_academic(data, academic)
    shutil.copyfile(industry, PUBLIC_DIR / industry.name)
    shutil.copyfile(academic, PUBLIC_DIR / academic.name)
    print(industry)
    print(academic)


if __name__ == "__main__":
    main()
