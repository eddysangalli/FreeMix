from pathlib import Path
qa=Path(__file__).resolve().parent
s=(qa.parent/'localvocal-shutdown/test-native.mjs').read_text()
s=s[:s.index('const receipt=')]
s=s.replace("'node:fs/promises';","'node:fs/promises';")
s=s.replace("import {resolve,join}","import {tmpdir} from 'node:os';\nimport {randomUUID} from 'node:crypto';\nimport {resolve,join}")
s=s.replace("const suite=process.argv.includes('--suite');","const suite=true;")
s=s.replace("const ndi=process.argv.includes('--ndi');","const ndi=true;")
s=s.replace("const root=(await readFile(join(qa,'runtime-path.txt'),'utf8')).trim();","const baseRoot=(await readFile(join(qa,'runtime-path.txt'),'utf8')).trim();\nconst root=join(tmpdir(),'FreeMix-QA-LocalVocal-'+randomUUID().replaceAll('-',''));\nfor(const dir of ['bin','data','obs-plugins'])await cp(join(baseRoot,dir),join(root,dir),{recursive:true});\nawait cp(resolve('freemix-app/build_2026/rundir/RelWithDebInfo/bin/64bit'),join(root,'bin/64bit'),{recursive:true,force:true});\nassert.equal(createHash('sha256').update(await readFile(join(root,'bin/64bit/FreeMix.exe'))).digest('hex'),'1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744');\nawait mkdir(join(root,'runtime'),{recursive:true});\nfor(const name of ['ffmpeg.exe','ffprobe.exe'])await cp(resolve('obs-vmix/runtime',name),join(root,'runtime',name));\nawait writeFile(resolve('qa-finalizacao/replay-completo/cef-runtime-path.txt'),root);")
s+='\nexport {root,child,exit,port};\n'
(qa/'cef-bootstrap.mjs').write_text(s)
