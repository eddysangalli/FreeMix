from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];qa=Path(__file__).resolve().parent;draft=qa/'draft';draft.mkdir(exist_ok=True)
files=['gtzip-xml.mjs','gtzip-render.mjs','gtzip_converter.mjs','gtzip-qr.mjs','gtzip-qr-bundle.mjs','gt_utils.mjs','gtzip-archive.mjs','gtzip-fonts.mjs','gtzip-runtime.mjs']
pins=[]
for name in files:
 data=(root/'obs-vmix/ferramentas'/name).read_bytes();(draft/name).write_bytes(data);(qa/(name+'.baseline')).write_bytes(data)
 pins.append({'path':'obs-vmix/ferramentas/'+name,'sha256':hashlib.sha256(data).hexdigest()})
(qa/'baseline-pins.json').write_text(json.dumps(pins,indent=2),encoding='utf8')
