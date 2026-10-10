import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {redactDiagnostic,DiagnosticCollector} from '../../ferramentas/diagnostico-producao.mjs';
import {readDiagnosticZip} from '../../ferramentas/diagnostico-zip.mjs';

const qa=resolve(import.meta.dirname),root=resolve(qa,'../..'),results=[];
const secret=()=>`synthetic_${randomUUID().replaceAll('-','')}`;
const check=(id,pass)=>{results.push({id,pass:!!pass});if(!pass)throw Error(`QA assertion: ${id}`);};
const hash=b=>createHash('sha256').update(b).digest('hex');
let ownRoot;
try{
 const code=secret(),state=secret(),token=secret();
 const callbacks=[
  `GET /?code=${code}&state=${state} HTTP/1.1`,
  `redirect: GET /?state=${state}&code=${code} HTTP/1.1`,
  `POST /callback?STATE=${state}&CODE=${code} HTTP/1.0`,
  `/auth/return?%73tate=${state}&%63ode=${code}`,
  `"/oauth/callback?code=${code}&state=${state}"`,
  `?code=${code}&state=${state}`,
  `redirect: /?state=${state}`,
  `OAuth callback: GET /?state=${state}`,
  `/callback?state=${state}`,
  `/oauth2?state=${state}`,
  `/oauth?error=access_denied&state=${state}`,
  `/callback?state=${state}&code=${code}&code=${code}`,
  `GET /?code=${code};state=${state} HTTP/1.1`,
  `GET /?code=${code}&amp;state=${state} HTTP/1.1`,
  `GET /?code=${code}&#38;state=${state} HTTP/1.1`,
  `GET /?code=${code}&#x26;state=${state} HTTP/1.1`,
  `GET /?state=${state}&#X26;code=${code}#section HTTP/1.1`,
  `GET /?code=${code}&state=${state}#section HTTP/1.1`,
  `GET /callback?state=${state}&other=keep#section HTTP/1.1`,
  `https://synthetic.example/callback?code=${code}&state=${state}`,
  `GET /?%zz=keep&code=${code}&state=${state} HTTP/1.1`,
 ];
 callbacks.forEach((input,i)=>{const out=redactDiagnostic(input);check(`relative-or-absolute-${i}`,!out.includes(code)&&!out.includes(state));});
 check('real-fragment-preserved',redactDiagnostic(callbacks[17]).includes('#section'));
 check('normal-query-field-preserved',redactDiagnostic(callbacks[18]).includes('other=keep'));
 for(const ordinary of ['{"state":"running","code":207}', 'state=paused', '/api/status?state=recording&camera=A', 'GET /status?state=running HTTP/1.1','?state=idle'])check(`ordinary-state-${results.length}`,redactDiagnostic(ordinary)===ordinary);
 const regressions=[`Authorization: Bearer ${token}`,`Proxy-Authorization: Basic ${token}`,`Cookie: session=${token}; mode=test`,`access_token=${token}`,`refresh_token=${token}`,`--password ${token}`,`stream_key=${token}`,`rtmp://synthetic.example/live/${token}`,`srt://synthetic.example:1234?passphrase=${token}`,`Basic ${token}`];
 regressions.forEach((input,i)=>check(`existing-secret-${i}`,!redactDiagnostic(input).includes(token)));
 check('known-secret-standalone',!redactDiagnostic(`value ${token}`,[token]).includes(token));
 check('known-path',!redactDiagnostic('D:/synthetic-private/session',[],['D:/synthetic-private']).includes('synthetic-private'));
 check('email-ip-regression',!redactDiagnostic('synthetic@example.invalid 192.0.2.8').includes('example.invalid'));
 const jwt='eyJ'+randomUUID().replaceAll('-','')+'.'+randomUUID().replaceAll('-','')+'.'+randomUUID().replaceAll('-','');
 check('jwt-regression',!redactDiagnostic(jwt).includes(jwt));
 // Deterministic cross product checks reorder/encoded names/repeated keys and all separators.
 for(const sep of ['&',';','&amp;','&#38;','&#x26;'])for(const c of ['code','CODE','%63ode'])for(const s of ['state','STATE','%73tate'])for(const order of [true,false]){
  const query=order?`${s}=${state}${sep}${c}=${code}`:`${c}=${code}${sep}${s}=${state}`;
  const out=redactDiagnostic(`GET /?${query}#anchor HTTP/1.1`);
  check(`query-matrix-${results.length}`,!out.includes(code)&&!out.includes(state)&&out.includes('#anchor'));
 }
 const sourceSpecs=[
  ['frontend/oauth/AuthListener.cpp',[
   ['#define LOGO_URL "https://obsproject.com/assets/images/new_icon_small-r.png"\r\n\r\n',''],
   ['Server: OBS Studio','Server: FreeMix'],['<title>OBS Studio','<title>FreeMix'],
   ["\"<img src=\\\"\" LOGO_URL\r\n\t\t\t\t\t\"\\\" alt=\\\"OBS\\\" class=\\\"center\\\"  height=\\\"60\\\" width=\\\"60\\\">\"","\"<span style=\\\"font-family:verdana;font-size:24pt;font-weight:bold\\\" \"\r\n\t\t\t\t\t\"aria-label=\\\"FreeMix\\\">FM &middot; FreeMix</span>\""],
   ['blog(LOG_DEBUG, "redirect: %s", QT_TO_UTF8(redirect));','blog(LOG_DEBUG, "FreeMix OAuth callback received");']]],
  ['frontend/oauth/YoutubeAuth.cpp',[['blog(LOG_DEBUG, "Got youtube redirected answer: %s", QT_TO_UTF8(code));','blog(LOG_DEBUG, "FreeMix YouTube OAuth callback received");']]],
  ['frontend/wizards/AutoConfigStreamPage.cpp',[['OBS Studio Test Stream','FreeMix Test Stream']]],
  ['frontend/dialogs/OBSYoutubeActions.cpp',[['OBS Studio Video Stream','FreeMix Video Stream']]],
  ['frontend/importers/studio.cpp',[['OBS Studio Import','FreeMix Import']]],
 ];
 for(const [rel,replacements] of sourceSpecs){
  const actual=await readFile(join(root,'freemix-app',rel),'utf8'),original=await readFile(join(qa,basename(rel)+'.before'),'utf8');
  let expected=original;for(const [from,to] of replacements)expected=expected.split(from).join(to);
  check(`only-authorized-edits-${basename(rel)}`,actual===expected);
  check(`preserved-crlf-${basename(rel)}`,!/(?<!\r)\n/.test(actual));
 }
 const auth=await readFile(join(root,'freemix-app/frontend/oauth/AuthListener.cpp'),'utf8');
 const extract=name=>{const block=auth.match(new RegExp(`static const QString ${name} = ([\\s\\S]*?);\\r?\\n`))?.[1];return [...block.matchAll(/"(?:\\.|[^"\\])*"/g)].map(m=>JSON.parse(m[0])).join('');};
 const header=extract('serverResponseHeader'),html=extract('responseTemplate').replace('%1','Synthetic authentication result');
 check('extracted-html-local-textual-brand',html.includes('FreeMix')&&html.includes('aria-label="FreeMix"')&&!/<img|https?:|obsproject|OBS Studio/i.test(html));
 check('extracted-title-server-brand',header.includes('<title>FreeMix</title>')&&header.includes('Server: FreeMix')&&!header.includes('OBS Studio'));
 await writeFile(join(qa,'oauth-template-extracted.html'),header.slice(header.indexOf('<html>'))+'<body>'+html+'</body></html>');
 // Exercise the real collector, knownSecrets discovery, ZIP writer and manifest reader in a new private TEMP root.
 ownRoot=await mkdtemp(join(tmpdir(),'FreeMix-QA-OAuthDiagnostics-'));
 const config=join(ownRoot,'config/obs-studio/plugin_config/obs-websocket'),logs=join(ownRoot,'config/obs-studio/logs');
 await mkdir(config,{recursive:true});await mkdir(logs,{recursive:true});
 await writeFile(join(config,'config.json'),JSON.stringify({password:token}));
 const log=callbacks.join('\r\n')+`\r\nknown credential without field label: ${token}\r\nstate=recording\r\n`;
 await writeFile(join(logs,'synthetic-oauth.log'),log);
 const result=await new DiagnosticCollector(ownRoot).generate({note:`callback: /?code=${code}&state=${state}`,machineName:'Synthetic QA'});
 const zip=await readFile(result.path),entries=await readDiagnosticZip(zip),combined=[...entries.values()].map(b=>b.toString('utf8')).join('\n');
 check('zip-code-state-knownsecret-removed',![code,state,token].some(s=>combined.includes(s)));
 check('zip-real-log-included',entries.has('logs/motor/001-synthetic-oauth.log'));
 check('zip-product-state-retained',combined.includes('state=recording'));
 check('zip-config-not-included',![...entries.keys()].some(k=>k.endsWith('config.json')));
 check('zip-report-manifest-valid',result.report.privacy.sent===false&&result.sha256===hash(zip));
 // Preserve sanitized content only; synthetic raw inputs/config never enter the workspace evidence.
 await writeFile(join(qa,'sanitized-log.txt'),entries.get('logs/motor/001-synthetic-oauth.log'));
 await writeFile(join(qa,'sanitized-diagnostic.json'),entries.get('diagnostico.json'));
 const receipt={status:'PASS',createdAt:new Date().toISOString(),cases:results.length,results,collector:{isolatedRoot:true,networkUsed:false,zipEntries:[...entries.keys()],zipBytes:zip.length,zipSha256:hash(zip),rawSyntheticRetained:false},native:{compiled:false,oauthLiveTest:false,htmlEvidence:'C++ literal template extracted; no Qt socket/account/browser runtime exercised',authorizedSources:sourceSpecs.map(([p])=>p),crlfPreserved:true},limits:['Query-only state without OAuth path/context is retained to preserve ordinary product state.','Existing unrecognized arbitrary free-text secrets still require preview review.','No account, remote authentication, production log, operator or sealed package touched.']};
 await writeFile(join(qa,'resultado.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({status:receipt.status,cases:receipt.cases,collectorZipValidated:true,nativeCompiled:false}));
}catch(error){await writeFile(join(qa,'resultado-fail.json'),JSON.stringify({status:'FAIL',createdAt:new Date().toISOString(),results,error:String(error.message).replace(/synthetic_[a-f0-9]+/g,'[synthetic omitted]')},null,2)+'\n');console.error('QA failed; see sanitized assertion receipt.');process.exitCode=1;}
finally{if(ownRoot){const target=resolve(ownRoot);if(!target.startsWith(resolve(tmpdir())+'\\FreeMix-QA-OAuthDiagnostics-'))throw Error('Cleanup boundary');await rm(target,{recursive:true,force:true});}}
