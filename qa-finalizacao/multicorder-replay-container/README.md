# MultiGravação de composição contendo replay

Este ensaio curto testa um caminho legítimo: MultiGravação aplica SourceRecord à cena comum `QA Composição MultiGravação`, que contém a cena `REPLAY A`. O filtro não é aplicado ao input ffmpeg `Replay Player A`. A cena comum é selecionável pelo backend e respeita as exclusões de mic privado.

São três sessões ISO sobre a composição, em 30%, 50% e 100%, com reprodução, seek e pausa fora do Programa. A última alcança EOF antes de parar. A mídia é sintética de QA existente, copiada para TEMP próprio. O teste exige arquivo final estável, H.264 válido e decode, saída ISO encerrada em até seis segundos, todos os outputs inativos antes do fechamento, `shutdown_idle.success=true` e exit0. Registra os outputs imediatamente após o retorno de Stop, para distinguir encerramento assíncrono curto de estado falso persistente. Não prova genlock físico nem rendimento por 90s.

`prepare.mjs --prepare` cria um clone TEMP novo com configuração própria, senha WebSocket aleatória e porta efêmera. Não inicia Native. `test.mjs` só inicia com `FREEMIX_QA_MATRIX_RELEASED=1`, após autorização do coordenador indicando o fim da matriz de produção. Usa o frozen Native20 `6cbf076-configured`, verifica pins antes de executar e mantém a suíte de plugins com os três DLLs reconstruídos. Não inclui qa-replay-pcm/holdview. Nenhum hardware ou mic é ativado. Programa fica em QA.

O fechamento normal é aferido antes de qualquer cleanup forçado. Em FAIL, preserva outputs, status e stacks próprios antes de encerrar somente o processo spawned do clone. O relatório distingue esse FAIL de shutdown recusado e dos PASS anteriores.

`audit-package.json` registra a revisão somente leitura e os checks positivo/negativo de fontes233334; não é aprovação de instalador. Não contém inventário volumoso, logs brutos ou credenciais.

`product-copy/controle.js` contém apenas a correção do seletor ISO: excluir qualquer prefixo `REPLAY ` (A/B/C/D e demais) e `FreeMix Barramentos`, seguindo exatamente o backend. O produto não foi alterado pelo agente; integração cabe ao root.

Baseline preservada: `qa-finalizacao/replay-sincronia-native/resultado-holdview-final.json` passou render/PCM/cleanup; `resultado-stage5-coordinated-stop-first-refusal.json` registrou recusa por outputs de filtros QA diretamente nos players. O segundo não comprova falha neste caminho de container e não é um hang após shutdown aceito.

## Resultado executado

`resultado.json`: **PASS**, Native20 configurado, PID próprio56304, TEMP `FreeMix-QA-MultiCorder-Replay-46cbc04e01bb44cab4c6e12e7ec14915`, porta57405. Liberação da matriz foi recebida do root e installer antes de iniciar.

| Velocidade | Condição ao parar | Stop | Outputs ativos no retorno | Arquivo |
| --- | --- | --- | --- | --- |
| 30% | pausado, fora do Programa | 419ms | 0 | TS H.264, 4.8s, 94.940bytes |
| 50% | pausado, fora do Programa | 418ms | 0 | TS H.264, 5.021333s, 100.016bytes |
| 100% | EOF | 418ms | 0 | TS H.264, 5.154666s, 108.288bytes |

Cada arquivo permaneceu estável após Stop e passou ffprobe e decode completo de vídeo. Fonte/container era selecionável na MultiGravação; REPLAY A canônico foi excluído pelo backend. O filtro foi confirmado no container e ausente no ffmpeg player. O Programa permaneceu QA. Após dispose e remoção somente dos filtros/cenas/inputs próprios, outputs ativos0, `shutdown_idle.success=true`, exit0 em655ms, sem cleanup forçado. O log final registrou zero memory leaks. Este ensaio não reproduziu a falha anterior de SourceRecord diretamente nos players e não requer patch de Stop com base nesta evidência.

`resultado-startup-fixture-fail.json` conserva a tentativa anterior, que chamou get_interface antes do Native ficar pronto (OBS207), sem qualquer ciclo ISO. O harness passou a aguardar readiness da API; uma nova raiz foi usada para o PASS. A tentativa inicial exigiu encerramento próprio e não comprova regressão do produto.

Limites: três sessões sintéticas curtas, uma composição/um player,640×360/30fps, x264/TS. Não prova todas as opções de codecs, divisão, MP4 seguro, oito gravadores, hardware ou uso prolongado. O resultado de render/PCM90s anterior permanece separado; não foi repetido. A espera fixa em DiskReplay.stop continua uma limitação de implementação, mas não produziu estado falso persistente neste cenário.
