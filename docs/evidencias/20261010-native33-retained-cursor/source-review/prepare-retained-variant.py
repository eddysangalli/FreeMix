import hashlib,json,difflib
from pathlib import Path
OWN=Path(__file__).resolve().parent
H=lambda b:hashlib.sha256(b).hexdigest()
paths=['freemix-app/shared/media-playback/media-playback/media.c','freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c']
rows=[]
for path in paths:
 before=(OWN/'baseline'/path).read_bytes();text=before.decode('utf8')
 if path.endswith('media.c'):
  old='\tbool presented = m->presented_valid;\r\n\tint64_t pts = m->presented_pts;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\tif (presented)\r\n\t\treturn pts * (int64_t)m->speed / 100000000LL;\r\n\treturn mp_media_get_base_pts(m) * (int64_t)m->speed / 100000000LL;'
  new='\t/* During reset retain the last submitted source PTS (zero before the\r\n\t * first submission). Decoder next_pts is future data owned by the decode\r\n\t * thread, not a submitted position. Validity/readiness remains separate. */\r\n\tconst int64_t pts = m->presented_pts;\r\n\tconst int speed = m->speed;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\treturn pts * (int64_t)speed / 100000000LL;'
  assert text.count(old)==1;text=text.replace(old,new,1)
 else:
  old='snapshot.presented_valid ? "submitted-source-pts" : "decoder-base-fallback");'
  new='snapshot.presented_valid ? "submitted-source-pts" : "retained-source-pts-or-initial-zero");\r\n    obs_data_set_string(data, "legacyCursorPolicy", "retain-last-submitted-or-zero-while-invalid-v1");'
  assert text.count(old)==1;text=text.replace(old,new,1)
 after=text.encode('utf8');dest=OWN/'retained-variant'/'draft'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(after)
 patch=''.join(difflib.unified_diff(before.decode('utf8').splitlines(True),text.splitlines(True),fromfile='a/'+path.removeprefix('freemix-app/'),tofile='b/'+path.removeprefix('freemix-app/'))).encode('utf8')
 p=OWN/'retained-variant'/'patches'/(Path(path).name+'.patch');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(patch)
 rows.append({'path':path,'before':H(before),'after':H(after),'patch':str(p.relative_to(OWN)).replace('\\','/'),'patchSha256':H(patch)})
(OWN/'retained-variant'/'TARGETS.json').write_text(json.dumps({'recommended':True,'NativeCompiled':False,'NativeExecuted':False,'targets':rows,'compatibility':'mediaClock contract1 valid timestamps unchanged; invalid timestampSource explicitly changed; strict diagnostic enum consumers must review this additive cursor policy, not relax legacy thresholds'},indent=2)+'\n',encoding='utf8')
print(json.dumps({'recommendedTargets':len(rows),'executed':False}))
