import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const types={png:['image','image/png'],jpg:['image','image/jpeg'],webp:['image','image/webp'],bmp:['image','image/bmp'],ttf:['font','font/ttf'],otf:['font','font/otf'],woff2:['font','font/woff2']};
export async function importGCAsset(panel,d){
 const ext=String(d.extension||'').toLowerCase().replace(/^\./,'').replace(/^jpeg$/,'jpg'),type=types[ext];
 if(!type||type[0]!==d.kind||typeof d.base64!=='string'||d.base64.length>2800000||d.base64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(d.base64))throw Error('Imagem/fonte inválida ou maior que 2 MB');
 const b=Buffer.from(d.base64,'base64');if(b.length<12||b.length>2*1024*1024||b.toString('base64')!==d.base64)throw Error('Arquivo vazio, inválido ou maior que 2 MB');
 const magic=b.toString('ascii',0,4),valid=ext==='png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='jpg'?b[0]===255&&b[1]===216&&b[2]===255:ext==='webp'?magic==='RIFF'&&b.toString('ascii',8,12)==='WEBP':ext==='bmp'?b[0]===66&&b[1]===77:ext==='woff2'?magic==='wOF2':ext==='otf'?magic==='OTTO':b.readUInt32BE(0)===0x10000||magic==='true';
 if(!valid)throw Error('O conteúdo não corresponde ao formato escolhido');
 const token=createHash('sha256').update(b).digest('hex')+'.'+ext,dir=join(panel,'gc/biblioteca/assets'),file=join(dir,token);await mkdir(dir,{recursive:true});
 try{const old=await readFile(file);if(!old.equals(b))throw Error('Asset existente divergente');}catch(e){if(e.code!=='ENOENT')throw e;const tmp=file+'.'+randomUUID()+'.tmp';await writeFile(tmp,b);await rename(tmp,file);}
 return {kind:d.kind,token,bytes:b.length,mime:type[1]};
}
export async function validateGCAssets(panel,data){for(const key of ['imageAsset','fontAsset']){const token=data[key];if(!token)continue;const bytes=await readFile(join(panel,'gc/biblioteca/assets',token)).catch(()=>{throw Error('Arquivo do título ausente: importe novamente a imagem/fonte');});if(createHash('sha256').update(bytes).digest('hex')!==token.split('.')[0])throw Error('Imagem/fonte alterada após importação');}}
