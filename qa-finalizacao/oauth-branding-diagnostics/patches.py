from pathlib import Path
import difflib

qa = Path(__file__).resolve().parent
native = [
    'frontend/oauth/AuthListener.cpp',
    'frontend/oauth/YoutubeAuth.cpp',
    'frontend/wizards/AutoConfigStreamPage.cpp',
    'frontend/dialogs/OBSYoutubeActions.cpp',
    'frontend/importers/studio.cpp',
]

def diff(name, before, after):
    # Read/write bytes explicitly; do not translate Native CRLF.
    return ''.join(difflib.unified_diff(
        before.read_bytes().decode('utf-8').splitlines(keepends=True),
        after.read_bytes().decode('utf-8').splitlines(keepends=True),
        fromfile='a/' + name, tofile='b/' + name, n=3,
    ))

patch = ''.join(diff(name, qa / (Path(name).name + '.before'),
                     qa / (Path(name).name + '.after')) for name in native)
(qa / 'native-oauth-branding.patch').write_bytes(patch.encode('utf-8'))
(qa / 'diagnostic-redaction.patch').write_bytes(diff(
    'ferramentas/diagnostico-producao.mjs',
    qa / 'diagnostico-producao.mjs.before',
    qa / 'diagnostico-producao.mjs.after',
).encode('utf-8'))
print('Unified patches generated from frozen originals/snapshots; no Git invocation.')
