import {readFile,stat,mkdir,writeFile,rename} from 'node:fs/promises';
import {join,extname,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
export async function localBackground(root,file){
 if(typeof file!=='string'||!isAbsolute(file)||!['.png','.jpg','.jpeg','.webp','.bmp'].includes(extname(file).toLowerCase()))throw Error('Selecione uma imagem local PNG, JPEG, WebP ou BMP com caminho completo');
 const info=await stat(file);if(!info.isFile()||info.size>32*1024*1024)throw Error('Fundo: use imagem local de até 32 MB');
 const bytes=await readFile(file),png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,bmp=bytes[0]===66&&bytes[1]===77,webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!png&&!jpg&&!bmp&&!webp)throw Error('O arquivo não contém uma imagem compatível');
 const dir=join(root,'config/obs-studio/plugin_config/freemix-inputs/assets'),target=join(dir,'background-'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+extname(file).toLowerCase());await mkdir(dir,{recursive:true});
 try{await stat(target);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(target+'.tmp',bytes);await rename(target+'.tmp',target);}return target;
}
