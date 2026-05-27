import hashlib
import json
from pathlib import Path

CAT = Path('data/imagenes_senderos/catalogo.json')
TMP_DIR = Path('tmp')

def sha1(path: Path):
    try:
        return hashlib.sha1(path.read_bytes()).hexdigest()
    except Exception:
        return None

if not CAT.exists():
    print('catalogo.json not found:', CAT)
    raise SystemExit(1)

cat = json.loads(CAT.read_text(encoding='utf-8'))
print('Catalogo entries and hashes:')
hash_to_keys = {}
for key, entry in cat.items():
    ext = Path(entry.get('extension')) if entry.get('extension') else None
    h = sha1(ext) if ext and ext.exists() else None
    print(f"{key} -> {ext} -> {h}")
    if h:
        hash_to_keys.setdefault(h, []).append((key, str(ext)))

print('\nTmp images:')
for p in sorted(TMP_DIR.glob('page36_img*.png')):
    print(p.name, sha1(p))

print('\nDuplicates (same hash across catalog entries):')
for h, items in hash_to_keys.items():
    if len(items) > 1:
        print(h)
        for k, p in items:
            print('  ', k, p)

# Cross-check: any tmp image matching a catalog image
print('\nMatches between tmp and catalog images:')
for p in sorted(TMP_DIR.glob('page36_img*.png')):
    ph = sha1(p)
    for h, items in hash_to_keys.items():
        if ph == h:
            print(p.name, '==', h)
            for k, path in items:
                print('   maps to catalog key', k, '->', path)
