Draft isolado para revisão do Root; não integrado, compilado ou executado em Native.

Base Native33 c990c4a39c445542d363f6950fb8f7f70811034a. Uma fonte de produção: frontend/widgets/FreeMixMultistream.cpp. O patch tem oito substituições exatas. O baseline usa LF e o draft preserva LF. Root deve preservar o formato do destino durante a integração.

network_output/state usa find e defaults vazios locais, preserva os campos do sender solicitado e não insere mapas, cria output/view, abre áudio, carrega SDK nem aposenta mídia. A resposta mantém os blocos anteriores e consultas de conexões/frames dos senders existentes. Connections continua uma consulta SDK de telemetria; não significa ausência de trabalho interno do SDK. O caminho OMT legado continua lendo configurações, sem escrever.

A disponibilidade do SDK é coletada no FinishedLoading antes de publicar o handler e atualizada por start explícito. Ready apenas carrega/resuelve a biblioteca nas fontes inspecionadas; criação de senders permanece no start original. Isso muda o momento do carregamento da DLL e precisa de revisão e prova Native. Se o ambiente mudar durante o processo, state usa a última disponibilidade observada; start ou reinício reprova a capacidade. Não se afirma detecção dinâmica perfeita, hardware ou tráfego real.

A aposentadoria mantém o predicado terminal e a sequência anteriores (output inativo, detach antes de ClearView). Stop conserva a checagem; timer de 100ms assume a aposentadoria de paradas assíncronas sem polling. A recusa por áudio privado e o shutdown/contexto permanecem byte-idênticos. Nenhuma ordem de shutdown ou force-stop foi alterada.

talkback/state somente calcula e devolve estado. O watchdog existente de 100ms continua expirando a lease de 1500ms; prepare/start/ping/stop e teardown permanecem idênticos. Um getter pode retornar talking=false antes do próximo tick efetivamente desativar áudio. Esse prazo existente precisa ser observado em Native, sem ampliar ou afirmar garantia rígida do scheduler Qt.

40 checks CPU/contratos de fonte PASS: oito edits reversíveis, defaults e resposta, caminhos start/stop, sequência de aposentadoria, privacidade/contexto/shutdown, oito slots NDI/OMT sem inserção em 100 leituras, recursos ativos/parada assíncrona, tabela terminal e lease. São modelos e leitura de fontes, não homologação Native/Qt/SDK.

FIRST-REVIEW-FAIL preserva a declaração auto com iteradores incompatíveis do primeiro draft. R2 separa as declarações. FIRST-MODEL-FAIL preserva a suposição incorreta de CRLF no primeiro teste; o baseline real é LF, sem alteração do draft para satisfazer o teste. Os diretórios R1/R2 continuam intactos.

AGY-RECEIPT.json registra quatro chamadas Gemini autenticadas em diretório próprio com fontes públicas: uma permissão de ferramenta negada e três timeouts finitos sem resposta. Exit 0 não foi contado como implementação PASS. Não houve erro de cota comprovado. A indisponibilidade operacional foi comunicada antes do fallback Codex. Nenhum raw provider log, configuração, mídia ou token entra nesta allowlist.

Revisão Root necessária antes de aplicar. Prova futura recomendada: getters repetidos antes de start sem alteração de mapas/recursos; parada assíncrona aposentada pelo timer sem state; start/stop NDI/OMT com pins corretos; talkback lease expirando por tick sem getter; shutdown cooperativo/counter0/crash0. Não mudar o gate zero-escritas da App33 nem sua classificação até a fonte integrada e qualificada. Falhas App32/R2 e freezes App33 não foram modificados.
