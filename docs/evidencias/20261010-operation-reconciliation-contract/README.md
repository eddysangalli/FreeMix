Draft isolado: confirmação de estado e recusa segura do FTB legado

Base: FreeMix Git 6adcd19315c01a4f01baaab2fd5d9e560872619b. BASELINE.json distingue os bytes CRLF reais do worktree dos blobs Git normalizados. Nenhum produto, operador, índice, pacote ou Native foi alterado/executado nesta frente. O build600 fica fora deste draft.

24 contratos passaram no test.mjs com métodos reais extraídos do draft e fixtures UUID sintéticas. Não são testes de Native/CEF ou performance. result.json registra esse limite. A primeira falha do harness (constante replayUrl externa ausente) foi preservada em test-initial-harness.mjs/harness-initial-failure.json; corrigir essa fixture não alterou o código do draft.

Fluxo de recuperação:

1. GO/Cut/delete continua serializado, com ID, UUID e scope. Nenhum retry automático foi acrescentado.
2. Conferir motor usa GET /api/operation-check?id=...&scope=... sob a autenticação comum já existente. Consulta espera a cauda de operações; só lê cenas/projeto e, para transições, o cursor. Não executa comando, full refresh, roteamento de áudio ou journal.
3. Um recibo terminal uncertain pode virar confirmed quando o UUID desejado coincide com o estado Native atual, no mesmo projeto e na mesma conexão original. A prova fica marcada confirmation=current-state e originalStage=uncertain. A interface informa que o ACK original não foi recuperado. Não se deve apresentar isso como confirmação histórica da execução original.
4. Para Cut/Fade/Transition exige também cursor1. Delete confirma ausência do UUID exato, inclusive se uma cena de mesmo nome foi recriada com outro UUID; não certifica limpeza de recursos privados de um delete parcialmente concluído.
5. PGM diferente ou conexão/projeto novo mantém uncertain. Depois de consulta válida e terminal (fora da cauda em execução), o operador pode clicar Liberar controles sem repetir e confirmar o texto com Programa/projeto atuais. Isso abandona somente a trava local, limpa Preview intent e NÃO repete, desfaz, nem marca failed/confirmed o comando antigo. O recibo backend permanece para dedupe. A liberação expira em5s; cancelamento, erro de leitura e check de outro ID não liberam.
6. Recibo desconhecido, comando ainda sem terminal seguro e consulta que perdeu conexão não oferecem liberação. Abrir/navegar/poll não chama o novo endpoint; a consulta é explícita. Resposta/ACK antigo não afeta uma trava de outro ID/scope.

FTB:

OBSBasic_Transitions.cpp102-123 implementa internamente QuickTransition.fadeToBlack, com ID dinâmico OBSBasic.QuickTransition.<id>. TransitionToScene307-425 usa prevFTBSource para ir/voltar do preto. Isso é um recurso Native real, porém não existe um contrato FreeMix/obs-websocket Get/SetFadeToBlack que exponha estado e operação confirmável. Não é válido inferir o ID pelo nome ou substituir por Fade normal.

O draft inclui ftb no mesmo gate frontend e recibo serial backend, captura o alvo UUID/scope e recusa descritivamente antes de executar/rotear áudio. O antigo SetCurrentSceneTransition/TriggerStudioModeTransition direto sai do atalho. Nenhuma cena preta, fonte, quicktransition ou autostart é criado. Isto corrige a chamada perigosa e deixa uma limitação explícita; não entrega FTB remoto real.

Integração proposta para Root, sem aplicação automática:

- painel/mesa.html: gate ftb, check correlacionado, liberação explícita local e indicação current-state.
- ferramentas/controle-producao.mjs: associação privada ID→conexão (não exportada), checkOperation serial somente leitura, FTB negativo e eviction coerente.
- ferramentas/servidor-api.mjs: GET autenticado operation-check, sanitização publicOperation existente e whitelist dos três campos de reconciliação.

Os patches estão normalizados para a/path e b/path; os drafts completos e pins permitem cópia guardada. Root deve validar todos os BASELINE.sha256 contra o worktree antes de integrar e repetir ensaio Native próprio em versão posterior. Nenhuma integração deve ser atribuída ao pacote600 já em preparação. A autenticação/Origin/CORS geral não foi duplicada nem relaxada.

Fora deste draft: polling HTTP de tabelas dentro da cauda comum e captura de thumbnails de inputs minimizados, registrados em ../060000-operation-source-audit.json. Nenhuma alteração dessas frentes foi misturada.
