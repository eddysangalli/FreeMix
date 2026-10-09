import json, pathlib, zipfile, hashlib, datetime
receipt_path=pathlib.Path('qa-finalizacao/resultado-alpha-beta-kit.json')
r=json.loads(receipt_path.read_text(encoding='utf-8'))
assert r['status']=='PASS'
root=pathlib.Path(r['root']); target=pathlib.Path(str(root)+'.zip')
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
expected={f['path']:f['sha256'] for f in manifest['files']}
for f in root.rglob('*'):
    assert not f.is_symlink()
assert {f.relative_to(root).as_posix() for f in root.rglob('*') if f.is_file()}==set(expected)|{'manifest.json','manifest.sig'}
with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
    for f in sorted(root.rglob('*')):
        if f.is_file(): z.write(f,f.relative_to(root.parent).as_posix())
with zipfile.ZipFile(target) as z:
    names=z.namelist(); assert len(names)==len(set(names))
    for name,sha in expected.items():
        with z.open(root.name+'/'+name) as stream:
            h=hashlib.sha256()
            for b in iter(lambda:stream.read(1024*1024),b''): h.update(b)
        assert h.hexdigest()==sha,name
    assert set(names)=={root.name+'/'+name for name in expected}|{root.name+'/manifest.json',root.name+'/manifest.sig'}
h=hashlib.sha256()
with target.open('rb') as stream:
    for b in iter(lambda:stream.read(1024*1024),b''): h.update(b)
r.update(zip=str(target),zipBytes=target.stat().st_size,zipSha256=h.hexdigest(),zipPayloadVerified=True,zipCheckedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
pathlib.Path(str(target)+'.sha256').write_text(h.hexdigest()+'  '+target.name+'\n',encoding='utf-8')
receipt_path.write_text(json.dumps(r,indent=2),encoding='utf-8')
print(json.dumps(r))
