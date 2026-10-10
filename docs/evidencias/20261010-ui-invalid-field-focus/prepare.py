"""Own drafts only; no app, browser, API, or Native execution."""
from pathlib import Path
import hashlib,json,difflib
own=Path(__file__).resolve().parent
root=own.parents[1]
targets=['FreeMix/painel/remoto/calls.js','FreeMix/painel/remoto/saidas-operacao-ui.js']
(own/'draft').mkdir(exist_ok=True)
(own/'patches').mkdir(exist_ok=True)
pins=[]
for target in targets:
    before=(root/target).read_bytes();text=before.decode('utf-8')
    if target.endswith('/calls.js'):
        text=text.replace("c.experimentalContinuousVideo===true?'Captura contínua experimental'","c.experimentalContinuousVideo===true?'Modo experimental'")
        old="return mode+' · '+reported+' · '+capability+(c.videoReturnAvSyncProven===true?'':' · Sincronismo A/V não homologado.');"
        new="const warning=c.videoReturnAvSyncProven===true||/sincronismo\\s+a\\/v[^.]*n[aã]o\\s+homologado/i.test(reported)?'':' · Sincronismo A/V não homologado.';\n  return mode+' · '+reported+' · '+capability+warning;"
        assert text.count(old)==1
        ending='\r\n' if text[text.index(old)+len(old):].startswith('\r\n') else '\n'
        text=text.replace(old,new.replace('\n',ending))
    else:
        old="focusInvalid(); return; } showStep"
        assert text.count(old)==1;text=text.replace(old,"focusInvalid(error); return; } showStep")
        old="function focusInvalid() { const id = !get('name').trim() ? 'name' : step === 0 ? srt() ? 'srt-connection-host' : 'server' : 'input'; byId(id)?.focus(); }"
        new="""function focusInvalid(error = '') {
    const matches = [
      ['Dê um nome', 'name'], ['porta entre', 'srt-connection-port'],
      ['A latência deve', 'srt-connection-latency'], ['Não há codificador', 'encoder'],
      ['A entrada escolhida', 'input'], ['URL avançada', 'server'],
      ['URL SRT ou RIST', 'server'], ['servidor RTMP/RTMPS', 'server']
    ];
    const id = matches.find(([message]) => error.includes(message))?.[1] || (!get('name').trim() ? 'name' : step === 0 ? srt() ? 'srt-connection-host' : 'server' : 'input');
    const field = byId(id); if (!field) return;
    for (let parent = field.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    field.focus();
  }"""
        assert text.count(old)==1
        ending='\r\n' if text[text.index(old)+len(old):].startswith('\r\n') else '\n'
        text=text.replace(old,new.replace('\n',ending))
    # Mixed line endings exist in the output file: preserve all unrelated bytes.
    after=text.encode('utf-8');assert before!=after
    name=Path(target).name
    (own/'draft'/name).write_bytes(after)
    patch=''.join(difflib.unified_diff(before.decode().splitlines(keepends=True),after.decode().splitlines(keepends=True),fromfile='a/'+target,tofile='b/'+target))
    (own/'patches'/(name+'.patch')).write_text(patch,encoding='utf-8',newline='')
    pins.append({'target':target,'baseSHA256':hashlib.sha256(before).hexdigest(),'draft':'draft/'+name,'sha256':hashlib.sha256(after).hexdigest(),'patch':'patches/'+name+'.patch'})
(own/'INTEGRATION.json').write_text(json.dumps({'status':'OFFSIDE_ROOT_REVIEW_PENDING','targets':pins,'canonicalModified':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'drafts':len(pins),'nativeStarted':False}))
