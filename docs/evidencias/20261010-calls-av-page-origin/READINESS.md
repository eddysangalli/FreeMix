# Origem de timestamp relativa à página — uma intervenção preparada

SEM execução. Root precisa ler o probe, runner, launcher, helper e pins e autorizar uma única execução futura, silenciosa/exclusiva, com clique explícito no IAB. Sem Native/API/microfone/VDO/STUN/TURN ou mudança de produto. Não iniciar servidor nesta etapa nem retentar automaticamente.

Baseline real anterior: localtap recebeu PCM nonzero145920/peak0,35 em7651processCalls; receptor processou7651calls mas nonzero0. Isto prova a entrega ao consumidor local do Generator. Não prova silêncio codificado emOpus, nem a versão/feature flags do IAB. Os report/receipt anteriores e AL39/9 ficam preservados; hashes em DERIVATION.json.

ÚNICA intervenção: adicionar a mesma origem page-relative a TODOS os timestamps AudioData e VideoFrame. Capture origin é `Math.floor((AVClock.wall - AVClock.latencyMs)*1000)`; wall/latency vêm do próprio clock que já paceia ambos. A baseNative-sintética3e12ns continua normalizada; não se injeta esse número como timestamp da página. Não usar `ctx.currentTime` só no áudio. É hipótese baseada no snapshot oficialChromium, não certificação do clock do IAB.

O helper era OFF no draft independente; nesta pageQA apenas, é ativado explicitamente depois do clique. Arm fixa base e origem para um owner; reanchor inesperado/overflow/reversão são erro. Cada fábrica recebe o mesmo BufferSource e initclonado somente com timestamp traduzido. PCM/cores/frames/durações/FPS/PTSrelativos/pulsos/cadência e AVClock/BoundedWriters originais não mudam.

Localtap permanece ON exatamente como no ensaio real anterior. Worklets, Gain0, detector, ROIadaptativo, clock do receptor, pares e limiares continuam idênticos. Não trocar grafo e origem simultaneamente. Report registra origem/first/last/count de400AudioData e≈600VideoFrames, sourcePtsUnchanged e PCMUnchanged como contrato; modelos exercitam a identidade dos bytes. Sem inferir causalidade pela declaração desses flags.

Dez verificações de modelo/sintaxe/pins passam. Um modelo usa AVClock e ambos writers REAIS com factories/timerclock de teste,400blocosPCM/600framesNTSC: origem8e6us comum, intervalos/offsets e checksumsPCM mantidos, zero drops/faults,400/600frames fechados. Não construiu AudioData/VideoFrame reais nem mediu encoder/receptor.

Execução futura compara métricas recebidas com baseline: localPCM, receiverWorkletnonzero/tons, samples/jitterbuffer doRTP, pares flash/tone eoffset/drift dentro dos MESMOS critérios. Coleta pode continuar válida com A/Vinconclusivo; `originalAvAcceptance` permanece independente e `avSyncProven=false` para produto. Se a nova origem muda o resultado, registrar intervenção e limitações antes de integrar qualquer PCMNative/N-1.

Cleanup: timestampowner fechado no finally/pagehide junto ao clock/writers/tracks/peers/context; Gain0 e saídaWorklet0 preservam silêncio. HTTP fecha, pós-pins e noLinks verificam todos textos/helper2. Deadlines180s início/45s depois de clique; uma única tentativa. Root deve preservarFAIL antes de qualquer ajuste.

CLI somente após revisão: Node600 pinado chama `launch.mjs EXECUTE-ROOT-APPROVED-AV-COMMON-PAGE-ORIGIN-20S --allowlist-sha=<SHA real de ALLOWLIST-PREPARATION.json>`. `root-command.json` fixa runner/PREP. O comando não é autorização.
