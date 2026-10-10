# Gate6: preparação, sem execução

Este draft deriva do Gate5 congelado e preserva seu FAIL real. Não contém autorização, launcher novo ou aprovação Root. Nenhum Native, receptor, API, FFmpeg ou arquivo de mídia foi iniciado/gerado nesta preparação. A ligação atual é Native29 (7599299), com 2085 arquivos verificados durante a preparação. Native30 requer novo binding, SDK e revisão Root antes de qualquer execução; não se deve usar o rundir mutável.

## Falha preservada e mudança finita

No Gate5 o getter imediatamente após o ACK de RESTART retornou cursor 2733 ms. A captura aceitou esse cursor sem observar reset. Depois, 24440,3 ms de relógio corresponderam a 21633 ms de cursor, diferença -2807,3 ms: o critério original rejeitou corretamente. Essa leitura sustenta uma hipótese de readiness antiga; não atribui falha ao produto. Recibo original: `../ftb-native29-long-fixture-runner-draft5/execution/run-9srInH/receipt.json`, SHA256 `8b130df3729af75a48f0d2fc37d12852403c0e18ccc921442d9225db17c61335`.

O novo contrato `observable-reset-then-progress-v1` consulta a UUID exata da mídia. Exige PLAYING com cursor >=1500 ms antes de enviar RESTART uma única vez. Depois do ACK, deve observar PLAYING com cursor <=250 ms e redução >=1000 ms, duração idêntica, seguido de duas observações que avancem até >=1000 ms. Após o ponto baixo, o cursor deve ser monotônico, decorrer >=750 ms de relógio e a diferença avanço/relógio deve permanecer <250 ms. Os clocks são registrados depois do getter, sem tratar cursor nulo de OPENING como zero. A espera permanece 10 s, amostras limitadas a 512, sem reenvio/retry. O recibo das observações é guardado inclusive em erro.

Essa proposta ainda precisa ser julgada no motor real: se o getter não mostrar o ponto baixo, o ensaio falhará antes de iniciar a captura. Não há inferência de reset somente pelo ACK ou nome da ação.

## Critérios mantidos

A fixture continua com 240 s, sem loop, reinício explícito e margem de 1000 ms. Os FPS continuam 30/1 e 30000/1001, com oito DSK reais e Programme independente; reconnect e reset de contexto permanecem previstos. Não houve alteração do limite original de captura (<1500 ms), ganhos .09/.11, critério PCM global .6, limpeza cooperativa, verificações completas do candidato/runtime ou análise de warnings/crash. Áudio permanece `unchanged`; qualificação continua false.

Somente run/guards ganham a barreira e sua dependência. scenario, áudio, PNG e contexto continuam byteidênticos ao Gate5. O proof continua vendor/obsws direto, sem API e sem alegação de validação do novo GET de saídas. O novo helper/UI canônico de saídas integrado pelo Root não faz parte do runtime deste runner; uma futura QA HTTP real exigirá closure atual separada.

## Evidência da preparação

92 casos puros passaram: 35 guards/modelos, 12 contrato keyer pinado, 30 áudio e 15 barreira de reset. Incluem rejeição do cursor antigo, ACK sem observação, cursor nulo, UUID/duração divergentes, clock regressivo, reset repetido, velocidade incompatível e tamanho máximo. A repro do FAIL Gate5 continua negativa com o critério original. Esses resultados não homologam mídia ou Native. ROOT-REVIEW-PROPOSAL permanece pendente, com sete dependências e todos os hashes; autorização anterior Gate5 não vale para este draft.
