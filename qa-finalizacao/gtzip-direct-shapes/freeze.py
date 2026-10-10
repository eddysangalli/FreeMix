from pathlib import Path
import difflib, hashlib, json, datetime
qa = Path(__file__).resolve().parent
before = (qa / 'gtzip-xml.mjs.before').read_bytes()
after = (qa.parent.parent / 'obs-vmix/ferramentas/gtzip-xml.mjs').read_bytes()
receipt = json.loads((qa / 'resultado.json').read_text(encoding='utf-8'))
assert receipt['status'] == 'PASS'
assert hashlib.sha256(after).hexdigest() == receipt['source']['sha256']
(qa / 'gtzip-xml.mjs.after').write_bytes(after)
patch = ''.join(difflib.unified_diff(before.decode().splitlines(keepends=True), after.decode().splitlines(keepends=True), fromfile='a/ferramentas/gtzip-xml.mjs', tofile='b/ferramentas/gtzip-xml.mjs', n=3))
(qa / 'gtzip-direct-shapes.patch').write_bytes(patch.encode('utf-8'))
files = []
for path in sorted(qa.iterdir()):
    if path.name == 'ALLOWLIST.json':
        continue
    assert path.is_file()
    data = path.read_bytes()
    files.append({'path': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
manifest = {'status': 'FROZEN_PASS', 'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'productSource': receipt['source'], 'cases': receipt['cases'], 'files': files}
(qa / 'ALLOWLIST.json').write_bytes((json.dumps(manifest, ensure_ascii=False, indent=2)+'\n').encode('utf-8'))
print(json.dumps({'files': len(files), 'allowlistSha256': hashlib.sha256((qa / 'ALLOWLIST.json').read_bytes()).hexdigest(), 'sourceSha256': hashlib.sha256(after).hexdigest()}))
