from pathlib import Path
import subprocess as S,numpy as np,sys
base=Path(__file__).resolve().parent/'bridge-endurance';base.mkdir(exist_ok=True)
ffmpeg=Path(__file__).resolve().parents[1]/'obs-vmix/runtime/ffmpeg.exe';w,h=1280,720
blue='--blue'in sys.argv;out=base/('chroma-motion-blue.mp4'if blue else'chroma-motion.mp4')
p=S.Popen([str(ffmpeg),'-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h}','-framerate','30','-i','pipe:0','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=30','-c:v','libx264','-preset','ultrafast','-crf','10','-pix_fmt','yuv420p','-g','30','-bf','0','-c:a','aac','-ac','2','-t','30',str(out)],stdin=S.PIPE)
for n in range(900):
 frame=np.zeros((h,w,3),np.uint8);frame[:]=[0,255,0];x=(n*7)%(w-180)
 frame[240:420,x:x+180]=[35,35,230]if blue else[230,35,35];frame[280:380,x+30:x+150]=[255,255,255]
 frame[24:56,24:200]=0
 for bit in range(10):frame[28:52,32+bit*16:46+bit*16]=255 if n&(1<<bit) else 0
 # This is opaque green/red video. Only Native chroma creates the alpha ramp.
 ramp=np.linspace(0,255,w).round().astype(np.uint8);frame[650:690,:,0]=ramp;frame[650:690,:,1]=255-ramp
 p.stdin.write(frame.tobytes())
p.stdin.close();assert p.wait(timeout=30)==0;print(str(out))
