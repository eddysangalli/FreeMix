# Gate5 — Native29, fixture longa sem repetição

PREPARAÇÃO OFFSIDE SOMENTE. Nenhum Native/receptor/GPU/API/instalação ou geração de mídia executado. Não existe plano aprovado ou launcher de execução nesta pasta; Root precisa revisão completa e launcher D/TEMP próprio antes de qualquer START. Native29 `759929948fc84ca29d4ad0b65bfdddf98dfbb06f`, manifesto `5c72b43a8382d46eea9b2cf8bf56b8f94bb1024dc39b379664dcdb7c3571691d`, todos 2.085 arquivos lidos/verificados. Candidate600 e guard/cooperative closure/full post permanecem.

## Contrato novo, definido antes da execução

Fixture SDR sRGB de **240 segundos**, tons contínuos L440/R880 amplitude .15, mesma geometria/16bits barcode/8DSK/Main ROI. Input `looping:false`. Após preparar DSK/receivers/config própria, executa **uma** ação SDK `TriggerMediaInputAction` com `OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART` no UUID próprio. Consulta `GetMediaInputStatus` até estado PLAYING e cursor 1–5 segundos; não reenvia restart. Captura Programme/Source e reconexão devem permanecer no intervalo [1 s, duração−1 s), duração informada 239–241 s, cursor monotônico/avanço coerente com clock local. Declaração errada/null/end/loop/reset inesperado falha; não se pula uma janela automaticamente.

**Nenhum limiar antigo relaxado:** PCM GLOBAL por canal RMS>.05 e projeção440/880>.6; cada segundo interno RMS>.07/<.13 e projeção>.6. O guard adicional verifica frequência esperada/canal/gain/dropout por esses mesmos critérios. Native .09/encoded .11, EOTF/linear-sRGBSDR8, blacklist v1/HDR/unknown/reset, pixels8DSK/black/OFF/Source exclusion e PTS continuam. O áudio permanece `unchanged`; não anuncia mute geral de FTB. Importação do módulo puro não faz IO.

Roteiro real futuro em **30/1 e30000/1001**: startup/zero outputs/defaultOFF; eight keyers seed/eventchannels7–14; main screenshotpurpose; singlegain/Mainblack/restauração preservaPreview; Programmeencode/Sourceexcluída/audio/PTS; destinationstop/startreconnect3s; collectionreset clearsbeta +staleepoch rejection; cooperativeclose exit0/counter0/crash0/full2085+candidatepost. Metadata de childserial/PTS público inexistente continua limite; barcode não inventa telemetria.

## Provas somente de preparo

35 regressões guards/PNG/ownTEMP/noLinks/semCLI +12contratos SDK/keyers +30contratos novos de mídia/áudio/v2 =77 PASS. Os negativos incluem mute/swap/mix/dropout/frequência/gain/fase de loop, captura na borda, cursor voltando e duração/clock incoerentes. Nenhum decoder real nesta rodada. `test-audio-result.json`, `test-result.json`, `keyer-test-result.json` são modelos/contratos.

Onze fontes SDK completas atuais, com hashes em SOURCE-PINS.json. Incluem MediaInputs.cpp: status lê estado/duração/cursor de input adquirido, RESTART chama o mecanismo real do source. SDK-FIRST-BINDING-FAIL.json preserva a falha inicial de preparo: metadata copiada do Gate4 ainda tinha hash obs-websocket antigo; Native29 mudou Meter lifecycle. Reparada só a nova metadata, lendo cópias SDK próprias verificadas, sem alterar histórico/canônicos.

`prepare.mjs` verifica AL16 antigo, snapshot2085 atual e gera derivação própria. `ROOT-REVIEW-PROPOSAL.json` tem seis dependências de runtime (novo audio-contract.mjs incluso), pins/binding e status pendente. Não é autorização. Exigir novo launcher/invocation/markerD/noLinks/ENVlocal +reviewSHA +START exclusivo do Root; jamais reutilizar approval Gate4. `originalGate4ReceiptSHA` permanece `f1efd69866cef088aadae9ddd38d63ca5ce1f88da0f51bbe19d1a4641b4d414f`, **FAIL**; diagnóstico offline não requalifica. Root decide nova execução/qualificação.
