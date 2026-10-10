from pathlib import Path
import difflib

root = Path(__file__).resolve().parent
before = (root / 'before/FreeMixMultistream.cpp').read_bytes().decode('utf-8').replace('\r\n', '\n')
after = (root / 'draft/FreeMixMultistream.cpp').read_bytes().decode('utf-8').replace('\r\n', '\n')
patch = ''.join(difflib.unified_diff(before.splitlines(keepends=True), after.splitlines(keepends=True),
    fromfile='a/frontend/widgets/FreeMixMultistream.cpp', tofile='b/frontend/widgets/FreeMixMultistream.cpp', n=4))
assert patch.startswith('--- a/frontend/widgets/FreeMixMultistream.cpp\n')
(root / 'network-and-talkback-readonly.patch').write_bytes(patch.encode('utf-8'))
print('OFFSIDE_PATCH_WRITTEN')
