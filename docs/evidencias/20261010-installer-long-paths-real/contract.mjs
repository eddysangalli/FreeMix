import assert from 'node:assert/strict';
import path from 'node:path';
export const pins=Object.freeze({
 version:'0.1.0-local.20261010093000',
 candidate:'d868edb33de252768ed070ae83be34e3c6f0f711a850b8efe4dfda0b135e71ad',
 zip:'8a93312bdb1914265567d92ee6e22683c7d942c809e2f4f982e04404eaa7756b',
 manifest:'ad5a42792187e4c4bae75f55e8ab479623e6ef4e5db4dc0206a41a77abfcd26e',
 githubCommit:'9ff0eea38c2ee41f8bf4a57243a69ba2827cd63b',
 nativeCommit:'c4b5af00ea4a4b744a3a19fef5ec861f693c9a69',files:9714,
 node:'ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32',
 setupSource:'dd17f512f0ba75e55595500cc16f858c50acdeb04992fa10643f15b52c30ee28',
 uninstallSource:'ea5e0082e938d32382237333324f26a186d727f13a138836747d13f4e1e4eb30',
 originalSetup:'abf8f955c280a2ecc79071a3bc81cd6c19f23a856bf3e1095b38f40f5f4e2e0f'
});
export const expectedLongs=Object.freeze([
 {path:'data/obs-plugins/obs-shaderfilter/textures/TileableLinearSlotMaskTall15Wide9And4d5Horizontal9d14VerticalSpacing.png',size:204254,sha256:'353cd2e76bb0451959cee6b4bda447d8c8bc2d3bb0b90b545f1f4c06cf4212ba',fullLength:266},
 {path:'data/obs-plugins/obs-shaderfilter/textures/TileableLinearSlotMaskTall15Wide9And4d5Horizontal9d14VerticalSpacingResizeTo64.png',size:6916,sha256:'ab655f312622d8247ad2038801c07eed07a99199bf239d7c3893bd667ea260af',fullLength:276}
]);
export function installedName(base,length=150){
 assert.equal(length,150);assert(path.win32.isAbsolute(base));const parts=[];let n=length-base.length-1;
 const tail='FreeMix-QA-Installed Studio with spaces';while(n-tail.length>90){parts.push('d'.repeat(50));n-=51;}
 assert(n>=tail.length&&n<240,'Own TEMP path too long for exact root150');parts.push(tail+'x'.repeat(n-tail.length));
 const result=path.win32.join(base,...parts);assert.equal(result.length,length);assert(path.win32.relative(base,result)&&!path.win32.relative(base,result).startsWith('..'));return result;
}
export function userPathFor(installed,prefix,length=400){
 assert(/^(projetos\/own|config\/qa-own|qa-own-media)$/.test(prefix));let rel=prefix+'/',n=length-installed.length-1-rel.length;
 while(n>100){rel+='u'.repeat(60)+'/';n-=61;}assert(n>=8);rel+='v'.repeat(n-5)+'.json';assert.equal(path.win32.join(installed,rel).length,length);return rel;
}
export function validatePayloadPins(args,candidate){
 for(const [k,v]of [['candidate-sha',pins.candidate],['zip-sha',pins.zip],['manifest-sha',pins.manifest],['version',pins.version]])assert.equal(args[k],v,k+' wrong immutable093000 payload');
 assert.equal(candidate.githubCommit,pins.githubCommit);assert.equal(candidate.nativeCommit,pins.nativeCommit);assert.equal(candidate.files,pins.files);
 assert.equal(path.win32.basename(candidate.packageRoot),'FreeMix-Completo-'+pins.version);
 assert.equal(path.win32.basename(args.zip),'FreeMix-Completo-'+pins.version+'.zip');assert.equal(candidate.zip.sha256,pins.zip);
}
export function executionBound(remaining,max){assert(Number.isFinite(remaining)&&remaining>1000,'Global30min deadline');assert(Number.isFinite(max)&&max>0);return Math.min(remaining,max);}
export function assertApplyBudget(remaining){assert(Number.isFinite(remaining)&&remaining>=420000,'Apply refused: reserve300s tool+120s verification/receipt');}
