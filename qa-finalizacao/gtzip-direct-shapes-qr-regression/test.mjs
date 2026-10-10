import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {parseGtXml} from '../../ferramentas/gtzip-xml.mjs';
import {generateHtml} from '../../ferramentas/gtzip-render.mjs';

const qa=resolve(import.meta.dirname),root=resolve(qa,'../..'),results=[];
const check=(id,pass)=>{results.push({id,pass:!!pass});if(!pass)throw Error(id);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const wrap=objects=>`<Composition Width="1920" Height="1080">${objects}</Composition>`;
const grouped=objects=>wrap(`<Layer Name="Shapes" Dimensions="1920,1080,0"><Layer.Composition><Composition>${objects}</Composition></Layer.Composition></Layer>`);
const nested=objects=>wrap(`<Group Name="Outer" Dimensions="1920,1080,0"><Group Name="Inner" Dimensions="1920,1080,0">${objects}</Group></Group>`);
const polygon='<Polygon Name="Polygon" Dimensions="120,80,0" Location="24,32,0" Points="0,0 120,0 60,80" Opacity="0.7" StrokeThickness="2"><Polygon.Fill><Brush Type="Solid" Color="#FF00AA44"/></Polygon.Fill><Polygon.Stroke><Brush Type="Solid" Color="#FFFFFFFF"/></Polygon.Stroke><Polygon.Transform><Transform Rotate="0,0,0.5" Scale="1.2,0.8,1" Translate="4,8,0" Origin="0.25,0.5,0"/></Polygon.Transform><Polygon.Crop><Crop Range="0,0.1,0.9,1"/></Polygon.Crop></Polygon>';
const path='<Path Name="Path" Dimensions="200,100,0" Location="160,48,0" Data="M0,0 L200,0 L100,100 Z" Opacity="0.9"><Path.Fill><Brush Type="Solid" Color="#FFFFCC00"/></Path.Fill></Path>';
const animation='<Storyboard Type="TransitionIn"><Fade Object="Polygon" Duration="0.8" Delay="0.1"/><Fly Object="Path" Direction="Right" Duration="0.7"/></Storyboard>';
const fixture=wrap(polygon+path+animation);
const strip=e=>{const {path,...rest}=e;return rest;};
try{
 await writeFile(join(qa,'direct.xml'),fixture);
 await writeFile(join(qa,'grouped.xml'),grouped(polygon+path+animation));
 await writeFile(join(qa,'nested.xml'),nested(polygon+path+animation));
 const baselineSource=(await readFile(join(qa,'gtzip-xml.mjs.before'),'utf8')).replace("from './gt_utils.mjs'",`from '${pathToFileURL(join(root,'obs-vmix/ferramentas/gt_utils.mjs')).href}'`);
 const baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineSource).toString('base64'));
 const lost=baseline.parseGtXml(wrap(polygon+path));
 check('baseline-direct-loses-both',lost.layers.length===0);
 check('baseline-direct-silent-warning',lost.warnings.length===0);
 const direct=parseGtXml(fixture),group=parseGtXml(grouped(polygon+path+animation)),nest=parseGtXml(nested(polygon+path+animation));
 const d=direct.layers[0].elements,g=group.layers[0].elements,n=nest.layers[0].children[0].elements;
 check('direct-two-shapes',d.length===2&&d[0].type==='Polygon'&&d[1].type==='Path');
 check('direct-order-preserved',direct.layers[0].order.map(x=>x.name).join(',')==='Polygon,Path');
 d.forEach((e,i)=>{check(`group-equivalence-${i}`,JSON.stringify(strip(e))===JSON.stringify(strip(g[i])));check(`nested-equivalence-${i}`,JSON.stringify(strip(e))===JSON.stringify(strip(n[i])));});
 check('polygon-points-retained',d[0].geometry==='0,0 120,0 60,80');
 check('path-data-retained',d[1].geometry==='M0,0 L200,0 L100,100 Z');
 check('dimensions-position-opacity',d[0].width===120&&d[0].height===80&&d[0].x===24&&d[0].y===32&&d[0].opacity===0.7);
 check('transform-crop-retained',d[0].scale.join(',')==='1.2,0.8'&&d[0].translate.join(',')==='4,8'&&d[0].origin.join(',')==='0.25,0.5'&&d[0].crop.join(',')==='0,0.1,0.9,1');
 check('fill-stroke-retained',d[0].fill.color==='rgba(0, 170, 68, 1)'&&d[0].strokeThickness===2);
 check('storyboard-targets-no-warning',direct.storyboards[0].animations.map(x=>x.target).join(',')==='Polygon,Path'&&direct.warnings.length===0);
 // Supported root primitives should retain the same converted object properties as grouped nodes.
 const types=['Rectangle','Image','TextBlock','Ellipse','Triangle','RightTriangle','Polygon','Path','Ticker'];
 for(const type of types){const attrs=type==='Polygon'?'Points="0,0 10,0 5,10"':type==='Path'?'Data="M0 0 L10 0 L5 10 Z"':'Text="Fixture"';const object=`<${type} Name="${type}" Dimensions="10,10,0" Location="12,16,0" ${attrs}/>`;const a=parseGtXml(wrap(object)),b=parseGtXml(grouped(object));check(`primitive-direct-group-${type}`,JSON.stringify(strip(a.layers[0].elements[0]))===JSON.stringify(strip(b.layers[0].elements[0])));}
 const unsupported=wrap('<Polygon Name="BadPolygon" Points="not-a-coordinate"/><Path Name="BadPath" Data="R0 0"/><Path Name="EmptyPath"/><Mesh Name="UnsupportedMesh"/><Layer Name="L"><Path Name="GroupedBadPath" Data="INVALID"/></Layer>');
 await writeFile(join(qa,'unsupported.xml'),unsupported);
 const invalid=parseGtXml(unsupported);
 for(const name of ['BadPolygon','BadPath','EmptyPath','UnsupportedMesh','GroupedBadPath'])check(`explicit-warning-${name}`,invalid.diagnostics.some(w=>w.name===name&&w.code==='GT_UNSUPPORTED'&&w.path&&w.message));
 const html=generateHtml(direct,'Synthetic shapes fixture');
 check('existing-svg-polygon',html.includes('<polygon points="0,0 120,0 60,80"/>'));
 check('existing-svg-path',html.includes('<path d="M0,0 L200,0 L100,100 Z"/>'));
 check('existing-svg-viewboxes',html.includes('viewBox="0 0 120 80"')&&html.includes('viewBox="0 0 200 100"'));
 check('html-contains-both-names',html.includes('data-name="Polygon"')&&html.includes('data-name="Path"'));
 await writeFile(join(qa,'converted.json'),JSON.stringify({direct,grouped:group,nested:nest,unsupported:invalid},null,2)+'\n');
 await writeFile(join(qa,'direct.html'),html);
 const before=await readFile(join(qa,'gtzip-xml.mjs.before')),after=await readFile(join(root,'obs-vmix/ferramentas/gtzip-xml.mjs'));
 check('QR-freeze-source-pin',hash(after)==="4f412d0a3c9a8c191801b7e26adcb7c0241a72e6007e3582e20fe6270ec5fea2");
 const receipt={status:'PASS',createdAt:new Date().toISOString(),cases:results.length,results,source:{path:'obs-vmix/ferramentas/gtzip-xml.mjs',beforeSha256:hash(before),sha256:hash(after),bytes:after.length},baseline:{lostShapes:2,silentDrop:true,executedFrom:'frozen original module with only utility import relocated to existing source'},scope:'QR regression: original32 data/SVG/baseline cases unchanged; guard33 now pins QR source hash instead of asserting historical one-line-only diff',nativeStarted:false,operatorTouched:false,networkUsed:false,limits:['Data conversion and generated SVG tested; no Native/CEF/browser visual render exercised.','Existing partial GTZIP support remains; incompatible geometry emits existing diagnostics.']};
 await writeFile(join(qa,'resultado.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({status:receipt.status,cases:receipt.cases,baselineSilentDropReproduced:true}));
}catch(error){await writeFile(join(qa,'resultado-fail.json'),JSON.stringify({status:'FAIL',results,error:error.message},null,2)+'\n');console.error('GTZIP QA failed; see receipt');process.exitCode=1;}
