import docx
import glob
import os

files = glob.glob('documentos/*.docx')

for f in files:
    print("=" * 60)
    print(f"FILE: {os.path.basename(f)}")
    print("=" * 60)
    doc = docx.Document(f)
    for i, p in enumerate(doc.paragraphs):
        if not p.text.strip():
            continue
        # Check if the whole paragraph is bold
        is_bold = all(run.bold for run in p.runs) if p.runs else False
        has_bold = any(run.bold for run in p.runs) if p.runs else False
        style = p.style.name
        print(f"[{i:02d}] Style: {style:10} | Bold: {is_bold}/{has_bold} | Text: {p.text[:80]}")
    print()
