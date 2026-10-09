import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {noGtLinks} from './gtzip-archive.mjs';
import {sfntFamily} from './gtzip-fonts.mjs';
const types={png:['image','image/png'],jpg:['image','image/jpeg'],webp:['image','image/webp'],bmp:['image','image/bmp'],ttf:['font','font/ttf'],otf:['font','font/otf'],woff2:['font','font/woff2']};
const libreToken='08e4623805102d819f58601e46e345648846075e363b2ceb23313c2d1c83ec73.ttf';
export async function importGCAsset(panel,d){
 if(d?.kind==='font'&&d.freeFont==='bebas-neue'){const source=fileURLToPath(new URL('../painel/gc/fontes-livres/BebasNeue-Regular.ttf',import.meta.url));noGtLinks(source);return importGCAsset(panel,{kind:'font',extension:'ttf',base64:(await readFile(source)).toString('base64')});}
 const ext=String(d.extension||'').toLowerCase().replace(/^\./,'').replace(/^jpeg$/,'jpg'),type=types[ext];
 if(!type||type[0]!==d.kind||typeof d.base64!=='string'||d.base64.length>2800000||d.base64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(d.base64))throw Error('Imagem/fonte inválida ou maior que 2 MB');
 const b=Buffer.from(d.base64,'base64');if(b.length<12||b.length>2*1024*1024||b.toString('base64')!==d.base64)throw Error('Arquivo vazio, inválido ou maior que 2 MB');
 const magic=b.toString('ascii',0,4),valid=ext==='png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='jpg'?b[0]===255&&b[1]===216&&b[2]===255:ext==='webp'?magic==='RIFF'&&b.toString('ascii',8,12)==='WEBP':ext==='bmp'?b[0]===66&&b[1]===77:ext==='woff2'?magic==='wOF2':ext==='otf'?magic==='OTTO':b.readUInt32BE(0)===0x10000||magic==='true';
 if(!valid)throw Error('O conteúdo não corresponde ao formato escolhido');
 const token=createHash('sha256').update(b).digest('hex')+'.'+ext,dir=join(panel,'gc/biblioteca/assets'),file=join(dir,token);noGtLinks(file);await mkdir(dir,{recursive:true});
 try{const old=await readFile(file);if(!old.equals(b))throw Error('Asset existente divergente');}catch(e){if(e.code!=='ENOENT')throw e;const tmp=file+'.'+randomUUID()+'.tmp';await writeFile(tmp,b);await rename(tmp,file);}
 if(token===libreToken){const source=fileURLToPath(new URL('../painel/gc/fontes-livres/OFL-BebasNeue.txt',import.meta.url)),target=join(dir,token+'.OFL.txt');noGtLinks(source);noGtLinks(target);const license=await readFile(source);try{const old=await readFile(target);if(!old.equals(license))throw Error('Licença local existente divergente');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(target,license,{flag:'wx'});}}
 return {kind:d.kind,token,bytes:b.length,mime:type[1],...(d.kind==='font'?{family:sfntFamily(b),installationScope:'title-only',automaticDownload:false,...(token===libreToken?{license:'SIL OFL 1.1'}:{})}:{})};
}
export async function gcAssetLicense(panel,token){if(token!==libreToken)return undefined;const file=join(panel,'gc/biblioteca/assets',token+'.OFL.txt');noGtLinks(file);return readFile(file,'utf8');}
export async function validateGCAssets(panel,data){for(const key of ['imageAsset','fontAsset']){const token=data[key];if(!token)continue;if(typeof token!=='string'||!new RegExp('^[a-f0-9]{64}\\.'+(key==='fontAsset'?'(?:ttf|otf|woff2)':'(?:png|jpg|webp|bmp)')+'$').test(token))throw Error('Token de asset inválido');const file=join(panel,'gc/biblioteca/assets',token);noGtLinks(file);const bytes=await readFile(file).catch(()=>{throw Error('Arquivo do título ausente: importe novamente a imagem/fonte');});if(createHash('sha256').update(bytes).digest('hex')!==token.split('.')[0])throw Error('Imagem/fonte alterada após importação');}}
