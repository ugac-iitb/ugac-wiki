import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "Copy of Reach portal blogs - Sheet1.csv"
OUT_PATH = ROOT / "scripts" / "idddp_reviews.generated.js"

HOST_DEPT_MAP = {
    "Chemistry": "Chemistry",
    "Aerospace Engineering": "Aerospace Engineering",
    "CMInDS": "Centre for Machine Intelligence and Data Science (C-MInDS)",
    "Chemical Engineering": "Chemical Engineering",
    "SJMSOM": "SJMSOM",
    "Electrical Engineering": "Electrical Engineering",
    "Physics": "Physics",
    "KCDH": "Centre for Digital Health (KCDH)",
    "IEOR": "IEOR",
    "SysCon": "SysCon",
    "Maths": "Mathematics",
    "IDC": "IDC",
}

QUESTIONS = [
    "Could you briefly introduce yourself and your academic background?",
    "What motivated you to pursue IDDDP/DD?",
    "Can you briefly describe your research project and the work you carried out?",
    "What technical and personal skills did you gain through your research experience?",
    "How has the programme influenced your academic journey and future career plans?",
    "Did your research lead to any publications, presentations, awards, or other notable outcomes?",
    "What were some of the biggest challenges you faced during your journey, and how did you overcome them?",
    "What advice would you give to students who are considering this programme?",
]


def parse_department(raw: str):
    raw = (raw or "").strip()
    upper = raw.upper()
    if upper.startswith("IDDDP"):
        program = "IDDDP"
        dept = raw[5:].strip()
    elif upper.startswith("DD"):
        program = "DDP"
        dept = raw[2:].strip()
    else:
        program = "DDP"
        dept = raw
    host = HOST_DEPT_MAP.get(dept, dept)
    return program, host


def js_string(value: str) -> str:
    return json.dumps(value or "", ensure_ascii=False)


def render_review(review: dict, indent: str) -> str:
    lines = [
        indent + "{",
        indent + "  name: " + js_string(review["name"]) + ",",
        indent + "  hostDept: " + js_string(review["hostDept"]) + ",",
        indent + "  program: " + js_string(review["program"]) + ",",
        indent + "  sections: [",
    ]
    for section in review["sections"]:
        lines.append(indent + "    { q: " + js_string(section["q"]) + ", a: " + js_string(section["a"]) + " },")
    lines.append(indent + "  ]")
    lines.append(indent + "}")
    return "\n".join(lines)


def main():
    reviews = []
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("Name") or "").strip()
            if not name:
                continue
            program, host = parse_department(row.get("Department", ""))
            sections = []
            for question in QUESTIONS:
                answer = (row.get(question) or "").strip()
                if answer:
                    sections.append({"q": question, "a": answer})
            reviews.append(
                {
                    "name": name,
                    "hostDept": host,
                    "program": program,
                    "sections": sections,
                }
            )

    body = "  var idddpReviews = [\n"
    body += ",\n".join(render_review(review, "    ") for review in reviews)
    body += "\n  ];"

    OUT_PATH.write_text(body + "\n", encoding="utf-8")
    print(f"Wrote {len(reviews)} reviews to {OUT_PATH}")


if __name__ == "__main__":
    main()
