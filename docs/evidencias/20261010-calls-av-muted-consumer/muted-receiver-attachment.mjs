// OFFSIDE QA only. One optional consumer attachment, not an audio transport fix.
export class MutedReceiverAttachment {
  constructor({element,enabled=false}={}) {
    if(!element||typeof enabled!=='boolean')throw Error('OWN_ATTACHMENT_CONFIG');
    this.element=element;this.enabled=enabled;this.closed=false;this.track=null;
    this.stream=null;this.added=false;
    this.metrics={attempts:0,attached:0,duplicates:0,detached:0};
  }
  audio(track) {
    if(this.closed)throw Error('OWN_ATTACHMENT_CLOSED');
    if(!this.enabled)return false;
    if(track?.kind!=='audio'||track.readyState!=='live')throw Error('OWN_AUDIO_TRACK_REQUIRED');
    if(this.track&&this.track!==track)throw Error('OWN_ATTACHMENT_TRACK_LIMIT');
    this.track=track;return this.attach();
  }
  videoReady() {
    if(this.closed)throw Error('OWN_ATTACHMENT_CLOSED');
    if(!this.enabled||!this.track)return false;
    return this.attach();
  }
  attach() {
    // Never unmute/play/change level here. The original video handler owns play.
    if(this.element.muted!==true)throw Error('OWN_ELEMENT_MUST_STAY_MUTED');
    const stream=this.element.srcObject;if(!stream)return false;
    if(typeof stream.getAudioTracks!=='function'||typeof stream.addTrack!=='function'||
       typeof stream.removeTrack!=='function')throw Error('OWN_MEDIASTREAM_REQUIRED');
    if(this.stream&&this.stream!==stream)throw Error('OWN_ATTACHMENT_STREAM_CHANGED');
    const audio=stream.getAudioTracks();
    if(audio.length>1||audio.some(t=>t!==this.track))throw Error('OWN_UNEXPECTED_AUDIO_TRACK');
    this.metrics.attempts++;
    if(audio.includes(this.track)){this.metrics.duplicates++;return true;}
    stream.addTrack(this.track);this.stream=stream;this.added=true;
    this.metrics.attached++;return true;
  }
  close() {
    if(this.closed)return;this.closed=true;
    // Detach only what this helper added. The probe stops tracks as before.
    if(this.added&&this.stream){this.stream.removeTrack(this.track);this.metrics.detached++;}
    this.track=null;this.stream=null;this.element=null;
  }
}
