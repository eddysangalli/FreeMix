import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,dirname,isAbsolute} from 'node:path';

// Only literal relative module imports extend the explicit runtime allowlist.
// This never imports or executes the operator's modules.
export async function runtimeDependencyClosure(toolsRoot, entries, {copiedModuleRoots=[]}={}) {
  const root=resolve(toolsRoot), files=new Set(entries), queue=[...files];
  const allowed=[root,...copiedModuleRoots.map(p=>resolve(p))];
  const withinAllowed=file=>allowed.some(base=>{const rel=relative(base,file);return !isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../');});
  const importPattern=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"\r\n]+)\1/g;
  for(let i=0;i<queue.length;i++) {
    const name=queue[i], file=resolve(root,name);
    if(!withinAllowed(file))throw Error('Dependência fora das ferramentas: '+name);
    if(!(await stat(file)).isFile())throw Error('Ferramenta não é arquivo: '+name);
    if(!/\.(?:mjs|js)$/i.test(name))continue;
    const code=await readFile(file,'utf8');
    for(const match of code.matchAll(importPattern)) {
      const dependency=resolve(dirname(file),match[2]), dependencyName=relative(root,dependency).replaceAll('\\','/');
      if(!withinAllowed(dependency))throw Error('Importação fora das ferramentas: '+name+' → '+match[2]);
      if(!files.has(dependencyName)){files.add(dependencyName);queue.push(dependencyName);}
    }
  }
  return [...files].sort();
}
