import ctypes as C,os,sys,time,json
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parent;folder=base/'hdr-evidencias'
omtStorage=folder/'sdk-receiver-storage';omtStorage.mkdir(exist_ok=True);os.environ['OMT_STORAGE_PATH']=str(omtStorage)
dll=base.parent/'qa-ndi/omt-sdk/Libraries/Winx64'
handle=os.add_dll_directory(str(dll));codec=C.CDLL(str(dll/'libvmx.dll'));lib=C.CDLL(str(dll/'libomt.dll'));P=C.c_void_p
class Frame(C.Structure):
 _fields_=[('type',C.c_int),('timestamp',C.c_int64),('codec',C.c_int),('width',C.c_int),('height',C.c_int),('stride',C.c_int),('flags',C.c_int),('fpsN',C.c_int),('fpsD',C.c_int),('aspect',C.c_float),('colorSpace',C.c_int),('rate',C.c_int),('channels',C.c_int),('samples',C.c_int),('data',P),('dataLength',C.c_int),('compressedData',P),('compressedLength',C.c_int),('metadata',P),('metadataLength',C.c_int)]
def fn(n,args,ret=None):
 f=getattr(lib,n);f.argtypes=args;f.restype=ret;return f
create=fn('omt_receive_create',[C.c_char_p,C.c_int,C.c_int,C.c_int],P)
recv=fn('omt_receive',[P,C.c_int,C.c_int],C.POINTER(Frame));destroy=fn('omt_receive_destroy',[P])
transfer=sys.argv[2];label=sys.argv[3]if len(sys.argv)>3 else transfer;assert label.replace('-','').isalnum();receiver=create(sys.argv[1].encode(),6,5,0);assert receiver
ref=json.loads((folder/'reference.json').read_text())[transfer]
times=[];audioTimes=[];samples=[];frames=[];end=time.monotonic()+8
try:
 while time.monotonic()<end:
  ptr=recv(receiver,6,30)
  if not ptr:continue
  f=ptr.contents
  if f.type==4 and f.data and f.samples:
   samples.append(np.frombuffer(C.string_at(f.data,f.samples*4),np.float32).copy());audioTimes.append(f.timestamp)
  if f.type!=2 or f.codec!=int.from_bytes(b'P216','little')or not f.data:continue
  data=np.frombuffer(C.string_at(f.data,f.dataLength),'<u2').reshape(f.height*2,f.stride//2)
  y=data[:f.height,:f.width].copy();times.append(f.timestamp)
  bands=[float(np.median(y[f.height//4,max(0,(2*i+1)*f.width//12-8):(2*i+1)*f.width//12+8])) for i in range(6)]
  frames.append({'bands16':bands,'gradientUnique':int(len(np.unique(y[3*f.height//4]))),'flags':f.flags,'colorSpace':f.colorSpace,'metadataBytes':f.metadataLength})
  if len(frames)==1:np.save(folder/(label+'-received-y16.npy'),y)
finally:
 destroy(receiver);fn('omt_shutdown',[])()
last=frames[-1]if frames else {};checks=[]
def check(label,ok):checks.append({'label':label,'passed':bool(ok)})
check('Official SDK decodes genuineP216',len(frames)>=90)
check('VideoPTSmonotonic',len(times)>1 and all(b>a for a,b in zip(times,times[1:])))
check('Morethan8bitintermediatelevels',last.get('gradientUnique',0)>300)
expected=np.array(ref['y10'])*64;actual=np.array(last.get('bands16',[]));error=float(np.max(np.abs(actual-expected)))if len(actual)==6 else 1e9
check('HDRreferencebandsmaintained',error<400)
if transfer=='pq':check('1000nitsnotclippedtoSDR300white',len(actual)==6 and actual[-1]>64*(64+876*.72))
check('P216HighBitDepthandnoalpha',bool(last)and bool(last['flags']&16)and not(last['flags']&2))
signal=np.concatenate(samples)if samples else np.array([]);rms=float(np.sqrt(np.mean(signal**2)))if len(signal)else 0
hz=float(np.fft.rfftfreq(len(signal),1/48000)[np.argmax(np.abs(np.fft.rfft(signal)))])if len(signal)else 0
check('Sustained440HzPCM',len(signal)>48000*4 and rms>.04 and abs(hz-440)<3)
check('AudioPTSmonotonic',len(audioTimes)>1 and all(b>a for a,b in zip(audioTimes,audioTimes[1:])))
result={'passed':all(c['passed']for c in checks),'transfer':transfer,'checks':checks,'videoFrames':len(frames),'firstPTS':times[0]if times else None,'lastPTS':times[-1]if times else None,'lastFrame':last,'expectedBands16':expected.tolist(),'maxBandError16':error,'audioSamples':len(signal),'audioRms':rms,'audioHz':hz,'manualReceiverInterpretation':True,'automaticHdrMetadata':False}
(folder/('capture-'+label+'.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result));sys.exit(0 if result['passed']else 2)
