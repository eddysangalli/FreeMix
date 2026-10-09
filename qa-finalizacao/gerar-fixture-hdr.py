from pathlib import Path
import numpy as np,json,subprocess
base=Path(__file__).resolve().parent
folder=base/'hdr-evidencias';folder.mkdir(exist_ok=True)
ffmpeg=Path('C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-TransportConclusion-20261009/runtime/ffmpeg.exe')
w,h=1024,240
nits=np.array([0,100,203,300,500,1000],float)
m1,m2,c1,c2,c3=2610/16384,2523/32,3424/4096,2413/128,2392/128
pq=((c1+c2*(nits/10000)**m1)/(1+c3*(nits/10000)**m1))**m2
# HLG reference black/quarter/half/three-quarter/white, with receiver peak1000.
levels={'pq':pq,'hlg':np.array([0,.25,.5,.75,.9,1.])}
refs={}
for transfer,bands in levels.items():
 y=np.empty((h,w),dtype='<u2')
 for i,e in enumerate(bands):y[:h//2,i*w//6:(i+1)*w//6]=round(64+876*e)
 y[:h//2,5*w//6:]=round(64+876*bands[-1])
 # Genuine10-bit substeps. Lower half helps detect an8-bit intermediate.
 gradient=np.linspace(64,940,w).round().astype('<u2');y[h//2:]=gradient
 uv=np.full((h//2,w//2),512,dtype='<u2')
 raw=folder/(transfer+'.yuv');raw.write_bytes(y.tobytes()+uv.tobytes()+uv.tobytes())
 out=folder/(transfer+'.mkv')
 trc='smpte2084'if transfer=='pq'else'arib-std-b67'
 command=[str(ffmpeg),'-hide_banner','-v','error','-y','-stream_loop','-1','-f','rawvideo','-pixel_format','yuv420p10le','-video_size',f'{w}x{h}','-framerate','30','-i',str(raw),'-t','8','-c:v','libx265','-preset','ultrafast','-x265-params','lossless=1:pools=2:frame-threads=2:colorprim=bt2020:transfer='+trc+':colormatrix=bt2020nc:range=limited','-color_range','tv','-colorspace','bt2020nc','-color_primaries','bt2020','-color_trc',trc,str(out)]
 subprocess.run(command,check=True)
 refs[transfer]={'width':w,'height':h,'normalizedBands':bands.tolist(),'y10':[round(64+876*e)for e in bands],'nits':nits.tolist()if transfer=='pq'else None,'file':str(out),'expectedColorTransfer':'smpte2084'if transfer=='pq'else'arib-std-b67','originalPrecisionBits':10}
(folder/'reference.json').write_text(json.dumps(refs,indent=2))
print(json.dumps(refs))
