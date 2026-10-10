# Operação responsiva — draft isolado

Não aplicado. Root integra apenas os hunks de operação sobre a mesa canonical que já recebeu o patch separado de render/WS. Nenhum Native, porta/configuração do operador, pacote ou Git foi alterado nesta frente.

## Mudança mínima

- GO, Cut, Fade e ActiveInput entram pelo controlador com UUID, projeto e ID exclusivo. Segurar uma tecla não repete o take. Um pedido pendente bloqueia outro na mesma mesa.
- Antes de executar, confirma conexão/projeto/topologia/modo Studio usando quatro consultas. Snapshot antigo ou topologia diferente ainda exige refresh completo. SetPreview espera o Preview escolhido antes de Trigger.
- Mantém routeLegacyAudio e UM refresh completo depois da ação, incluindo AFV/N-1, antes do ACK confirmado. Não remove processamento de áudio para esconder latência.
- Recibo com timestamps nasce antes do preflight; rejeição conhecida, confirmado e incerto são distintos. Último recibo e histórico limitado sobrevivem aos refresh/ticks. ID confirmado repetido devolve recibo; ID incerto nunca reexecuta nem vira rejeição segura artificial.
- Exclusão usa InputEngine, preservando guardas de composição/limpeza privada. Reconsulta Programa, árvores visíveis e todos os keyers ativos (inclusive nome custom). Falha ao consultar árvore/keyer recusa exclusão. A confirmação do modal captura UUID e projeto, sem remover por nome antigo.
- Resposta perdida mantém a mesa bloqueada e mostra Conferir motor: só GET /api/json, sem repetir mutação. Resposta tardia/recibo no histórico reconciliam. Não libera por timeout nem infere sucesso apenas de imagem atual.
- Patch mínimo servidor-api retorna somente recibo do ID/projeto daquele pedido em erro, com projeção de campos. Não retorna recibos de outro pedido nem assinatura interna. Authorization permanece anterior ao dispatch.

## Provas e limites

draft-result.json: 31 casos PASS usando métodos reais do draft extraídos em VM, com OBS/GUI e outros engines controlados. Inclui Preview enfileirado, AFV com árvore do novo Programa, guardas de exclusão, perda de ACK, deduplicação, projeto/conexão, held keys e UI. api-draft-result.json: seis casos do recibo projetado e leitura do contrato clean(state). Estes testes não medem PCM real nem Native/CEF.

result.json preserva nove reproduções causais da baseline. ws-result.json usa cliente obsws real contra WebSocket próprio, mostrando que promises independentes do cliente não impõem serialização; não prova scheduler Native. gate-result.json preserva sete provas do helper isolado anterior.

O recibo draft-result-timing-before.json preserva a primeira execução com 31 PASS; sua coluna triggerMs foi calculada incorretamente pelo harness. O recibo novo corrige apenas a medição para contar desde a primeira requisição do comando e repete a suíte. Os tempos são atrasos sintéticos de 3 ms, não desempenho real do operador.

Ainda exige ensaio integrado Native/API/CEF por Root: AFV digital efetivo, Preview/take rápido, teclado segurado, modal antigo/projeto alterado, exclusão/overlays e feedback de erro. A fila atual ainda aguarda um tick completo que já esteja em andamento. Node não pode tornar atômica uma alteração concorrente feita por outro cliente Native durante a exclusão. O gate permanece conservador se não houver recibo seguro; conferir Programa manualmente não o desbloqueia automaticamente.

Não atribuir toda a lentidão ao Preview: há trabalho serial de snapshot, screenshots GPU e reconstrução do DOM; só os dois primeiros comportamentos de snapshot/Preview foram modelados nesta frente. Render/WS têm freeze separado do agente transportes.
