import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const tag = process.argv[2] || 'full2';
assert.match(tag, /^[a-z0-9-]+$/);
const folder = 'qa-finalizacao/bridge-endurance';
const r = JSON.parse(await readFile(`${folder}/${tag}-orchestrator.json`));
assert.equal(r.status, 'PASS', 'Do not seal incomplete or failed endurance');
assert.ok(r.durationRequestedSeconds >= 1200);
const q = r.receiver;
assert.equal(q.status, 'PASS');
assert.equal(r.nativeExit.code, 0);
assert.equal(r.bridgeExit.code, 0);
assert.equal(r.controlledInterruptions.length, 3);
function summary(values) {
  values = values.filter(Number.isFinite).sort((a, b) => a - b);
  assert.ok(values.length);
  const at = p => values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))];
  return { samples: values.length, min: values[0], median: at(.5), p95: at(.95), max: values.at(-1) };
}
// Source is changing during a controlled outage: exclude those measurements,
// retain the full unfiltered samples in the original receipt.
const steady = sample => !r.controlledInterruptions.some(drop =>
  sample.elapsedSeconds >= drop.elapsedSeconds - 2 && sample.elapsedSeconds <= drop.elapsedSeconds + 12);
const resources = {};
for (const name of ['native', 'bridge']) {
  const samples = q.processSamples.filter(s => s[name] && !s[name].exited);
  const windowMedian = window => summary(window.map(s => s[name].rssBytes / 1048576)).median;
  resources[name] = {
    rssMiB: summary(samples.map(s => s[name].rssBytes / 1048576)),
    cpuPercentOneCoreBasis: summary(samples.map(s => s[name].cpuPercentOneCoreBasis)),
    early60To120SecondsRssMiB: windowMedian(samples.filter(s => s.elapsedSeconds >= 60 && s.elapsedSeconds < 120)),
    final60SecondsRssMiB: windowMedian(samples.filter(s => s.elapsedSeconds > q.elapsedSeconds - 60)),
  };
}
const result = {
  status: 'PASS', analysedAt: new Date().toISOString(),
  sourceReceipt: `${folder}/${tag}-orchestrator.json`,
  nativeSha256: r.nativeSha256, bridgeSha256: r.bridgeSha256,
  seconds: q.elapsedSeconds, receivedFrames: q.frames,
  receivedFramesPerWallSecondIncludingOutages: q.frames / q.elapsedSeconds,
  audioSamples: q.audioSamples, audioPeakHz: q.audioPeakHz, audioRms: q.audioRms,
  videoPtsErrors: q.ptsErrors, audioPtsErrors: q.audioPtsErrors,
  alphaFailures: q.alphaFailures, transparentSamples: q.transparentSamples,
  opaqueSamples: q.opaqueSamples, partialAlphaSamples: q.partialAlphaSamples,
  foregroundColorsSeen: q.foregroundColorsSeen, blankFramesOnLinkLoss: q.blankFrames,
  maxReceiveGapSecondsIncludingOutages: q.maxReceiveGapSeconds,
  controlledInterruptions: r.controlledInterruptions,
  approximateRenderedSourceToNdiMsSteady: summary(r.latencyEstimates.filter(steady).map(s => s.approximateRenderedSourceToNdiMs)),
  screenshotRequestMs: summary(r.latencyEstimates.map(s => s.screenshotRequestMs)),
  resources, bridge: r.bridge, legacyBridgeMixedDiscardCounter: true,
  legacyBridgeDiscardCounterMeaning: 'In the endurance binary, droppedLateFrames aggregates audio and video discarded for lateness or repeated PTS. It is not a count of visual frames lost; the final binary separates these four counters.',
  nativeExit: r.nativeExit, bridgeExit: r.bridgeExit,
  operatorTouched: false, vmixTouched: false, browserUsed: false, wanVerified: false,
  limits: [
    'Synthetic moving H.264 input uses actual Native chroma filter, then 1280x720 logical packed420 SRT and official NDI SDK reception; no hardware or vMix acceptance.',
    'Frame counter latency is a local approximation with screenshot request timing, IPC age correction and one-frame quantization; media cursor can read ahead.',
    'CPU uses one-core basis. Native memory includes the full Qt/video process. A 20-minute measurement is not a long-term memory-leak guarantee.',
    'The separate bridge has no OMT/HDR receiving path and is not promoted automatically into the installer.',
    'The first endurance attempt ended on a Drive file-rename PermissionError in the measurement harness after 118 seconds; its failed receipt is preserved.',
  ],
};
await writeFile(`qa-finalizacao/resultado-native-alpha-endurance-20261009.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
