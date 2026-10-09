"""Create a new ZIP from an already verified full package; preserve prior receipts."""
import argparse
import hashlib
import json
import pathlib
import stat
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--receipt', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--result', required=True)
args = parser.parse_args()
receipt_path = pathlib.Path(args.receipt).resolve()
output = pathlib.Path(args.output).resolve()
result_path = pathlib.Path(args.result).resolve()
receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
assert receipt['status'] == 'PASS' and receipt['signatureVerified'] and receipt['allHashesVerified']
root = pathlib.Path(receipt['root']).resolve()
assert root.name == 'FreeMix-Completo-' + receipt['version']
assert output == pathlib.Path(str(root) + '.zip'), 'ZIP must be beside this verified package'
sha_path = pathlib.Path(str(output) + '.sha256')
assert not output.exists() and not result_path.exists() and not sha_path.exists(), 'Preserve existing ZIP, receipt and hash'
assert result_path not in root.parents and not result_path.is_relative_to(root)
assert result_path not in (receipt_path, output), 'Receipt paths must be distinct'
raw = (root / 'manifest.json').read_bytes()
signature = (root / 'manifest.sig').read_bytes()
assert hashlib.sha256(raw).hexdigest() == receipt['manifestHash']
manifest = json.loads(raw)
assert manifest['version'] == receipt['version'] and manifest['kind'] == 'freemix-portable-full'
expected = {root.name + '/' + item['path'] for item in manifest['files']}
assert len(expected) == len(manifest['files'])
expected.update((root.name + '/manifest.json', root.name + '/manifest.sig'))
files = []
for file in sorted(root.rglob('*')):
    info = file.lstat()
    assert not file.is_symlink() and not (getattr(info, 'st_file_attributes', 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT), str(file)
    if file.is_file():
        files.append((file, file.relative_to(root.parent).as_posix()))
    else:
        assert file.is_dir()
assert {name for _, name in files} == expected and len(files) == len(expected)
result_path.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
    for file, name in files:
        archive.write(file, name)
with zipfile.ZipFile(output) as archive:
    names = archive.namelist()
    assert len(names) == len(set(names)) and set(names) == expected
    assert archive.read(root.name + '/manifest.json') == raw
    assert archive.read(root.name + '/manifest.sig') == signature
    for item in manifest['files']:
        digest, size = hashlib.sha256(), 0
        with archive.open(root.name + '/' + item['path']) as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
                size += len(chunk)
        assert size == item['size'] and digest.hexdigest() == item['sha256'], item['path']
digest = hashlib.sha256()
with output.open('rb') as stream:
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        digest.update(chunk)
result = {**receipt, 'zip': str(output), 'zipBytes': output.stat().st_size,
          'zipSha256': digest.hexdigest(), 'zipPayloadVerified': True,
          'receiptInput': str(receipt_path), 'crcAndHashesVerified': True}
with result_path.open('x', encoding='utf-8') as stream:
    json.dump(result, stream, indent=2)
with sha_path.open('x', encoding='utf-8') as stream:
    stream.write(digest.hexdigest() + '  ' + output.name + '\n')
print(json.dumps({'status': 'PASS', 'zip': str(output), 'files': len(files),
                  'crcAndHashesVerified': True, 'result': str(result_path)}))
