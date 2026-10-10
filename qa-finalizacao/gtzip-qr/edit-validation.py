from pathlib import Path
root=Path(__file__).resolve().parents[2]; qa=Path(__file__).resolve().parent
def edit(name,changes):
 p=root/'obs-vmix/ferramentas'/name; original=p.read_bytes()
 before=qa/(name+'.before')
 if not before.exists():before.write_bytes(original)
 s=original.decode('utf-8'); newline='\r\n' if b'\r\n' in original else '\n'
 for old,new in changes:
  assert old in s,(name,old[:70]);s=s.replace(old,new)
 p.write_bytes(s.replace('\r\n','\n').replace('\n',newline).encode('utf-8'));(qa/(name+'.after')).write_bytes(p.read_bytes())
edit('gtzip-xml.mjs',[
 ("import {validateGtQr}", "import {validateGtQr,validateGtQrField}"),
 ("if(!a.Dimensions)el.qrUnsupported", "if(!a.Dimensions||!/^\\s*\\d+(?:\\.\\d+)?\\s*,\\s*\\d+(?:\\.\\d+)?(?:\\s*,\\s*0(?:\\.0+)?)?\\s*$/.test(a.Dimensions))el.qrUnsupported"),
 ("el.qrUnsupported||validateGtQr(el.text", "el.qrUnsupported||validateGtQrField(el.text")
])
edit('gtzip_converter.mjs',[
 ("font:e.fontFamily,size:e.fontSize,path:e.path}","font:e.fontFamily,size:e.fontSize,path:e.path,...(e.type==='QRCode'?{qr:{width:e.width,height:e.height,unsupported:e.qrUnsupported||null}}:{})}")
])
edit('gc-gtzip.mjs',[
 ("import {validateGCAssets}","import {validateGtQrField} from './gtzip-qr.mjs';\nimport {validateGCAssets}"),
 ("function importedGtPath", "function importedGtPath"),
 ("export function normalizeGtRecord", """function validateQrValues(manifest,values){
 for(const field of manifest.fields.filter(f=>f.type==='QRCode')){
  const value=Object.hasOwn(values,field.name)?values[field.name]:field.default,qr=field.qr;
  const error=!qr?'QR: contrato ausente; importe novamente':qr.unsupported||validateGtQrField(value,qr.width,qr.height);
  if(error)throw Error('Campo QR inválido: '+field.name+' — '+error);
 }
}
export function normalizeGtRecord"""),
 ("await verifyImportedGtTitle(p.panel,record);", "const verifiedManifest=await verifyImportedGtTitle(p.panel,record);"),
 ("  const before=record.values;", "  validateQrValues(verifiedManifest,normalized);\n  const before=record.values;"),
 (" const scene='FreeMix GT '", " validateQrValues(verifiedManifest,record.values);\n const scene='FreeMix GT '")
])
