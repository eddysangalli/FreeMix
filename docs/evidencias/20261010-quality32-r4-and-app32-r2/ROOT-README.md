# Qualidade32 R4 e App32 R2: prova parcial e falhas reais

Root executou ambos em raízes e portas próprias, conferiu as cinco telas reais instaladas e os recibos, e confirmou os três PIDs ausentes. Operador51911 e Setup600 preservados.

Qualidade: cor/nitidez/chroma finitos passaram. A captura Master passou a conter áudio real; preset digital/limitador e restauração passaram. Tiny português3/5 tokens sintéticos passou no critério deste ensaio. RNNoise continua FAIL:1,0358dB abaixo dos3dB exigidos. Não trocar a fixture/meta para forçar PASS. Nove PNGs foram rehashados; comparação com as capturas R3 registra identidade quando disponível. Nenhum PCM, transcript ou log bruto é publicado.

DLL cumulativa LocalVocal5aa7f14d… foi aplicada só ao QA. Remoção de filtros e fechamento ordinário cooperativo exit0/count0/crash0 e pins2085+33+46 PASS. Isso não prova shutdown com filtro vivo, cancelamento em voo,17 recusas nem atribuição única das35 alocações antigas. O log de cancelamento atual é posterior a whisper_full e pode conter result0.

App: GETsettings/origem/método/auth e contratos HTTP não mudaram contadores antes do IAB. As telas SRT/MultiStream estão escuras e orientadas, Replay abriu no endereço correto, Calls mostrou o estado sem convidado. Configuração persistente e áudio permaneceram iguais após abrir/polling; porém Production.run0→2, execute1→3 e journal2→8 mantêm FAIL. Ledger registra ações fora da lista finita como OTHER_UNRECORDED_ACTION e ledgerNative saturou; não inventar a identidade das duas ações nem interpretar toda classificação como escrita. Preview/Cut/latência não foram executados após a recusa. Fechamento cooperativo exit0/alloc0/Meter0/crash0 e pins2085+452 PASS.

Root omitiu role/ownOnly nos três primeiros eventos de inspeção: foram corretamente recusados. Eventos e falha de protocolo foram preservados; ACK/prova corrigidos aceitos com as mesmas capturas reais e tab37 já fechado. Critérios, recibos e preparação congelada não foram alterados. A inspeção visual não equivale a aprovação de design do usuário.

Próximo: identificar/remover comandos enviados só ao abrir a mesa; medir Preview/Cut e persistência em novo QA. RNNoise recebe diagnóstico de bordas/readbacks e mesma fixture/meta. LocalVocal recebe caso separado com filtro vivo. Novo instalador depende desses checks; equipamentos/licenças/WAN continuam gates distintos.
