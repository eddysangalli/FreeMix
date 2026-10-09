"""NDI SDK reception of Native chroma -> packedSRT -> native bridge. Synthetic only."""
from pathlib import Path
import sys,psutil
base=Path(__file__).resolve().parent
# Reuse the verified ctypes ABI and official SDK initialization, without running its cases.
exec((base/'test-native-alpha-bridge.py').read_text().split('def fixture(')[0],globals())
default_group=os.environ.get('FREEMIX_QA_NDI_DEFAULT_GROUP')=='1'
if default_group:
 fn('find_destroy',[P])(find)
 find=fn('find_create_v2',[C.POINTER(Find)],P)(C.byref(Find(True,None,None)))
folder=base/'bridge-endurance';label=sys.argv[1];duration=int(sys.argv[2]);tag=sys.argv[3]
live=Path(sys.argv[6])if len(sys.argv)>6 else folder/(tag+'-receiver.json');live.parent.mkdir(exist_ok=True,parents=True)
processes={name:psutil.Process(int(pid))for name,pid in zip(['native','bridge'],sys.argv[4:6])}
for p in processes.values():p.cpu_percent()
stats={'status':'RUNNING','defaultNdiDiscovery':default_group,'secondsRequested':duration,'frames':0,'audioSamples':0,'ptsErrors':0,'audioPtsErrors':0,'alphaFailures':0,'transparentSamples':0,'opaqueSamples':0,'partialAlphaSamples':0,'blankFrames':0,'motionIds':set(),'processSamples':[],'localOnly':True,'operatorTouched':False};receiver=None;pts=None;audioPts=None;tail=np.array([],np.float32);lastSample=0;first=None;maxGap=0;lastFrame=None
def save():
 data={**stats,'motionIds':len(stats['motionIds'])};tmp=live.with_suffix('.tmp');tmp.write_text(json.dumps(data,indent=2))
 for retry in range(20):
  try:tmp.replace(live);break
  except PermissionError:
   stats['progressWriteRetries']=stats.get('progressWriteRetries',0)+1;time.sleep(.01)
 else:stats['progressWriteDeferred']=stats.get('progressWriteDeferred',0)+1
 if stats['status']!='RUNNING':(folder/(tag+'-receiver.json')).write_text(json.dumps(data,indent=2))
try:
 until=time.monotonic()+12
 while time.monotonic()<until and not receiver:
  n=C.c_uint();items=sources(find,C.byref(n))
  for i in range(n.value):
   if label.encode()in items[i].name:receiver=create(C.byref(Recv(Source(items[i].name,items[i].url),0,100,False,b'FreeMix isolated endurance receiver')));break
  if not receiver:time.sleep(.1)
 assert receiver,'NDI source missing'
 v=Video();a=Audio();started=time.monotonic();end=started+duration
 while time.monotonic()<end:
  kind=capture(receiver,C.byref(v),C.byref(a),None,100)
  if kind==1:
   assert(v.w,v.h)==(1280,720);assert v.fourcc==int.from_bytes(b'BGRA','little')
   image=np.frombuffer(C.string_at(v.data,abs(v.stride)*v.h),np.uint8).reshape(v.h,abs(v.stride))[:,:v.w*4].reshape(v.h,v.w,4)
   if not image[:,:,3].any():stats['blankFrames']+=1;fv(receiver,C.byref(v));continue
   now=time.monotonic();stats['frames']+=1
   if pts is not None and v.timecode<=pts:stats['ptsErrors']+=1
   pts=v.timecode
   if first is None:first=now;stats['firstVideoAtMs']=time.time()*1000
   if lastFrame:maxGap=max(maxGap,now-lastFrame)
   lastFrame=now
   if now-lastSample>=1:
    lastSample=now;counter=sum((1<<bit)for bit in range(10)if image[36,39+bit*16,0]>150);stats['motionIds'].add(counter);stats['latestFrameId']=counter;stats['latestVideoAtMs']=time.time()*1000
    strip=image[250,:,:3].astype(np.int16);red=int(np.count_nonzero((strip[:,2]>120)&(strip[:,2]>strip[:,1]*2)));blue=int(np.count_nonzero((strip[:,0]>120)&(strip[:,0]>strip[:,1]*2)));stats['latestForegroundColor']='red'if red>blue else'blue';stats.setdefault('foregroundColorsSeen',[])
    if stats['latestForegroundColor']not in stats['foregroundColorsSeen']:stats['foregroundColorsSeen'].append(stats['latestForegroundColor'])
    transparent=int(image[100,1200,3]);opaque=int(image[36,28,3]);partial=int(np.count_nonzero((image[670,:,3]>8)&(image[670,:,3]<247)))
    stats['transparentSamples']+=int(transparent<8);stats['opaqueSamples']+=int(opaque>247);stats['partialAlphaSamples']+=int(partial>4);stats['alphaFailures']+=int(transparent>=8 or opaque<=247)
    procs={}
    for name,p in processes.items():
     try:procs[name]={'rssBytes':p.memory_info().rss,'cpuPercentOneCoreBasis':p.cpu_percent()}
     except psutil.NoSuchProcess:procs[name]={'exited':True}
    stats['processSamples'].append({'elapsedSeconds':now-started,**procs});save()
   fv(receiver,C.byref(v))
  elif kind==2:
   if audioPts is not None and a.timecode<=audioPts:stats['audioPtsErrors']+=1
   audioPts=a.timecode;pcm=np.frombuffer(C.string_at(a.data,a.samples*4),np.float32).copy();stats['audioSamples']+=len(pcm);tail=np.concatenate([tail,pcm])[-48000:];fa(receiver,C.byref(a))
 stats['elapsedSeconds']=time.monotonic()-started;stats['activeVideoSeconds']=None if first is None else lastFrame-first;stats['maxReceiveGapSeconds']=maxGap
 stats['audioRms']=float(np.sqrt(np.mean(tail**2)))if len(tail)else 0
 stats['audioPeakHz']=float(np.fft.rfftfreq(len(tail),1/48000)[np.argmax(np.abs(np.fft.rfft(tail)))])if len(tail)else 0
 stats['status']='PASS'if stats['frames']>duration*24 and stats['ptsErrors']==0 and stats['audioPtsErrors']==0 and stats['alphaFailures']==0 and stats['partialAlphaSamples']>duration*.7 and stats['audioRms']>.02 and abs(stats['audioPeakHz']-440)<3 and len(stats['motionIds'])>30 else'FAIL';save()
finally:
 if receiver:fn('recv_destroy',[P])(receiver)
 fn('find_destroy',[P])(find);fn('destroy',[])()
print(json.dumps({**stats,'motionIds':len(stats['motionIds']),'processSamplesCount':len(stats['processSamples'])},default=str));sys.exit(0 if stats['status']=='PASS'else 2)
