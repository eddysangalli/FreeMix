import {createReadStream, createWriteStream} from 'node:fs';
import {mkdir, stat, writeFile, rename, rm} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname, resolve, basename, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const workspace=resolve(here,'../..');
const args=process.argv.slice(2), options={};
for(const arg of args) { const i=arg.indexOf('='); if(i<0) throw Error('Use --zip=... e --output=...'); const name=arg.slice(0,i), value=arg.slice(i+1); if(!['--zip','--output'].includes(name)||!value||options[name])throw Error('Argumento inválido: '+name); options[name]=value; }
const zip=resolve(options['--zip']??join(workspace,'entregas/FreeMix-Completo-0.1.0-local.20261009153453.zip'));
const output=resolve(options['--output']??join(workspace,'entregas/FreeMix-Studio-Setup-0.1.0-local.20261009153453.exe'));
const root=basename(zip,'.zip');
if(!/^FreeMix-Completo-[A-Za-z0-9._-]+$/.test(root))throw Error('Nome do pacote completo inválido.');
if(zip.toLowerCase()===output.toLowerCase())throw Error('A saída deve ser diferente do pacote de entrada.');
const size=(await stat(zip)).size;
if(size<22||size>5e9)throw Error('Tamanho ZIP inválido.');
await mkdir(join(here,'build'),{recursive:true}); await mkdir(dirname(output),{recursive:true});
console.log('Calculando SHA-256 do ZIP assinado (streaming)...');
const hash=createHash('sha256'); for await(const chunk of createReadStream(zip)) hash.update(chunk); const sha=hash.digest('hex');
const generated=join(here,'build/PayloadInfo.cs'), stub=join(here,'build/FreeMix-Setup-Stub.exe');
await writeFile(generated,`namespace FreeMixSetup { internal static class PayloadInfo { public const string Sha256 = "${sha}"; public const long Length = ${size}L; public const string Root = "${root}"; public const string Version = "${root.slice('FreeMix-Completo-'.length)}"; } }\n`);
const framework=join(process.env.WINDIR??'C:/Windows','Microsoft.NET/Framework64/v4.0.30319');
console.log('Compilando WinForms .NET Framework x64...');
execFileSync(join(framework,'csc.exe'),['/nologo','/target:winexe','/platform:x64','/optimize+','/utf8output','/out:'+stub,'/reference:System.dll','/reference:System.Core.dll','/reference:System.Drawing.dll','/reference:System.Windows.Forms.dll','/reference:'+join(framework,'System.IO.Compression.dll'),join(here,'Setup.cs'),generated],{stdio:'inherit',windowsHide:true});
const partial=output+'.partial';
try {
  console.log('Montando EXE único (streaming)...');
  await pipeline(createReadStream(stub),createWriteStream(partial,{flags:'wx'}));
  await pipeline(createReadStream(zip),createWriteStream(partial,{flags:'a'}));
  const footer=Buffer.alloc(84);footer.writeBigInt64LE(BigInt(size),0);footer.write(sha,8,64,'ascii');footer.write('FMXSETUPV001',72,12,'ascii');
  await pipeline((await import('node:stream')).Readable.from([footer]),createWriteStream(partial,{flags:'a'}));
  await rename(partial,output);
} catch(error) { await rm(partial,{force:true});throw error; }
const exeHash=createHash('sha256');for await(const chunk of createReadStream(output))exeHash.update(chunk);
const result={format:1,output,bytes:(await stat(output)).size,sha256:exeHash.digest('hex'),payload:{zip,bytes:size,sha256:sha,root},authenticodeSigned:false,uninstallerIncluded:false,builtAt:new Date().toISOString()};
await writeFile(output+'.build.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
