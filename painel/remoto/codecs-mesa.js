// A Mesa e a central de configurações usam as capacidades reais do mesmo motor.
window.FreeMixMesaCodecs = Object.freeze({
  options(settings, category, protocol = settings.protocol) {
    const labels = {h264: 'H.264', hevc: 'HEVC / H.265', av1: 'AV1'};
    return (settings.capabilities?.simpleEncoders || [])
      .filter(e => category === 'recording' || e.protocols.includes(protocol))
      .map(e => [e.id, `${labels[e.codec] || e.codec} · ${e.label}`]);
  },
  protocols(settings) {
    return (settings.capabilities?.protocols || []).filter(p => p.available)
      .map(p => [p.id, p.id === 'hls' ? 'HLS · HTTP/HTTPS PUT' : p.id.toUpperCase()]);
  },
  streaming(c) {
    return {category: 'streaming', protocol: c.protocol, server: c.server.trim(),
      key: c.key, bitrate: Number(c.vbit), audioBitrate: c.abit,
      encoder: c.strEnc, enhancedRtmp: c.enhancedRtmp === true};
  }
});
