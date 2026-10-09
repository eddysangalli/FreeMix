/* Displays arbitrary decoded video; the same video frame supplies colour and alpha. */
(()=>{
 const canvas=document.querySelector('canvas'),video=document.querySelector('video'),debug=document.querySelector('#debug');
 const state=window.FreeMixAlphaVideo={frames:0,ready:false,error:null,width:0,height:0,reconnects:0};
 if(new URL(location).searchParams.has('debug'))debug.style.display='block';
 const report=text=>{debug.textContent=text;};
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:false});
 if(!gl){state.error='WebGL indisponível';report(state.error);return;}
 function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=vec2((p.x+1.0)/2.0,(1.0-p.y)/2.0);gl_Position=vec4(p,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D frame; varying vec2 uv; void main(){vec3 rgb=texture2D(frame,vec2(uv.x*.5,uv.y)).rgb;vec3 key=texture2D(frame,vec2(.5+uv.x*.5,uv.y)).rgb;float a=clamp(dot(key,vec3(.2126,.7152,.0722)),0.,1.);gl_FragColor=vec4(rgb*a,a);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const attribute=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
 let ws,mse,sb,queue=[],objectURL,receivedAt=0,timer,session=0;
 function clear(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);state.ready=false;}
 function layout(){if(!video.videoWidth)return;const w=video.videoWidth/2,h=video.videoHeight;canvas.width=w;canvas.height=h;state.width=w;state.height=h;gl.viewport(0,0,w,h);const scale=Math.min(innerWidth/w,innerHeight/h);canvas.style.width=w*scale+'px';canvas.style.height=h*scale+'px';canvas.style.left=(innerWidth-w*scale)/2+'px';canvas.style.top=(innerHeight-h*scale)/2+'px';}
 addEventListener('resize',layout);video.addEventListener('loadedmetadata',layout);video.addEventListener('error',()=>{state.error=video.error?.message||'Falha de decodificação do vídeo neste navegador';clear();report(state.error);});
 function pump(){if(!sb||sb.updating||!queue.length)return;try{if(sb.buffered.length&&video.currentTime-sb.buffered.start(0)>8){sb.remove(sb.buffered.start(0),video.currentTime-4);return;}sb.appendBuffer(queue.shift());}catch(e){state.error=e.message;report(state.error);queue=[];clear();ws?.close();}}
 function init(mime){
  const generation=++session;queue=[];sb=null;if(objectURL)URL.revokeObjectURL(objectURL);video.pause();video.removeAttribute('src');video.load();clear();
  if(!window.MediaSource||!MediaSource.isTypeSupported(mime)){state.error='Este navegador não decodifica '+mime;report(state.error);return;}
  mse=new MediaSource();objectURL=URL.createObjectURL(mse);video.src=objectURL;
  mse.addEventListener('sourceopen',()=>{if(generation!==session)return;try{sb=mse.addSourceBuffer(mime);sb.addEventListener('updateend',()=>{if(sb.buffered.length){const start=sb.buffered.start(0),end=sb.buffered.end(sb.buffered.length-1);if(video.currentTime<start||end-video.currentTime>1.5)video.currentTime=Math.max(start,end-.25);video.play().catch(()=>{});}pump();});pump();}catch(e){state.error=e.message;report(state.error);}});
 }
 function connect(){
  ws=new WebSocket(location.href.replace(/^http/,'ws').replace(/\?.*$/,'').replace(/\/$/,'')+'/ws');ws.binaryType='arraybuffer';
  ws.onmessage=e=>{if(typeof e.data==='string'){const m=JSON.parse(e.data);if(m.type==='init')init(m.mime);if(m.type==='reset')clear();return;}receivedAt=Date.now();if(queue.length>100){queue=[];ws.close();return;}queue.push(e.data);pump();};
  ws.onclose=()=>{clear();state.reconnects++;report('Aguardando vídeo / reconectando');timer=setTimeout(connect,1000);};ws.onerror=()=>ws.close();
 }
 function draw(){
  if(video.readyState>=2&&Date.now()-receivedAt<5000){try{gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);state.frames++;state.ready=true;state.error=null;report(`${state.width}×${state.height} · vídeo com alpha · ${state.frames} quadros`);}catch(e){state.error=e.message;clear();report(state.error);}}
  if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(draw);
 }
 if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(draw);else setInterval(draw,33);
 const watchdog=setInterval(()=>{if(!receivedAt||Date.now()-receivedAt>5000)clear();},500);
 addEventListener('beforeunload',()=>{clearTimeout(timer);clearInterval(watchdog);ws?.close();if(objectURL)URL.revokeObjectURL(objectURL);});
 connect();
})();
