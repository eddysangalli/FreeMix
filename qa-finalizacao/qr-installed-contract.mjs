import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import vm from 'node:vm';

const [installed,ownRoot]=process.argv.slice(2);assert(installed&&ownRoot&&path.isAbsolute(installed)&&path.isAbsolute(ownRoot));
assert(path.resolve(installed).startsWith(path.resolve(ownRoot)+path.sep));await fs.access(path.join(ownRoot,'.freemix-qa-owned'));
assert.equal(path.resolve(process.execPath),path.join(installed,'runtime','node.exe'));
const output=path.join(ownRoot,'qr-contract');await fs.mkdir(output);
let networkRequests=0;const networkBlocked=()=>{networkRequests++;throw Error('Network forbidden by installed contract fixture');};globalThis.fetch=networkBlocked;
const load=name=>import(pathToFileURL(path.join(installed,'ferramentas',name)).href);
const qr=await load('gtzip-qr.mjs'),bundle=await load('gtzip-qr-bundle.mjs'),xml=await load('gtzip-xml.mjs'),render=await load('gtzip-render.mjs'),converter=await load('gtzip_converter.mjs'),gc=await load('gc-gtzip.mjs');
const results=[];function check(name,value){assert(value,name);results.push({name,status:'PASS'});}
const text='São Paulo — https://example.invalid/live',escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const field=`<QRCode Name="Link" Dimensions="170,170,0" Location="24,32,0" Text="${escape(text)}"/>`,wrap=s=>`<Composition Width="640" Height="360">${s}</Composition>`;
const direct=xml.parseGtXml(wrap(field)),group=xml.parseGtXml(wrap(`<Layer Name="Layer" Dimensions="640,360,0"><Layer.Composition><Composition>${field}</Composition></Layer.Composition></Layer>`));
const object=d=>[...xml.gtObjects(d)].find(e=>e.type==='QRCode'),strip=e=>{const {path,...rest}=e;return rest;};
check('direct/group contract equivalent',JSON.stringify(strip(object(direct)))===JSON.stringify(strip(object(group))));
check('UTF8 parser and dimensions',object(direct).text===text&&object(direct).width===170&&object(direct).height===170&&direct.diagnostics.length===0);
check('bundled helper has no external dependency',typeof bundle.gtQrEncoderFactory==='function'&&bundle.gtQrEncoderFactory().create([{data:text,mode:'byte'}],{errorCorrectionLevel:'M'}).modules.size>0);
for(const [name,value]of [['empty',''],['control','a\nb'],['high surrogate','\ud800'],['low surrogate','\udc00'],['513 UTF8 bytes','é'.repeat(257)]])check('reject '+name,!!qr.validateGtQr(value,170,170));
check('512 UTF8 byte limit accepted',qr.validateGtQrField('é'.repeat(256),170,170)===null);
for(const [w,h]of [[170,80],[170.1,170.1],[2049,2049]])check('reject dimensions '+w+'x'+h,!!qr.validateGtQrField(text,w,h));
check('minimum pixels/module enforced',!!qr.validateGtQrField('x',16,16));
check('unsupported option diagnosed',xml.parseGtXml(wrap(field.replace('/>',' ErrorCorrectionLevel="H"/>'))).diagnostics.some(d=>d.message.startsWith('QR:')));
check('render includes local QR script',render.generateHtml(direct).includes('src="./gt-qr.js"'));
const table=Array.from({length:256},(_,v)=>{for(let i=0;i<8;i++)v=(v>>>1)^((v&1)?0xedb88320:0);return v>>>0;});
function storedZip(document){const name=Buffer.from('document.xml'),data=Buffer.from(document);let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;const local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);const start=local.length+name.length+data.length;end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(start,16);return Buffer.concat([local,name,data,central,name,end]);}
const archive=path.join(output,'own.gtzip');await fs.writeFile(archive,storedZip(wrap(field+'<TextBlock Name="Caption" Text="Original"/>')),{flag:'wx'});
const before=await fs.readFile(archive),preview=converter.inspectGtzipFile(archive);check('preview is read only',preview.preview&&preview.written===false&&preview.appStarted===false);
assert.throws(()=>converter.convertGtzipFile(archive,output,{folderName:'Stale',expectedSha256:'0'.repeat(64)}),/prévia/);check('preview hash rejects stale import',true);
const converted=converter.convertGtzipFile(archive,output,{folderName:'OwnQR',expectedSha256:preview.sourceSha256}),manifest=converted.manifest;
check('manifest editable QR contract',manifest.fields[0].type==='QRCode'&&manifest.fields[0].default===text&&JSON.stringify(manifest.fields[0].qr)===JSON.stringify({width:170,height:170,unsupported:null}));
const files=[];for(const f of manifest.files){const bytes=await fs.readFile(path.join(converted.folder,f.path));assert.equal(bytes.length,f.size);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);files.push({path:f.path,sha256:f.sha256,bytes:f.size});}check('all generated file hashes valid',true);
const license=await fs.readFile(path.join(converted.folder,'QR-LICENSE.txt'),'utf8'),runtime=await fs.readFile(path.join(converted.folder,'gt-qr.js'),'utf8');
check('MIT licenses bundled and exact',license===qr.GT_QR_LICENSE&&license.includes('Ryan Day')&&license.includes('Wyatt Baldwin')&&license.includes('Permission is hereby granted'));
check('runtime exact without external dependencies',runtime===qr.GT_QR_RUNTIME_SCRIPT&&!runtime.includes('node_modules'));
check('archive unchanged',before.equals(await fs.readFile(archive)));assert.throws(()=>converter.convertGtzipFile(archive,output,{folderName:'OwnQR'}),/já existe/);check('existing destination preserved',true);
// Actual installed QR runtime executed with a finite DOM adapter; this is not a browser/scan proof.
function element(){return {dataset:{qrWidth:'170',qrHeight:'170'},children:[],attrs:{},replaceChildren(){this.children=[];},setAttribute(k,v){this.attrs[k]=v;},append(...v){this.children.push(...v);}};}
const context={window:{fetch:networkBlocked,XMLHttpRequest:networkBlocked,WebSocket:networkBlocked},fetch:networkBlocked,XMLHttpRequest:networkBlocked,WebSocket:networkBlocked,document:{createElementNS:()=>element()},TextEncoder};vm.runInNewContext(runtime,context,{timeout:5000});const el=element(),first=context.window.FreeMixGtQr.render(el,text);check('installed SVG runtime renders ECC M/quiet zone4',first.ok&&el.children[0].attrs.viewBox===`0 0 ${first.modules+8} ${first.modules+8}`&&context.window.FreeMixGtQr.contract.ecc==='M');
check('invalid update clears stale QR',!context.window.FreeMixGtQr.render(el,'').ok&&el.children.length===0);check('valid update recovers QR',context.window.FreeMixGtQr.render(el,text).ok&&el.children.length===1);
const id=randomUUID(),panel=path.join(output,'panel'),recordConverted=converter.convertGtzipFile(archive,path.join(panel,'gc/gt_titles'),{folderName:'gt_'+id}),record={id,name:'QA installed QR',manifestSha256:recordConverted.manifestSha256,fields:recordConverted.manifest.fields,resolution:recordConverted.manifest.resolution,values:{}};
let saves=0,nativeRequests=0;const engine={imports:[record],p:{panel,state:{overlays:[],program:'QA'},req:()=>{nativeRequests++;throw Error('Native forbidden');}},save:async()=>{saves++;await fs.writeFile(path.join(output,'state.json'),JSON.stringify(engine.imports));}};
await gc.verifyImportedGtTitle(panel,record);const saved=await gc.executeGtImport(engine,{operation:'save',id,values:{Link:text,Caption:'Changed'}});check('installed GC saves valid editable fields',saved.saved&&record.values.Link===text&&saves===1);
const stateBefore=await fs.readFile(path.join(output,'state.json'));await assert.rejects(gc.executeGtImport(engine,{operation:'save',id,values:{Link:''}}),/Campo QR inválido/);check('invalid edit preserves memory/disk',record.values.Link===text&&stateBefore.equals(await fs.readFile(path.join(output,'state.json')))&&saves===1);
record.values.Link='é'.repeat(257);await assert.rejects(gc.executeGtImport(engine,{operation:'prepare',id}),/Campo QR inválido/);check('invalid prepare makes zero Native requests',nativeRequests===0);
check('no network API requested',networkRequests===0);const report={status:'PASS_INSTALLED_NODE_QR_CONVERTER',nodeVersion:process.version,installedNode:true,checks:results.length,results,files,licenseSha256:createHash('sha256').update(license).digest('hex'),networkRequests,nodeModulesRequired:false,nativeRequests,nativeStarted:false,limits:['Runtime uses finite DOM adapter in Node; no Native CEF/browser/independent scan proof','QR Text only/ECC M/quiet-zone4/UTF8<=512/square16..2048/one pixel per module','No proprietary title/font/reference assets copied; all fixtures own']};await fs.writeFile(path.join(ownRoot,'qr-contract-result.json'),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({status:report.status,checks:results.length}));
