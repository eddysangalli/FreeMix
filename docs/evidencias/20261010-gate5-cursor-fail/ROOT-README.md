# Gate5: FAIL de tempo preservado

Fixture240s sem loop e30/1. Main/8DSK, ganho linear/preto/restauração passaram. O cursor avançou21633ms durante24440,319ms de captura, diferença2807,319ms além da tolerância original1500ms; FAIL. O primeiro cursor2733ms foi lido0,412ms após ACKrestart, podendo ser anterior ao reset, hipótese ainda sem causa demonstrada. Nenhuma tolerância foi relaxada e não houve retry.

Após fechamento, Root analisou os dois arquivos SRT: PCM idêntico,24s/48k/stereo e critérios originais global/coerência/segundos passaram em ambos. Essa análise não apaga FAIL nem comprova NTSC/reconnect/reset/qualificação final. Native e dois receptores fecharam0; medidores/alocações/crash0 e2085Native+9582signedfiles pós-pins passaram.
