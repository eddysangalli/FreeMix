import hashlib,json,difflib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OWN=Path(__file__).resolve().parent
H=lambda b:hashlib.sha256(b).hexdigest()
files=[
 'freemix-app/shared/media-playback/media-playback/media.c',
 'freemix-app/shared/media-playback/media-playback/media.h',
 'freemix-app/shared/media-playback/media-playback/decode.c',
 'freemix-app/shared/media-playback/media-playback/cache.c',
 'freemix-app/shared/media-playback/media-playback/media-playback.c',
 'freemix-app/shared/media-playback/media-playback/media-playback.h',
 'freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c',
 'freemix-app/plugins/obs-websocket/src/requesthandler/RequestHandler_MediaInputs.cpp',
]
pins=[]
for path in files:
 b=(ROOT/path).read_bytes(); target=OWN/'baseline'/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
 pins.append({'path':path,'sha256':H(b),'bytes':len(b)})
def draft(path,before,after):
 b=(ROOT/path).read_bytes();text=b.decode('utf8');assert text.count(before)==1,path
 new=text.replace(before,after).encode('utf8')
 target=OWN/'draft'/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(new)
 patch=''.join(difflib.unified_diff(text.splitlines(True),new.decode('utf8').splitlines(True),fromfile='a/'+path.removeprefix('freemix-app/'),tofile='b/'+path.removeprefix('freemix-app/')))
 (OWN/'patches').mkdir(exist_ok=True)
 (OWN/'patches'/ (Path(path).name+'.patch')).write_bytes(patch.encode('utf8'))
 return new
cpath=files[0]
b=(ROOT/cpath).read_bytes();c=b.decode('utf8')
# The existing helper stays unchanged. Forward declaration lets prepare_frames
# publish its successful decoder boundary without exposing decoder fields to GET.
c=c.replace('bool mp_media_prepare_frames(mp_media_t *m)\r\n{','static inline int64_t mp_media_get_base_pts(mp_media_t *m);\r\n\r\nbool mp_media_prepare_frames(mp_media_t *m)\r\n{',1)
end='\treturn true;\r\n}\r\n\r\nstatic inline int64_t mp_media_get_next_min_pts'
assert c.count(end)==1
c=c.replace(end,'\t/* Decode fields belong to the decode owner (including full-decode cache).\r\n\t * Publish only a completed prepare boundary for concurrent cursor readers.\r\n\t * This remains decoder fallback PTS, never presentation acknowledgement. */\r\n\tconst int64_t fallback_pts = mp_media_get_base_pts(m);\r\n\tpthread_mutex_lock(&m->mutex);\r\n\tm->cursor_fallback_pts = fallback_pts;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\treturn true;\r\n}\r\n\r\nstatic inline int64_t mp_media_get_next_min_pts',1)
old='\tbool presented = m->presented_valid;\r\n\tint64_t pts = m->presented_pts;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\tif (presented)\r\n\t\treturn pts * (int64_t)m->speed / 100000000LL;\r\n\treturn mp_media_get_base_pts(m) * (int64_t)m->speed / 100000000LL;'
assert c.count(old)==1
c=c.replace(old,'\tconst int64_t pts = m->presented_valid ? m->presented_pts : m->cursor_fallback_pts;\r\n\tconst int speed = m->speed;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\treturn pts * (int64_t)speed / 100000000LL;',1)
target=OWN/'draft'/cpath;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(c.encode('utf8'))
(OWN/'patches').mkdir(exist_ok=True)
patch=''.join(difflib.unified_diff(b.decode('utf8').splitlines(True),c.splitlines(True),fromfile='a/'+cpath.removeprefix('freemix-app/'),tofile='b/'+cpath.removeprefix('freemix-app/')))
(OWN/'patches'/'media.c.patch').write_bytes(patch.encode('utf8'))
draft(files[1],'\tbool presented_valid;\r\n','\tbool presented_valid;\r\n\t/* Last successful prepare boundary; protected by mutex, decoder-domain only. */\r\n\tint64_t cursor_fallback_pts;\r\n')
reportpath='qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/root-ftb32-clock-real-result.json'
raw=(ROOT/reportpath).read_bytes();r=json.loads(raw);co=r['clockObservation']
# Only diagnostic samples are exported; no logs, audio, private paths or process commands.
summary={k:r.get(k) for k in ['status','fullFTBPass','head','NativeGeneration','operatorTouched','restartsIssued']}
summary.update({'report':reportpath,'reportSha256':H(raw),'legacy':co['legacy'],'before':co['before'],'samples':co['samples'],'allSamplesPreserved':True,'physicalPresentationAcknowledged':False})
(OWN/'observation-samples.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
(OWN/'PINS.json').write_text(json.dumps({'sources':pins,'report':{'path':reportpath,'sha256':H(raw),'bytes':len(raw)},'candidateNotExecuted':True},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':'DRAFT_PREPARED','sources':len(pins),'samples':len(co['samples']),'legacyStatus':co['legacy']['status']}))
