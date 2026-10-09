import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {DiagnosticCollector} from './diagnostico-producao.mjs';
const args=process.argv.slice(2),root=resolve(args[0]||fileURLToPath(new URL('../',import.meta.url)));
try{const result=await new DiagnosticCollector(root).generate();console.log(`\nDiagnóstico gerado: ${result.path}\n${result.report.logs.length} logs; ${(result.size/1024/1024).toFixed(1)} MB.\nRevise o ZIP e envie por e-mail ou WhatsApp. Nada foi enviado automaticamente.\n`);if(args.includes('--mostrar')&&process.platform==='win32'){const child=spawn(join(process.env.WINDIR||'C:\\Windows','explorer.exe'),['/select,',result.path],{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>{});child.unref();}}catch(e){console.error('Não foi possível gerar o diagnóstico: '+e.message);process.exitCode=1;}
