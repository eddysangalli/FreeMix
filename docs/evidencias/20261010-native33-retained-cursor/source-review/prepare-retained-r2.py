import hashlib,json,difflib
from pathlib import Path
OWN=Path(__file__).resolve().parent
H=lambda b:hashlib.sha256(b).hexdigest()
paths=['freemix-app/shared/media-playback/media-playback/media.c','freemix-app/shared/media-playback/media-playback/media.h','freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c']
rows=[]
for path in paths:
 before=(OWN/'baseline'/path).read_bytes();text=before.decode('utf8')
 if path.endswith('media.c'):
  old='\tm->presented_valid = pts >= 0;\r\n'
  new=old+'\tif (m->presented_valid)\r\n\t\tm->last_valid_submitted_pts = pts;\r\n'
  assert text.count(old)==1;text=text.replace(old,new,1)
  old='\tbool presented = m->presented_valid;\r\n\tint64_t pts = m->presented_pts;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\tif (presented)\r\n\t\treturn pts * (int64_t)m->speed / 100000000LL;\r\n\treturn mp_media_get_base_pts(m) * (int64_t)m->speed / 100000000LL;'
  new='\t/* Reset and invalid PTS retain the last valid submitted source PTS\r\n\t * (zero before the first valid submission). Decoder next_pts is future\r\n\t * data owned by the decode thread, not a submitted position. This does\r\n\t * not acknowledge callback execution or display; readiness is separate. */\r\n\tconst int64_t pts = m->last_valid_submitted_pts;\r\n\tconst int speed = m->speed;\r\n\tpthread_mutex_unlock(&m->mutex);\r\n\treturn pts * (int64_t)speed / 100000000LL;'
  assert text.count(old)==1;text=text.replace(old,new,1)
 elif path.endswith('media.h'):
  old='\tbool presented_valid;\r\n'
  new=old+'\t/* Mutex-protected source PTS, retained across reset/invalid submission. */\r\n\tint64_t last_valid_submitted_pts;\r\n'
  assert text.count(old)==1;text=text.replace(old,new,1)
 else:
  old='snapshot.presented_valid ? "submitted-source-pts" : "decoder-base-fallback");'
  new='snapshot.presented_valid ? "submitted-source-pts" : "invalid-submitted-source-pts");\r\n    obs_data_set_string(data, "legacyCursorPolicy", "retain-last-valid-submitted-or-zero-while-invalid-v1");'
  assert text.count(old)==1;text=text.replace(old,new,1)
 after=text.encode('utf8');dest=OWN/'retained-r2'/'draft'/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(after)
 patch=''.join(difflib.unified_diff(before.decode('utf8').splitlines(True),text.splitlines(True),fromfile='a/'+path.removeprefix('freemix-app/'),tofile='b/'+path.removeprefix('freemix-app/'))).encode('utf8')
 p=OWN/'retained-r2'/'patches'/(Path(path).name+'.patch');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(patch)
 rows.append({'path':path,'before':H(before),'after':H(after),'patch':str(p.relative_to(OWN)).replace('\\','/'),'patchSha256':H(patch)})
(OWN/'retained-r2'/'TARGETS.json').write_text(json.dumps({'recommended':True,'NativeCompiled':False,'NativeExecuted':False,'targets':rows,'compatibility':'mediaClock contract1 valid timestamps unchanged; invalid timestampSource explicitly changed; strict diagnostic enum consumers need review, never threshold relaxation','semantics':'Last valid source PTS before video/audio callback invocation; not acknowledged callback/display'},indent=2)+'\n',encoding='utf8')
print(json.dumps({'recommendedTargets':len(rows),'executed':False}))
