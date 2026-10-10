// Draft for a separate local native route. No fallback to SDR or automatic start.
import { isIP } from 'node:net';
export const SRT_HDR_ENCODERS = Object.freeze([
 'obs_nvenc_hevc_tex', 'obs_nvenc_hevc_soft', 'jim_hevc_nvenc',
 'obs_nvenc_hevc_cuda', 'ffmpeg_hevc_nvenc',
 'obs_qsv11_hevc', 'obs_qsv11_hevc_soft', 'h265_texture_amf', 'h265_fallback_amf',
]);
const commands = new Set(['state', 'preflight', 'configure', 'start', 'stop']);
function boundedInteger(value, min, max, label) {
 if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
  throw Error(`${label} fora do intervalo ${min}..${max}`);
 return value;
}
function sourceUuid(value, label, optional = false) {
 if (optional && (value === undefined || value === '')) return '';
 if (typeof value !== 'string' || !value || value.length > 128 || /[\x00-\x20\x7f]/.test(value))
  throw Error(`${label} inválida`);
 return value;
}
export function srtHdrConfig(options) {
 if (!options || typeof options !== 'object') throw Error('Configuração SRT HDR ausente');
 const allowed = new Set(['host', 'port', 'latencyMs', 'sourceUuid', 'encoder', 'bitrateKbps',
  'audioTrack', 'audioSourceUuid', 'transfer', 'alpha', 'fillKey', 'autoStart']);
 if (Object.keys(options).some(key => !allowed.has(key))) throw Error('Opção SRT HDR fora do contrato');
 if ((options.transfer !== undefined && options.transfer !== 'pq') || options.alpha || options.fillKey || options.autoStart)
  throw Error('Esta saída requer HDR PQ opaco e início manual; HLG/alpha/FillKey não estão neste contrato');
 let host = typeof options.host === 'string' ? options.host.trim() : '';
 if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
 const ip = isIP(host);
 if (!ip && /^\d+(?:\.\d+){3}$/.test(host)) throw Error('Endereço IPv4 inválido');
 if (!ip && (!host || host.length > 253 || !/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/.test(host) ||
  host.split('.').some(label => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'))))
  throw Error('IP ou nome do receptor inválido; informe somente o host');
 if (host === '0.0.0.0' || host === '::') throw Error('Caller precisa do endereço do receptor, não do endereço de escuta');
 if (!SRT_HDR_ENCODERS.includes(options.encoder)) throw Error('Selecione encoder HEVC com caminho P010 reconhecido');
 return {
  contract: 'pq-bt2020-p010-main10', sourceUuid: sourceUuid(options.sourceUuid, 'Origem'),
  host, port: boundedInteger(options.port, 1, 65535, 'Porta'),
  latencyMs: boundedInteger(options.latencyMs ?? 120, 20, 8000, 'Latência'),
  encoder: options.encoder, bitrateKbps: boundedInteger(options.bitrateKbps ?? 8000, 200, 100000, 'Bitrate'),
  audioTrack: boundedInteger(options.audioTrack ?? 0, 0, 2, 'Bus Master/A/B'),
  audioSourceUuid: sourceUuid(options.audioSourceUuid, 'Áudio independente', true),
  alpha: false, fillKey: false, autoStart: false,
 };
}
export function srtHdrUrl(config) {
 const host = config.host.includes(':') ? `[${config.host}]` : config.host;
 return `srt://${host}:${config.port}?mode=caller&latency=${config.latencyMs * 1000}`;
}
async function request(obs, requestData) {
 const result = await obs.tryReq('CallVendorRequest', { vendorName: 'freemix', requestType: 'srt_hdr_output', requestData });
 return result?.responseData;
}
export async function srtHdrRead(obs, { senderId = 0 } = {}) {
 const id = boundedInteger(senderId, 0, 3, 'Envio HDR');
 try {
  return await request(obs, { action: 'state', senderId: id }) ||
   { success: false, available: false, active: false, autoStart: false, requiresUpdate: true };
 } catch {
  return { success: false, available: false, active: false, autoStart: false, requiresUpdate: true };
 }
}
export async function srtHdrExecute(obs, { command, senderId = 0, ...options }) {
 if (!commands.has(command) || command === 'state') throw Error('Comando SRT HDR inválido');
 const data = { action: command, senderId: boundedInteger(senderId, 0, 3, 'Envio HDR') };
 if (command === 'configure' || command === 'preflight') data.config = srtHdrConfig(options);
 else if (Object.keys(options).length) throw Error('Início/parada não recebe nova configuração');
 const result = await request(obs, data);
 if (!result?.success) throw Error(result?.error || 'Motor não oferece esta saída SRT HDR');
 // Starting/reconnecting/stopping are asynchronous. Do not report "live" from acceptance.
 return result;
}
