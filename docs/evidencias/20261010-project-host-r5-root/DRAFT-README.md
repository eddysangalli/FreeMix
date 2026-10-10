# R5 — drafts completos de host, Core/API e UI

OFFSIDE somente. Nada canônico foi alterado e nenhum Native/API/browser/build executado. R4 congelada preservada. Copiar somente a allowlist `product/` após revisão Root, nunca esta pasta inteira para runtime.

## Arquivos finais

- `product/ferramentas/controle-producao.mjs`: adiciona imports e installProjectHost; compõe getObs, InputEngine real e owners atuais; instala wrappers antes de servidor/conexão/timers. O remaining behavior é baseline be468207….
- `product/ferramentas/servidor-api.mjs`: binding criado antes de conexão; todo SDK exposto é wrapped e `connected/candidate/obs` têm identidade única. Eventos/tick/upgrade/admissão WS e todas rotas dinâmicas HTTP são protegidos. `/api/project/{read,scan,preview,apply}` passa pelo adapter autenticado LOCAL fora do job público geral (sem self-deadlock).
- `product/ferramentas/projetos/*`: implementação completa, policy JSON e imports literais. Backend compartilha cópias byte exatas do modelo determinístico/geometry/presets com browser; não importa `.js` remoto por HTTP. Policy JSON importado com `with {type:'json'}` entra na closure oficial.
- `product/painel/remoto/novo-projeto/*`: página real servida em `/novo-projeto/`. `/novo-projeto` redireciona; página/assets locais protegidos. UI não faz scan ao carregar; clique Consultar recursos lê APIs allowlisted. Scan/Aplicar só quando host qualificado, com confirmações específicas. Exportar prévia e Criar projeto preparado têm resultados distintos. Root pode adicionar acesso no menu existente; esta revisão não altera mesa.html nem o menu de outros owners.

O `product/package.json` existe apenas para os modelos ESM nesta árvore QA; NÃO sobrepor package.json canônico. MAPPED-PRODUCT.json descreve os arquivos de integração excluindo esse suporte de teste. Native helpers/handlers/cmake são os R4 já enviados ao Root, não recompilados aqui.

## Flags e limites de isolamento

creation-policy.json começa coverageQualified=false/nativeQueriesQualified=false. Não existe variável de ambiente ou conexão raw fallback habilitando aplicação. Criação permanece recusada e scan disabled enquanto não qualificados. Não ativar flags só porque modelos passaram. Root precisa provar integração real própria, incluindo qualificação das duas novas consultas Native.

Gate admite jobs IDLE, drena jobs/wires anteriores, bloqueia novos comandos/ticks/controllers e descarta eventos temporários. AsyncFunction owners e os métodos Promise de Production são envolvidos. Req E tryReq passam pelo mesmo gate. Scan/apply têm capability exclusiva; contexto incerto ou wires pendentes deixam BLOCKED. Não há unlock automático nem route remota de resume. SDK/profile/collection timeout não é cancelamento. Políticas recusam FirstRun/default WASAPI, áudio/monitor incompatíveis e reload de fontes/filtros desconhecidos; áudio físico não é criado neste apply.

Este gate Node não bloqueia Native UI, outros clientes SDK, plugins nativos, drivers ou ações externas ao servidor. Hardware/CEF/DPI/rollback atômico não foram homologados. Shutdown API durante transação pode deixar ledger parcial/BLOCKED; não presume rollback. Root valida fluxo own/PID/qaClose antes de habilitar produto, sem atingir operador.

Saída de apply é PREPARED_CURRENT_PROJECT_RESTORED, com projeto novo salvo/inativo e contexto anterior restaurado. Não significa câmera/áudio pronto, projeto no ar ou transmissão iniciada. Erros incertos preservam ledger privado; resultado público remove events/captures/settings/IDs de dispositivo. Nenhum journal ou recibo de seleção600 foi reinterpretado.

## Provas e integração de release

test-central-wiring-models.mjs importa funções reais runtime-admission/gate/host e extrai callbacks reais startConnection/onEvent/installProjectHost dos dois drafts completos. Fake SDK/owners são explicitamente sintéticos; nenhuma conexão ou servidor é criado. Testa default OFF, auth/origin/local, bytes Unicode bounded, rota apply exclusiva sem deadlock, bloqueio de HTTP/WS, eventos, wrapper e traversal da closure oficial. Falha inicial de import geometry ausente foi preservada em DEVELOPMENT-FAILS e corrigida na árvore draft; não é falha Native.

Root deve copiar arquivos pinados com beforehash be468/89d110, revisar diff, commitar e recalcular runtimeDependencyClosure no produto final. Seeds mínimos projetos/core-host-binding.mjs, runtime-admission.mjs, qualification-policy.mjs; imports centrais também alcançam esses helpers. Painel tracked é copiado integralmente pelo applier, incluindo .js/CSS. Não congelar future app snapshot antes de Core/API/Native/head/version finais. Harness App futuro e componentes finais ficam na próxima tarefa; nenhum pacote/assinatura/release foi gerado nesta revisão.
