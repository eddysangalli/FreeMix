import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {GT_QR_LICENSE} from '../../ferramentas/gtzip-qr.mjs';
const qa=import.meta.dirname;
fs.writeFileSync(path.join(qa,'QR-LICENSE.txt'),GT_QR_LICENSE);
const dependencies=fs.readdirSync(path.join(qa,'decoder-deps')).filter(n=>n.endsWith('.pyd')).map(name=>({name,sha256:createHash('sha256').update(fs.readFileSync(path.join(qa,'decoder-deps',name))).digest('hex')}));
fs.writeFileSync(path.join(qa,'decoder-provenance.json'),JSON.stringify({name:'zxing-cpp',version:'2.3.0',purpose:'Independent QA decoder only, not product dependency',dependencies},null,2));
