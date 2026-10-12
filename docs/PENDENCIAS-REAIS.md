
## 12/10/2026 06:48 UTC — Replay: primeiro ensaio Native39 falhou; cópia de QA encerrada

O runner Native R2 executou uma vez em instalação própria isolada: identidade Native39/API/portas e saídas ociosas PASS; o segundo gate, início da gravação SourceRecord sintética, FAIL com `fetch failed`. Os gates seguintes de CEF, prévias A/B, agulha, navegação sem mutações, persistência e autosave NÃO foram executados. O recibo FAIL original foi preservado; o novo Replay permanece offside, sem qualificação Native/CEF e fora do pacote instalado.

A API da cópia encerrou; seu código de saída e causa não foram capturados pelo roteiro original, que descartava stderr. O fechamento inicial também foi interrompido pelo erro HTTP. Um helper cooperativo R3, revisado independentemente e com guardas de raiz, PID/executável/hash/data de criação, autenticação local e saídas ociosas, recebeu ACK positivo do Native para `shutdown_idle(qaClose:true)` e confirmou ausência CIM. Pós-observação: cinco PIDs próprios ausentes, nenhum executável/listener da cópia restante, 2085 pinos Native + três DLLs gerenciadas + 168 fontes + mídias originais iguais, medidor de alocações zero e nenhum crash. Nada foi alterado na instalação do operador. Fechamento verificado NÃO transforma o teste em PASS.

O log da cópia mostra falhas de carregamento de submódulos por caminho de QA excessivamente longo. A causa do encerramento da API continua desconhecida. A revisão de fonte identificou um caminho de erro de spawn com acesso a stdio antes do listener de erro; essa fragilidade está em correção isolada, sem atribuí-la como causa comprovada deste FAIL. Próximo roteiro deve usar raiz própria curta, registrar stderr/exit de forma limitada e tentar cada fechamento cooperativo independentemente. Nova execução somente depois da revisão da correção e do roteiro finito; não repetir R2 ou afrouxar gates.

Provas: `docs/evidencias/20261012-replay-native39-r2-fail-root`. Permanecem válidos os testes anteriores CPU/FS e FFmpeg sintético 16/16 do combinado, com 51 PIDs encerrados e 168 pinos preservados; eles não substituem o ensaio Native. Prazo humano: 12/10 às19h America/Sao_Paulo, sem conclusão automática pelo prazo.

<!-- replay-combined-final-root-20261012 -->
## Replay — backend combinado qualificado na bancada; Native/CEF é o próximo gate

O snapshot final de168 fontes passou9 contratos de fechamento aguardável,3 contratos usando o descarte real do Disk com filas simuladas,4 verificações de gravação atômica em pasta própria e15 contratos do controlador de listas. A fila de metadados aceita termina antes do encerramento da sessão/conexão; somente gravação atômica bem-sucedida do escopo atual marca recuperação como alterada. Navegação e publicação de status não marcam alterações.

A execução seguinte passou **16/16 com FFmpeg real e vídeo/PCM estéreo sintéticos**, através do Disk combinado e com OBS declarado como mock. CUT/FADE400ms, pixels e mistura PCM, ordem/IDs, carga pausada100%, nonce sem segundo render, cancelamento e mudança de escopo foram exercitados.51 identidades próprias ausentes por CIM,168 pinos intactos e descarte das ferramentas/filas confirmado. [Recibos e limites](evidencias/20261012-replay-combinado-final-root/ROOT-RECEIPT.json). Falhas anteriores continuam preservadas.

**Não instalado, não incluído no pacote e ainda sem PASS Native/CEF.** O desenho da Mesa permanece a referência comum para a janela; agulha e previews A/B já têm provas de navegador simuladas, mas os quadros reaisNative39, persistência/autosave60s, permanência sem mutações, reinício e fechamento cooperativo ainda dependem do roteiro finito em revisão. Nenhuma alteração no operador. Codec e montador de pacote seguem em autoria/revisão externa; nenhuma bancada de codec ou novo payload foi executado. Prazo12/10 às19hBRT mantido.

---
<!-- replay-common-ui-dom-root-20261012 -->
## Replay — mesma interface Mesa/janela, agulha e dois previews passaram no navegador

O componente comum baseado no desenho da Mesa passou **36/36 verificações de DOM com API simulada**. A versão com previews A/B também passou36/36: imagens decodificadas, captura durante avanço do cursor, descarte de imagens de outra fonte/sessão, respostas perdidas e cancelamento correlacionado foram exercitados. Navegar entre abas não enviou comandos mutantes; escolhas e controles sobreviveram ao polling. IN/OUT do histórico usam o quadro exibido confirmado; operação somenteA/B, registros legadosC/D preservados.

Ensaio separado de captura passou **13/13**, com quatro imagens em700×540 e1200×760 mostrando A/B simultaneamente e a agulha. Root inspecionou as capturas; UTF8 correto. Os três navegadores próprios fecharam cooperativamente, CIM ausente/profile0, servidores fechados e pinos iguais. Falhas anteriores de inicialização, espera antecipada de ACK e perda de resposta da fixture permanecem preservadas; o componente correto não foi alterado para afrouxar os critérios. [Provas e imagens](evidencias/20261012-replay-interface-comum-root/ROOT-RECEIPT.json).

**Ainda offside, não instalado nem incluído no pacote.** As imagens são sintéticas e as APIs simuladas: não comprovam frames Native/CEF, vídeo no ar, áudio físico, latência/endurance ou WAN. Próximo: qualificar o backend combinado, fechamento aguardável/persistência, previews reaisNative39 e integrar sob guardas; depois montar o pacote completo. Mesa e operador intactos. Claude CLI voltou a entregar respostas revisáveis de codec/pacote; Antigravity continua limitado nas últimas tarefas completas, saldo desconhecido. Prazo12/10 às19hBRT mantido.

---
<!-- replay-whole-playlist-root-r8-20261012 -->
## Replay — listas completas passaram na bancada; Mesa permanece a referência

Root executou uma preparação completa de listas em snapshot próprio de146 fontes: **16/16 verificações passaram**, com FFmpeg real, vídeo RGB e PCM estéreo sintéticos e motor OBS explicitamente simulado. CUT e FADE400ms, cadência, ordem e mistura do áudio, carga pausada a100%, recibo/nonce sem segunda preparação, HOLD/LIVE, retorno condicionado ao Programa, cancelamento, mudança de escopo e limpeza tardia foram exercitados.51 processos próprios ficaram ausentes por CIM; fontes e três originais intactos. [Prova e limites](evidencias/20261012-replay-preparado-root/whole-playlist-r8/ROOT-POST-PLAYLIST-R8-OBSERVATION.json).

A execução anterior R7 falhou na leitura de PCM porque FFmpeg recusou a duração literal `.08`; diagnóstico separado aceitou `0.08`. R8 mudou somente essa fixture e o identificador da execução, preservando16 critérios e fontes de produto. FAIL original preservado. Um PID observado depois de R7 pertencia a `conhost.exe` por reutilização, não à ferramenta própria; nenhum processo alheio foi fechado.

O desenho da **Mesa segue preservado**. Componente comum Mesa/janela externa, somenteReplay A/B e agulha com confirmação de quadro está pronto offside para revisão/DOM. Ainda não integrado, instalado ou qualificado em Native/CEF. O mock não comprova dispositivos, áudio no ar, WAN, endurance ou broadcast final. Próximo: qualificar essa interface comum, Native39 pertinente e pacote atualizado. Prazo12/10 às19hBRT mantido.

---
<!-- replay-combined-interim-root-20261012 -->
## Replay — prova intermediária de backend, interface comum ainda em trabalho

Snapshot próprio congelado de137 fontes passou20 contratos CPU e12 verificações de mídia RGB/PCM sintética com FFmpeg real. Consulta manual do histórico, preview em três pontos, captura limitada, cadência, proxy/lease, cache sem job, cancelamento tardio e callback completo de curva foram exercitados; arquivo derivado só foi publicado após fechamento real das ferramentas. Nonce repetido de curva não iniciou outro job.26 processos próprios ausentes por CIM, fontes e original intactos. Provas: `docs/evidencias/20261012-replay-preparado-root/combined-interim-r1`.

A admissão experimental usa somente A/B; pedidos C/D recusam antes de mídia/Native e registros antigos permanecem iguais. Esta prova é de snapshot intermediário: recibos/cancelamento de listas e ACK da UI recebem correções posteriores; o componente comum ainda é construído a partir do desenho da Mesa, que segue preservado. Produto canônico ainda não recebeu esse backend ou a interface comum. Não é Native/CEF, hardware, latência/endurance, WAN ou pacote instalado. Prazo e restrições da mesa permanecem.

---
<!-- replay-shared-dock-human-direction-20261012 -->
## Replay — direção vigente: preservar a Mesa, mesma interface e somente A/B

O dono esclareceu que a tela acoplada da Mesa é a referência mais correta: **preservar seu desenho e melhorá-lo**, e fazer a janela externa usar a mesma interface. A operação deve apresentar somente **Replay A e Replay B**, sem C/D. A primeira composição externa do commit6a40304 não é aprovação visual final nem está instalada; a próxima composição deve partir do dock da Mesa, não substituí-lo por aquele console externo.

Fonte atual confirma dois renderizadores: `mesa.html::renderSideReplay` e `remoto/replay.html/js`. Root manteve o renderer e o desenho da Mesa intactos; tentativa de preparação de host separado falhou numa guarda antes de escrever fontes canônicas e foi interrompida após a correção humana. Próximo trabalho: componente compartilhado a partir do dock, agulha/preview de quadros reais, seleção A/B, sem recriar a interface durante polling nem mandar comandos de produção ao navegar. A barra de progresso decorativa de45% e elementos legados ocultos não são provas de operação.

Agentes preparam fontes offside e não executam processos. Root executou18 contratos CPU da atualização manual de histórico: consulta de status permanece livre durante uma leitura de metadata bloqueada, navegação não prepara mídia nem altera players, limites/lease/cancelamento/disposal preservados. O controlador de curvas R5 passou CPU com deduplicação/restart e limpeza de artefato após admissão tardia recusada. Ambos são mocks injetados e não Native/CEF ou operação completa. Reviews de fonte ainda corrigem recibos de ACK/nonce e limpeza tardia; composição completa, DOM, Native e pacote permanecem pendentes.

Gemini continua limitado na tentativa completa de revisão: HTTP429/RESOURCE_EXHAUSTED, sem resposta, saldo desconhecido; checks espaçados. Claude CLI aguarda a janela de reset informada (~04:20UTC12/10, sem garantia). Root/agentes seguem no replay autorizado. Operador e instalação preservados; não empacotar o desenho externo6a40304 como layout final aprovado sem esta harmonização e QA pertinente. Prazo12/10 às19hBRT mantido.

---
<!-- replay-operation-layout-root-20261012-0205 -->
## Replay — janela de operação alinhada ao padrão das demais janelas

Ordem do dono: a tela acoplada já está no estilo vMix; melhorar a janela separada de operação. Código atual recebeu somente composição/estilo da operação: botões planos compactos, lances e preview lado a lado, agulha e IN/OUT visíveis, quatro players compactos, transporte e velocidades agrupados e mensagens junto dos controles. Reutiliza `vmix-dialogo.css` aprovado; menu solicita1200×760. `replay.js`, backend, arquivos de Configurações do Replay e CSS compartilhado permaneceram com os mesmos bytes. Listas e curvas experimentais não foram integradas nesta alteração visual.

Root observou a nova operação em DOM real com API simulada, sem erros de console; abriu/fechou Câmeras e constatou somente solicitações de histórico na prévia. Servidor próprio fechou cooperativamente e seu Node ficou ausente por CIM. A agulha aparece desabilitada porque esta fixture não contém uma sessão gravada. Isto não comprova busca em mídia, operação Native/CEF, REC, PGM, latência ou hardware. Screenshot e recibo: `docs/evidencias/20261012-replay-operacao-compacta`.

O controlador experimental também passou dez verificações com FFmpeg real e mídia sintética própria: quadros em três posições, captura limitada, cadência, lease de proxy, cache sem novos jobs e cancelamento tardio. Originais preservados,19 processos próprios ausentes por CIM. Esse resultado é separado da prévia mock e não qualifica a composição completa no programa.

Pendente: QA pertinente da janela nativa e inclusão no novo pacote completo; operador não atualizado por Root. Novo empacotamento deverá consumir o HEAD posterior a esta alteração. Deadline12/10 às19hBRT mantido; sem declaração de broadcast concluído.

---
<!-- managed-source-package-20261012-0110 -->
## Fontes dos componentes gerenciados — complemento de empacotamento

O ZIP oficial DistroAV6.2.1 usado na compilação agora está em `licenses/freemix-distroav-managed/DistroAV-6.2.1-official-source.zip`, SHA6da38f422c6dc826165a7462b4496f967ed7f948bd6a97ba3e0e3143193625e4; catálogo e proveniência declaram o caminho local. A proveniência SceneSwitcher declara o ZIP oficial já presente na base600 assinada, SHA c3cb9d64d9bb9a15b0880a8b6e734ee20368f533fb5fb2aeb40b60aa77b66b2b. O novo montador deverá conferir ambos os ZIPs efetivamente copiados, além dos patches/licenças. Nenhum DLL, fonte C++ ou byte do Native39 mudou nesta complementação; build/QA anterior permanece com os mesmos pins. Pacote completo ainda não montado/selado, mesa intacta.

---
<!-- replay-preparado-root-20261012-0100 -->
## Replay — implementação experimental e provas reais de mídia, 11/10 às22h de Brasília

O dono autorizou Codex e seus agentes a implementar o replay enquanto os CLIs externos retomam. Código experimental preservado em `experimentos/replay-preparado-20261012`, fora dos caminhos de produto. Base canônica c40579b/Native39; nenhuma alteração da mesa/API do operador.

Root executou playlists CPU24/24 e worker real14/14. Em mídia sintética própria, lista CUT seguida de FADE400ms passou cinco verificações:168 quadros/5,6s, cores na ordem, mistura real dos tons PCM estéreo, originais intactos e12 processos ausentes por CIM. Curvas rápido→lento→rápido e rápido→lento passaram quatro verificações reais:72/56 quadros, mapeamento temporal/endpoints conferidos nos pixels decodificados, PCM silenciado, confirmação explícita de silêncio, cancelamento antes da preparação, originais intactos e13 processos ausentes. Provas: `docs/evidencias/20261012-replay-preparado-root`.

Limites: preparação cria um arquivo derivado H264/CRF18 antes de ir ao ar; não é codec sem perdas nem efeito aplicado ao decoder ao vivo. Curva ainda exige confirmação explícita de áudio silenciado; áudio variável não foi qualificado. Preparação consome tempo/disco. Esta bancada não prova Native/CEF, dispositivos, GPU, WAN, quatro câmeras ou longa duração.

Pendentes: integração do worker com todos os caminhos transitivos do replay, agulha/visualização/INOUT e editores de lista/curva na interface, QA da janela nativa/latência/retomada, seleção de codec por medições e novo pacote completo. Fontes experimentais ainda NÃO estão instaladas ou incluídas como recursos ativos do pacote do operador. Falhas anteriores de fixture, inspeção RGB e enum de erro permanecem preservadas nos diretórios próprios; nenhum critério foi relaxado.

Claude CLI voltou e trabalha em revisão de empacotamento/codec. A tentativa completa Gemini de12/10~01hUTC continuou HTTP429/RESOURCE_EXHAUSTED; nenhuma resposta de análise, saldo desconhecido. Seguir checks espaçados, sem afirmar que AGY está trabalhando. Prazo vigente:12/10 às19hBRT; o prazo não transforma pendências em concluídas.

---
<!-- managed-components-root-20261011 -->
## Atual — componentes internos e bloqueios de atualização qualificados

Ordem direta do dono: compilar/integrar os componentes e bloquear updates independentes do OBS/plugins; autorizou o Root a implementar esta frente sem depender de outros agentes. Native39 `7b77e328ec4741ab734e43f3275d37d9d1dfd22e` passou ALL_BUILD, exportação de 39 patches/três submódulos/snapshots e reconstrução --check. Freeze `qa-finalizacao/native-build-frozen-7b77e32-configured.json`, SHA `3952f3d5935f7cabdca57a30db3944522b7b87f59960e85d21b9892a2bedec4c`, 2085 arquivos. OBS updater manual/periódico bloqueado no fork; catálogo RTMP agora força updates OFF mesmo contra flag/cache ON.

SceneSwitcher recompilado com identidade estável FreeMix e backup de migração automático, atômico e imutável antes de LoadSettings. DistroAV recompilado sem auto/manual checker nem controles/handlers de instalação própria; NDI carrega somente o runtime aprovado app-local, ignora variável externa e recusa conteúdo alterado/links. Verificar Complementos agora faz somente diagnóstico local, sem consultas upstream. Bibliotecas internas continuam DLLs controladas da entrega; não afirmar que todos os terceiros foram reescritos ou estaticamente incorporados ao EXE.

QA final real Native39: duas aberturas/dois fechamentos cooperativos, Start/Stop da automação, fonte NDI registrada mesmo com ambiente inválido, backup exato sem regravar no reinício, zero leaks nos dois logs e 2085 post-pins. C++/Qt: backup14/14 e NDI8/8; diagnóstico Node7/7 zero fetch. Receita offline e reconstrução dos nove fontes modificados passaram. Prova sanitizada: docs/evidencias/20261011-componentes-gerenciados-root. Falha inicial da fixture fora de modules preservada e fechada cooperativamente; R2/R3 PASS não apagam o FAIL original.

Fontes/licenças/patches/receita integrados no FreeMix; componentes.json registra os novos hashes destinados à próxima entrega. Inputs aprovados locais: D:/FreeMix-QA-PluginGovernance-20261011-2305/delivery-inputs/APPROVED-INPUTS.json. Ainda NÃO há novo instalador completo selado nem atualização armada com estes bytes; mesa145116 intacta. Próximo: empacotar Native39+três DLLs qualificadas+fontes finais, conferir assinatura/hashes/startup e entregar sem instalar plugins avulsos no cliente. Não homologar hardware/WAN/SDKs fechados por estes testes; demais pendências de replay/áudio/calls/codec permanecem.

---
<!-- sceneswitcher-notice-20261011 -->
## 11/10 — aviso do Advanced Scene Switcher: conferência local

O dono identificou o aviso no FreeMix como Advanced Scene Switcher. A tradução instalada contém: “Detectada uma nova versão do Advanced Scene Switcher. Deve ser criado um backup das configurações antigas?” (`AdvSceneSwitcher.askBackup`). A fonte preservada chama `AskForBackup` quando `VersionChanged` compara a versão salva com `g_GIT_SHA1`; esse caminho solicita backup após uma mudança local, sem consultar um servidor de atualizações. O texto exato visto pelo dono ainda não foi confirmado, portanto a identificação deste diálogo como o aviso observado permanece condicionada ao texto.

Os hashes das duas DLLs instaladas coincidem com as DLLs recompiladas e testadas da correção de shutdown: módulo `699b1f15067fd27dd0aca42a5108b4b1be6d1e863085aabec71cbdfaab294cc0`, biblioteca `5b0e93759d1d544d39371ce7bbe3f7e962a39fead1fe1f6b0cb2d3774d91b24f`. O componente foi adaptado/recompilado, mas continua modular; seus subplugins/dependências oficiais foram preservados. Não afirmar que todos os plugins já foram incorporados ao executável ou que seus diálogos foram governados.

Pendência: integrar identidade de versão estável e aviso de migração/backup ao fluxo FreeMix, preservando configurações e proteção de backup, com revisão de fonte, recompilação e QA próprio antes de distribuir. Nenhuma DLL, macro, configuração ou processo do operador foi alterado nesta conferência. Bloquear o updater do OBS não substitui o tratamento dos diálogos de cada componente.

Observação somente leitura: `obs-vmix/version.json` agora declara `0.1.0-local.20261011145116`; o estado anterior “incremental ainda não aplicado” ficou histórico. Root não aplicou a atualização. Esta leitura não qualifica todos os recursos da mesa ou substitui os testes pendentes.

---
<!-- prazo-humano-20261012-1900 -->
## Prazo vigente — segunda-feira, 12/10/2026, às 19h de Brasília

Pedido direto do dono em 11/10: entregar o sistema pronto amanhã às 19h (22h UTC), substituindo o prazo anterior de 13/10. Coordenar Claude CLI e Antigravity continuamente enquanto disponíveis, acompanhar cada tarefa até uma entrega revisável e verificar cota quando houver parada. Com um provedor indisponível, seguir pelo outro; com ambos limitados, aguardar e verificar disponibilidade espaçadamente. Não inventar saldo nem tratar timeout ou resposta vazia como falta de créditos.

A automação existente passa a acompanhar a cada 20 minutos; tentativas de provedor com limite prolongado permanecem espaçadas. Preservar a mesa do operador. Entregar código, documentação e pacote local qualificado; registrar separadamente o que ainda não passou em testes ou depende de equipamento/rede/licença. O prazo não transforma recurso pendente em concluído. A meta antiga do aplicativo está em `usageLimited`; a ferramenta disponível não permite editar seu objetivo/prazo. Este bloco e a automação registram o novo prazo sem encerrar falsamente a meta antiga.

Pedidos do replay preservados: agulha com visualização durante a busca e IN/OUT preciso, listas sequenciadas com transições e curva de velocidade. Comparar codecs para qualidade, gravação, leitura e busca rápidas com testes próprios; distinguir compressão sem perda de qualidade visualmente próxima. Recursos novos e pacote completo atual continuam pendentes de integração/qualificação.

---
# Pendências reais — atualização em 11/10/2026, ~15h23 (São Paulo)
<!-- rodada-20261011-1523-r3 -->
> **Leia primeiro este bloco.** Resume o estado mais recente conferido pelo Root. O registro de 10/10, 23h30, abaixo, continua sem alteração.

**Git:** base verificada no HEAD `c4f374268adae2e73a71189400cd1bd26997d59b`, limpo e idêntico ao `ls-remote` do branch `feat/native-menus-config-screens` em https://github.com/eddysangalli/FreeMix nesta checagem. Código integrado está publicado; propostas/bancadas em preparação (offside) permanecem locais, fora do repositório. Commits futuros ficarão adiante deste HEAD.

**Instalação:** o instalador completo selecionado, `0.1.0-local.20261010060000` / Native24/a047860, foi validado em instalação própria do Root (ambiente de QA) — não é a versão hoje em produção na mesa do operador. A mesa real roda `0.1.0-local.20261009153453`. A atualização incremental `0.1.0-local.20261011145116` (Native38 `ed08547` + painel `71f8aa7`) está armada, ainda não aplicada; aplica-se só quando o dono fechar o FreeMix e abrir de novo pelo `ABRIR-FREEMIX.cmd`. O ensaio de abrir/atualizar/desfazer passou numa cópia de fábrica, não é homologação com a configuração do operador. Ainda não há pacote completo novo selado com as fontes finais do Native38; o instalador completo selecionado continua sendo o Native24 anterior a essas fontes.

**Conferência Root (somente leitura):** assinatura e 394 hashes de arquivo do pacote conferidos; as 18 fontes atuais de UI/API/Mesa batem com o pacote armado.

**Correções já no motor:** Native37 já corrige o inventário de áudio tolerante a uma entrada defeituosa (ASIO/dispositivo sem nome não descarta mais todos os válidos); Native38 já permite cada janela abrir no tamanho pedido pela página.

**Sete janelas novas:** roteiros relataram 122/122, mas a maior parte dessa automação roda num navegador Edge separado, não na janela CEF embutida. Só o caminho de abrir a engrenagem e fechar pela janela de verdade dentro do programa foi provado separadamente (não os 122 casos). Chamadas reais de retorno/microfone/WAN não foram testadas.

**App36 — autosave:** R3 (motor antigo) teve FAIL de autosave durante a permanência nas telas; preservado como histórico. Corrigido via Gemini (commit `e801`) e confirmado em **App36 R4e: PASS** — 60.077ms de permanência, contadores run0/execute1/journal2/mutatingReq19 iguais ao início, Preview 90ms, Cut 165ms, dedupe/tags corretos, autosave só após mudança real, checkpoint manual HTTP 200, fechamento limpo (cleanup 0). Prova: [App36 R4e](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md) e `receipt-r4e.json`. Essa prova cobre Native36 + painel `e801` — ainda não o Native38 atual.

**Linha visual aprovada:** o dono aprovou a linha geral das telas que Claude vem refazendo como cópia do vMix. Isso não aprova especificamente o teste com API MOCK (prévia de Calls com chamadas sintéticas) como prova de produto — motor Native, microfone e WAN continuam sem prova real.

**Pendente, preparado, não executado:** roteiro de QA de fontes/preferências nativas do Calls; faltam 3 testes de Configurações Gerais (importar arquivo real, baixar Exportar dentro da janela, botão nativo “todas as preferências”). Revisões de fonte sobre stream/concorrência/reconexão aguardam confirmação em runtime.

**AGY/Claude:** a última chamada ao AGY recebeu HTTP 429 (RESOURCE_EXHAUSTED, resposta de 0 bytes); nova tentativa espaçada (18h25 UTC) recebeu o mesmo 429. Claude, por outro lado, já retomou e respondeu integralmente depois disso — não está mais bloqueado. Resumo: cotas interromperam parte das tarefas; Claude retomou; o AGY, na última tentativa, continua bloqueado.

**Changelog:** o repositório não tinha changelog; criado `docs/CHANGELOG.md` com o histórico de 10/10 e 11/10.

## Tabela de prioridades — status / trabalho restante / critério

| Prioridade | Estado comprovado | Trabalho concreto e critério | Prova / referência |
|---|---|---|---|
| P0 — MultiGravação MKV estático | Início recusado com fonte parada: FAIL; MPEG-2 TS grava normal. | Investigar causa raiz (pacote de vídeo em 10s) com teste positivo/negativo real; não ocultar formato nem só subir timeout. | CONTINUAR.md |
| P0 — Calls A/V contínuo | Drift 9,778863 ms/s: FAIL, recurso OFF. | Isolar clock/pacote por metadata antes de religar. | PENDENCIAS-REAIS.md |
| P0 — Estabilidade de transmissão (saídas simultâneas/reconexão/latência sob carga) | Prioridade atual do dono; QA final de persistência sob carga ainda pendente. | Ensaio de longa duração real com saídas simultâneas, reconexão e carga; só depois selar pacote completo novo com as fontes finais do Native38 (ainda não selado). | PENDENCIAS-REAIS.md |
| P1 — RNNoise | Redução 1,0358 dB, exigido 3 dB: FAIL. | Isolar PCM/parâmetros reais mantendo meta de 3 dB. | PENDENCIAS-REAIS.md |
| P1 — LocalVocal filtro vivo / FTB completo | Fechamento comum só com filtro removido; FTB só no cursor (motor legado). | Ensaio com filtro vivo e cancelamento real; repetir FTB no Master atual. | PENDENCIAS-REAIS.md |
| P2 — Menus antigos + Configurações Gerais | Áudio/dados/composições/macros/recuperação/diagnósticos/replay/Avançado/SRT/RIST/SDI no editor antigo; Config. Gerais 18/18 PASS, 3 casos sem cobrir. | Refazer telas copiando o vMix; testar import real/export/preferências nativas. | CONTINUAR.md |
| P2 — Replay endurance | Capturas pontuais (A/B, segmentos Master) PASS. | Ensaio de longa duração específico do Replay. | PENDENCIAS-REAIS.md |
| P2 — Assistente de projetos / NVIDIA | Criar/varrer e aprovação completa NVIDIA: false. | QA de cobertura e capability real antes de habilitar. | PENDENCIAS-REAIS.md |
| P2 — Travamento ao fechar via navegador externo | Só em teste; caminho do operador fecha limpo; causa não investigada. | Investigar causa raiz no motor. | CONTINUAR.md |
| Externo — hardware/licença/rede/certificado | ASIO/SDI/HDR/OMT/PTZ, NDI Advanced, WAN duas redes, Windows limpo, Authenticode. | Depende de recursos externos; QA de software não substitui. | PENDENCIAS-REAIS.md |

Histórico anterior (10/10, 23h30) preservado abaixo, sem alteração.

---
# Pendências reais — visão atual em 10/10/2026, 23h30
<!-- rodada-20261010-noite -->

**Mudou nesta rodada:** o P0 dos menus foi fechado com prova real (linha riscada na tabela). Entrou um item novo, pequeno: **inventário de áudio tolerante a uma entrada defeituosa** (hoje uma única chave quebrada em `HKLM\SOFTWARE\ASIO`, ou um único dispositivo de reprodução sem nome, faz o programa descartar todos os dispositivos válidos); correção em preparo junto com a revisão dos patches 0025–0036. O resto da tabela continua como estava.
**Entrega aprovada:0.1.0-local.20261010060000 / Native24, imutável. Fonte atual Native36 e DLL LocalVocal cumulativa são QA/fonte, sem novo instalador aprovado.** Os PASS abaixo têm escopo finito; o histórico posterior não substitui esta visão vigente.

**Acréscimo de 11/10, 11h40 (Claude):** as seis janelas novas (Streaming, Chamada de Vídeo, Saídas externas, Gravação, MultiGravação, Configurações do Replay) passaram com o programa real e a atualização da mesa do operador foi **armada** (detalhes e limites em CONTINUAR.md). Entraram quatro itens:
- **Aplicação na mesa real ainda não vista**: só o dono abrindo pelo `ABRIR-FREEMIX.cmd` aplica; os ensaios usaram configuração de fábrica, não a dele.
- **MultiGravação em MKV com imagem parada**: o motor recusa o início ("não produziu vídeo no disco") porque exige um pacote de vídeo no arquivo em 10 s; com cor lisa/imagem fixa o MKV demora mais a descarregar. MPEG-2 TS grava normal. Corrigir no motor (`replay-disco.mjs`, conferência do início) ou esconder MKV até lá.
- **Programa trava ao fechar e grava relatório de erro depois que uma cópia da página da mesa, num navegador de fora, manda abrir janelas** (só em teste; o caminho do operador fecha limpo). Causa no motor não investigada; pode esconder um defeito real de vida útil das janelas.
- ~~Janela de Configurações gerais~~ **feita às 11h45** (`/configuracoes`, 18/18 com o programa real). Falta nela: conferir Importar com arquivo real, o download do Exportar dentro da janela do programa e o botão "Todas as preferências do programa".

## Software que ainda exige trabalho ou prova

| Prioridade / frente | Estado comprovado | Trabalho concreto e critério | Quem pode provar / condição |
|---|---|---|---|
| ~~P0 — abrir menus sem executar comandos~~ **FECHADO em 10/10 23h** | App36 R4e em execução real: cinco telas + 60 s com contadores idênticos (run 0, execute 1, journal 2, escritas 19); Preview 90 ms e Cut 165 ms confirmados; salvamento automático só após mudança; fechamento limpo. [Prova](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md). | Repetir o mesmo ensaio sempre que o motor ou o painel mudarem (≈8 min, automatizado) e no instalador novo. Ordem das janelas no Windows e telas dentro do programa (CEF) continuam fora desta prova. | Qualquer um, seguindo "Como repetir o ensaio de App" em CONTINUAR.md. |
| P0 — Calls A/V | Vídeo/RGB/CEF e áudio sintético recebido têm provas separadas; drift9,778863ms/sFAIL. | Coletar metadata recebida/pinos/cleanup e correlacionar flash→callback/RTP com codec observado. Só então implementar correção causal e repetir mesmos bounds. Depois integrar/qualificar PCM Native/N-1/talkback e VDO real. | Root aprova uma execução exclusiva; agente analisa clock/draft. Campos ausentes ficam desconhecidos; submittedPTS/packetloss0 não aprovam A/V. ContínuoOFF. |
| P1 — RNNoise | Filtro criado/readback confirmado; Master real/preset/limitador/restauraçãoPASS. Redução1,0358dB<3:FAIL. | Isolar PCM antes/depois, bordas da captura e parâmetros reais mantendo fixture/3dB. Corrigir apenas causa reproduzida e repetir restauração/zero corrupção. Não substituir estímulo/meta para passar. | Root executa captura digital própria; agente diagnostica fonte/oracle. Não exige microfone/hardware para esta lacuna digital. |
| P1 — LocalVocal vivo | Português próprio3/5PASS no critério finito; close ordinário após remover/desabilitar filtros passou0. DLL cumulativa somente QA. | Ensaio separado com filtro ainda vivo/inferência em curso, cancelamento real/cooperativo, fonte/contexts liberados, exit0/alloc0/crash0 e pins.17casos negativos/inglês ainda não qualificados. | Root integra/build e executa QA exclusiva; agente prepara cenários/patch após evidência. Não atribuir todas35alocações antigas a um único leak nem inferir cancelamento pelo log pós-whisper. |
| P1 — FTB NTSC | Native33R4: cursor no RESTART real PASS no oracle original;196samples completos, PCM/interior e close0 PASS. Native32FAIL preservado. | Qualificar FTB no Master final e regressões pertinentes de seek/cache/VFR/velocidade/endurance, com mesmas tolerâncias. O teste de cursor deixou FTB/SRT desligados; fullFTBPass=false. | Root em QA própria. Capturas fonte e PTS submetido não são exibição física/PTS de áudio/AV/WAN. |
| P2 — precisão/recursos de IA | Cor/nitidez/chroma finitosPASS; Tiny3/5tokens próprio não é precisão geral. NVIDIA policy/registro insuficiente. Inglês/generic/cloud indisponíveis. | Mais fixtures e critérios declarados de legenda, qualificação modelo/plugin e inglês real; NVIDIA exige versão aprovada/capability real e prova visual/latência. Cloud só com backend/conta/chave/custo consentidos. | Root + QA própria com recurso autorizado. SDK local existe; não baixar/ativar silenciosamente nem inventar tradução genérica. |
| P2 — assistente de projetos | Preview/export/host implementados, criação/scanfalse. | Qualificar fluxo novo/inativo, perfil/coleção/rollback/ownership e cobertura; depois wiring habilitável. Hardware discovery é gate separado. | Root integra/QA; agente prepara modelos. JSON exportado não significa projeto pronto no ar. |
| P2 — nova entrega/uso prolongado | Setup600 instalado e selecionado; Native32build/freeze e testes delimitados. | Integrar somente correções aprovadas, selar pacote novo e validar instalado/aberturas/fechamento/persistência. EnduranceSSD/GPU/carga é validação adicional. | Root/installer em instalação própria. Não declarar fonte atual instalada nem performance universal. |
| P2 — plugins/atualizações | Verificador/assinaturas/HTTPSlocal/guards têm provas próprias. | Qualificar forkDistroAV e cadeia plugins/SDK restantes, comportamento negativo das versões/loader e canal real quando destino existir. | Root revisão/QA; licença/destino não supridos não viramPASS. |

## Recursos externos ou contrato ausente

| Frente | Condição concreta pendente | Limite atual |
|---|---|---|
| SDI/HDR/ASIO/OMT/PTZ/controladores | Equipamento/receptor/driver/câmera/controlador e ensaio físico autorizado. | Contratos e QA software não certificam audição/metadados/sincronismo físicos. |
| NDI HDR Advanced | SDK/licença apropriados e receptor compatível. | Não contornar licença nem relabel SDR comoHDR. |
| WAN/bonding/Calls convidados | Duas redes reais, VPS/domínio/TURN e pares externos. | Loopback/FEC/NACK não aprovam estabilidadeWAN. |
| Distribuição pública/Windowslimpo | DestinoHTTPS, certificadoAuthenticode e máquina limpa. | Cliente/localHTTPS já delimitados; publicação/autenticidade externa ainda não provadas. |
| Editores Windows atrás dos menus | Observação desktop de z-order/foco com controle permitido. | Qtvisible/focus não garante janela acima da mesa; não usar hacksAlwaysOnTop. |
| GTZIP fora do subconjunto | Exemplos/frames/tempo/XML/contrato finito das famílias ausentes. | QR/ticker/templates/shape subset não é conversor universal3D/feed/TypeAdd. |

**Já PASS em software, sem recolocar como código faltante:** Replay30R3(18capturas A/Bdelta0,14segmentos Master exclusivo/silêncio), imagem cor/nitidez/chroma e restauração, Master digital/preset voz/restauração, contratos GETsettings protegidos, fechamento ordinário próprioR4 e provas anteriores de transporte delimitadas. Cada versão instalada/endurance/hardware conserva seu gate pertinente.

Estimativa condicionada: não há ETA confiável para App/Calls/RNNoise antes localizar causa. Ensaios finitos têm duração/captura declaradas, mas preparação, review, build e eventual correção podem exigir várias sessões. Recursos externos dependem de disponibilidade/licença/acesso. O prazo até13/10 não muda um FAIL nem dispensa critérios.

**Histórico anterior abaixo:** conservar bytes/recibos e marcar explicitamente versões superadas; não repetir totais antigos como status atual. Referências públicas vigentes: qualidadeR4/App32R2 e Replay30R3 em `evidencias/`; [FTB R3 foi integrado pelo Root](evidencias/20261010-ftb32-r3-reset-observation/ROOT-README.md); Calls metadata segue preparado sem nova execução real.

Revisão Root deste topo: GitHub98d4bad. Duas ações de abertura têm caminho estático plausível em `atalhos-engine.js`: blur/pagehide enviam controller_release mesmo sem tecla/MIDI ativo. Patch está em revisão; o ledger anterior não prova os nomes. [FTB32 R3 e limites](evidencias/20261010-ftb32-r3-reset-observation/ROOT-README.md).

---

# Pendências reais do FreeMix

Entrega selecionada: **0.1.0-local.20261010060000, Native24/a047860**, imutável. Fonte atual Native36/e81afe7 compilada viaALL_BUILD e congelada:2085arquivos,36patches/3submódulos/231snapshots reconstruídos. Cursor retido integrado; reinício NTSC real33 PASS no cursor, fullFTB ainda pendente. Ainda não há novo instalador aprovado. Native30/93d73e2 e candidato093000/FAIL permanecem históricos.

| Frente | Prova atual | Falta concreta |
|---|---|---|
| Menus/SRT/MultiStream/Calls | Fontes simplificadas,90checks e capturas próprias; Outputs6 e foco em campo inválido integrados. | QA instalada atual, persistência, revisão visual e uso com convidados. AppR3 preparado; precisa snapshot atualizado após integrações. |
| Botões/lentidão | Medições e quatro cards antigos PASS; corrida de leitura reproduzida em modelo realJS. | MesaR4 fonte integrada54checks Root; medir pointer/browser sob carga representativa e longa duração. |
| Fechamento/crashes | Meter30 real sem avisos/alocações/crash. | Novo pacote, reprodução dos stacks antigos e carga longa. QA176324 encerrado/conferido e novoReplay30 fechou automaticamente exit0. |
| Replay | Cadência de clip completo integrada;26modelos/FFprobe CFR900/VFR885/540 PASS; timeline/IN-OUT/autoplay históricos. | Ensaio realNative30 R3 PASS18capturas/14segmentos Master; falta repetir verificações pertinentes no32 e enduranceSSD/GPU. |
| FTB |30fps9checks reaisPASS;29,97fpscursorFAIL. | Diagnóstico de relógio já integrado/compilado32; provar reset/PTS e corrigir falha antes habilitar globalmente. Não relaxar tolerâncias. |
| Calls/N-1/talkback | RGBA/CEF local e áudio remoto sintético;AVSyncFAIL9,78ms/s. | Corrigir cadência/AV, PCM/N-1/talkback e audição/convidados/VDO/WAN reais. ContínuoOFF. |
| Qualidade/IA | Enum/defaults8 e modelo/hash reais; SDKfingerprints presentes. | R5+abasR6 fonte integrada45checks Root; pixels/PCM/ASR/GPU/latência; tradução para inglês só após teste. Outros idiomas/backend cloud não implementados. |
| Assistente/presets | Prévia/exportação e geometria H/V no draft concreto. | Wiring centralR5 e QA real/perfil/coleção/rollback; helpersReadonly já compilados32; não confundir exportarJSON com projeto pronto. |
| Atualizações | Verificador cliente integrado; canal Ed25519 existente. | GuardasNative compiladas32 aguardam QA; qualificar forkDistroAV e auditar plugins/SDK; stocknão corrigido. PublicaçãoHTTPS/canal depende de destino. |
| Editores atrás dos menus | UUID/focoQt antigosPASS; raise/activate/transient requester no source. | Prova real de z-order Windows; não há controle nativo disponível nesta sessão. |
| NDIHDR/SDIHDR/ASIO/OMT/PTZ | Contratos/provas de software delimitados. | LicençaNDIAdvancedSDK e equipamento/receptor/driver/câmera/controlador, metadados e audição físicos. |
| WAN/bonding | Loopback/FEC/NACK/HTTPS local. | Duas redes reais,VPS/domínio/TURN e perda/receptor externo; recursos ainda não disponibilizados. |
| GTZIP universal | Conjunto finito títulos/ticker. | Exemplos das famílias/tempos ausentes e implementação correspondente; não importa qualquer3D/feed. |
| Distribuição | Setup600 aprovado; wrapper caminhos266/276/400PASS. | Selar nova versão após checks atuais. Windowslimpo/Authenticode/HTTPS precisam recursos externos. |

Estimativas são esforço por frente, não prazo garantido: integração/QA requer uma ou mais sessões por mudança; correções de mídia dependem do resultado; hardware/WAN/licença dependem dos recursos acima. Nenhuma falta de acesso será substituída por PASS de modelo.

[Medidores e fechamento](evidencias/20261010-meter30-real-pass/ROOT-README.md) · [FTB30/NTSC](evidencias/20261010-ftb-native30-gate6/ROOT-README.md) · [Calls AV](evidencias/20261010-calls-av-muted-consumer/ROOT-README.md) · [Replay/cadência](evidencias/20261010-replay-full-cadence-r2/ROOT-README.md) · [Saídas](evidencias/20261010-outputs-read-ack/ROOT-README.md) · [Governança cliente e capacidades](evidencias/20261010-quality-project-update-checkpoint/ROOT-README.md) · [MesaR4](evidencias/20261010-mesa-r4-root/ROOT-README.md).

Preservar a mesa/API51911, vMix, Calls, REC, mídia e configurações do operador. Máximo Root+3 agentes, testes em raízes/portas próprias, fechamento cooperativo; nenhum force. Todos os Native QA anteriores foram encerrados e conferidos. Novos ensaios usam prefixo FreeMix-QA-, ownership/PID/marker, qaClose e fechamento cooperativo automático, sem depender do usuário; nenhuma proteção foi contornada. Não reviver alpha web abortado; ponte nativa beta separada. Commit/push GitHub e pacote local autorizados; nenhum upload/publicação de serviços ou dados externos. O prazo não transforma recurso sem prova em concluído.

Histórico anterior preservado em historico/20261010-1255-before-current-status/.


[Replay30 realR3](evidencias/20261010-replay30-real-r3-pass/ROOT-README.md) · [QualidadeR5/abasR6](evidencias/20261010-quality-r5-tabs-r6-root/ROOT-README.md) · [Native32](evidencias/20261010-native32-build/ROOT-README.md).

Histórico exato anterior: historico/20261010-1335-before-replay-quality-native32/.


## Atualização adicional — assistente de projetos R5 integrado

Root integrou29 arquivos do host/API/assistente, manteve autenticação local e a mesma conexão SDK compartilhada, e repetiu10 modelos de funções reais e28 verificações de sintaxe. A closure oficial alcança104 módulos, incluindo JSON de política e os imports do painel. O primeiro check Root esqueceu o parâmetro de roots do painel; a falha foi preservada, e a revisãoR2 confirmou os29 destinos/backups antes de finalizar.

Configurar → Novo projeto · prévia e o Hub agora abrem o assistente em três etapas: formato, quatro posições de câmera/áudio e conferência. Exportação da prévia permanece disponível; criação e consulta física continuam desabilitadas por política false/false até QA próprio de cobertura e Native. O fluxo prepara um projeto novo/inativo e restaura o atual; não ativa câmeras, áudio ou transmissão. Não equivale a projeto pronto no ar.

O adaptador de consulta teve correção separada: timeout bloqueia a conexão antiga, uma nova conexão pode consultar, e resposta/timer antigos não contaminam o contexto atual. Root repetiu3 modelos. Isso não cancela pedidos já enviados e não reseta um gate global BLOCKED. MesaR4 recebeu apenas o acesso ao novo assistente, conservando suas proteções de leitura/UUID e o launcher/health existente; navegação e latência real aguardam App32.

Qualidade32 R3 já encerrou: imagem/ASR finitos PASS, áudioMaster silencioso e35 alocações mantêm FAIL; confira a atualização adicional abaixo. LocalVocal catálogo/modelos teve revisão de fontes, mas ainda aguarda compilação/qualificação cumulativa. Selected600 continua imutável.

[Host, menu e reconexão](evidencias/20261010-project-host-r5-root/ROOT-README.md).


## Conferência real adicional — Qualidade32 e Antigravity

Qualidade32 R3 executada e encerrada: cor +70/off0, nitidez energia2,23×/off0, chroma verdealpha0/primeiro planoalpha255/off0; Tiny português confirmou3/5tokens de fala sintética própria em4s. Cinco recusas de NVIDIA/inglês/campo inválido tiveram zero escrita. Isso prova estes estímulos finitos, não qualidade geral de microfone/IA. A R2 anterior falhou por fixture sem pixels elegíveis; o FAIL foi preservado e a R3 manteve os mesmos critérios.

R3 continua FAIL: seis segmentos digitais Master em silêncio não qualificam RNNoise/preset de voz; rota/captura ainda precisam isolamento. Fechou cooperativamente exit0 sem crash, porém registrou35 alocações. Foi encontrado um vazamento concreto de referência no callback LocalVocal ao obter settings do texto sem release; correção cumulativa está em preparação, sem atribuir todas as35 a esse ponto. Root conferiu PID113228 ausente e rehash2085origem+2085destino/26QA/46bases/4externos PASS em revisão separada. Nenhum critério foi relaxado nem relatório original trocado.

App32 preparado com450 arquivos idênticos à fonte atual; Root leu runner completo, contratos/fechamento/handoff e guardas. Execução própria de menus/Preview/Cut/persistência ainda pendente. Assistente hostR5 já integrado, criação/scan continuam false/false. Native32 e setup600 permanecem imutáveis; nenhum instalador posterior foi aprovado.

Antigravity autenticado e CLI respondeuOK com sucesso; catálogo confirmou gemini-3.8-flash-high e uma análise auxiliar terminou com resposta. Saldo/cota não quantificado. Conforme preferência atual do usuário, as três frentes passaram a priorizar Gemini em diretórios isolados com somente fontes públicas selecionadas; Root acompanha e revisa. Não enviar logs, mídia, configurações ou credenciais do operador. Resposta vazia/timeout não equivale a tarefa concluída; continuar até resultado ou cota indisponível, então seguir no Codex.

[Qualidade32 R3 — resultado parcial e falhas preservadas](evidencias/20261010-quality32-real-r3-partial/ROOT-README.md) · [Falha de fixture R2 preservada](evidencias/20261010-quality32-real-r2-fixture-fail/ROOT-README.md).


## Estado mais recente — Qualidade32 R4 / menus App32 R2

Nove arquivos de fonte integrados: consulta protegida GETsettings em três clientes, fechamento de132 módulos, saídas escuras com escolha explícita e três etapas.12 modelos UI+24 de leitura+checks de sintaxe/closure PASS. Build cumulativo LocalVocal R3 offline real configure0/build0; DLL5aa7f14d… somente QA, não operador/Setup600.

Qualidade32 R4: pixels cor/nitidez/chroma e áudio Master real/preset digital/restauração PASS, ASR português sintético3/5 PASS. RNNoise FAIL1,0358dB<3. Filtros foram removidos/desabilitados antes do fechamento ordinário, que passou exit0/alloc0/crash0/pins. Não declarar cancelamento em voo nem shutdown com filtro vivo;17 casos negativos e transcrição inglesa ainda não qualificados. Históricos R2/R3 e35 alocações preservados.

App32 R2: cinco telas reais Root IAB conferidas; Replay/settings no endereço correto. GETsettings e contratos HTTP não mudaram contadores; configs/áudio pós-IAB permaneceram iguais. Mesmo assim abrir/polling enviou duas ações Production.run (0→2), execute1→3/journal2→8: FAIL, investigação em andamento. Preview/Cut/latência ficaram sem execução. PIDs79660/157048 ausentes, fechamento exit0/alloc0/Meter0/crash0 e2085+452pins PASS. Eventos iniciais Root sem scope foram recusados e preservados; ACK/prova corretos aceitos, sem mexer no critério.

Calls continua drift9,78ms/s FAIL; FTB antigo2702→33→0 FAIL. Próximas frentes próprias: abertura da mesa, observaçãoNTSC com cena Programa distinta e diagnóstico clock real Calls, RNNoise e shutdownLocalVocal vivo. Native32 congelado e setup0.1.0-local.20261010060000 imutáveis; nenhum novo instalador aprovado, nem operador alterado. Gemini permanece primeira escolha para análises delegadas de fontes públicas selecionadas; quotas não quantificadas, resultados revisados pelo Root.

[Evidência real R4/R2 e limites](evidencias/20261010-quality32-r4-and-app32-r2/ROOT-README.md) · [Build cumulativo](evidencias/20261010-localvocal-cumulative-r3-build/ROOT-README.md).


### FTB32 R3 — diagnóstico adicional

Observação própria concluída com cena Programa distinta e UUID original ativo. UmRESTART:1601→1634→33(fallback inválido,epoch2,resetReadyfalse)→0(PTS submetido válido,mesmaepoch,resetReadytrue). Critério original continua FAIL; fullFTBPass=false. Quatro capturas fonte/barcodes e áudio digital Master440/880Hz/interior do arquivo PASS. PID84792ausente, exit0/alloc0/crash0/fullpinsPASS. Sem reconhecimento físico nem PTS de áudio da fonte. [Recibo e limites](evidencias/20261010-ftb32-r3-reset-observation/ROOT-README.md).


## Correção de abertura ociosa — fonte integrada, prova real pendente

Root integrou atalhos-engine.js: blur/pagehide deixam de enviar controller_release quando não existe controle pressionado ou pedido pendente; teclado/MIDI/manual/adaptador preservam liberação defensiva e ACKs antigos não apagam posse nova.21 modelos do IIFE real, pins e sintaxe PASS; closure132 intacta. Correspondência com os dois comandos AppR2 é estática/temporal: o ledger antigo não guardou seus nomes. AppR2 FAIL e primeiro modelo falho preservados. AppR3 real e Preview/Cut/latência/persistência continuam pendentes; nenhuma mesa/API/Native do operador tocada. Setup600 permanece selecionado e imutável.

[Correção e limites](evidencias/20261010-controller-release-idle-root/ROOT-README.md).


## Native33 — compilado, cursor retido; reset real pendente

Root integrou três fontes retained-r2: último PTS válido retido sob mutex em vez do next_pts futuro do decoder durante reset.19 modelos Root e oracle legado sobre195 amostras históricas passaram como previsão de modelo; o FAIL real anterior fica preservado. Native33 c990c4a39c445542d363f6950fb8f7f70811034a foi configurado/compilado ALL_BUILD e congelado2085 arquivos, rehash independente PASS; exportação33patches/3submódulos/231snapshots e reconstrução--checkPASS. Timestamp inválido/política de cursor mudaram explicitamente; novo observador exige contrato novo, sem alterar limiares. Nenhum Native executado nesta rodada e FTB continua não qualificado.

A guarda de atalhos também está integrada (21 modelos), mas App real com zero mutações/Preview/Cut/latência/persistência segue pendente. Polls Native talkback/network_output com manutenção não são leituras puras e não serão escondidos para obter PASS. CallsAV e RNNoise continuam FAIL; LocalVocal vivo/cancelamento pendente. Setup600/Native24 permanece selecionado e imutável; versão0.1.0-local.20261010161000 é somente desenvolvimento.

[Native33 e limites](evidencias/20261010-native33-retained-cursor/ROOT-README.md) · [Navegação ociosa](evidencias/20261010-controller-release-idle-root/ROOT-README.md).


## Entradas — menus e confirmação de editor integrados em fonte

Root integrou mesa/menu +helper: sourceUUID/sceneUUID/coleção, conferência de conexão após awaits, proteção contra abertura dupla e aviso persistente separando pedido aceito de janela observada. Sem retry da primeira escrita quando há timeout. Configurar/Filtros seguem por fonte; duplicações da mesma identidade foram removidas. Recolher cartão descreve a ação local; Excluir entrada conserva recibo UUID/coleção e proteções Programa/keyers.34 contratos Root CPU/DOM reais+sintaxe+closure132 PASS, helper incluído pelo pacote. Nenhum Native/API/browser/desktop iniciado aqui. Abertura/foco/z-order/latência/persistência reais continuam pendentes; não declarar janela física corrigida. Setup600 e operador preservados.

[Entradas: fonte, prova e limites](evidencias/20261010-input-editor-feedback-root/ROOT-README.md).


## Native33 — reinício NTSC real passou no cursor

Um RESTART próprio,196samples completos:1634→1634(retido/inválido,epoch2)→33(válido/ready) e progressão, sem segunda volta. Oracle legado sem alterar critérios:PASS; originalNative32FAIL preservado. Quatro capturas/barcodes44/11/41/116 e PCM Master440/880Hz/interior PASS. PID27684CIMausente, exit0/alloc0/crash0 e2085+2085/22/54/3pins intactos. FTB/SRT ficaram desligados; fullFTBPass=false e tela física/AV/WAN não provados. [Recibo e limites](evidencias/20261010-ftb33-r4-retained-cursor-real/ROOT-README.md).


## Native34 — consultas de estado separadas; build PASS, QA real pendente

Root integrou uma fonte após40checks: network/state sem inserir mapas/criar output-view-áudio/carregarSDK/aposentar mídia; capacidade cacheada no startup/start explícito. Timer e writes conservam aposentadoria terminal. talkback/state deixa expiração ao watchdog existente. Configure/ALL_BUILD/2085frozen+rehash/34patches/3submódulos/231snapshots/reconstruçãoPASS. Fonte 0.1.0-local.20261010171617 somenteDEV; nenhum Native34 iniciado nesta rodada. SDK real, scheduler/readonlyApp34/Preview-Cut/latência/persistência/fechamento continuam gates. Sem relaxar zero mutação.

Antigravity priorizado: implementação headless recusada/vazia/truncada nos limites finitos, fallback declarado; isso não é prova de falta de cota. Revisões curtas inline do Gemini concluíram54,5s/89s sem ferramentas. LocalVocal telemetria OFF/CMake e Calls result-order continuam drafts/preparações, sem build ou prova de cancelamento/AV. Setup600 selecionado e imutável. [Build, fonte e limites](evidencias/20261010-native34-readonly-state/ROOT-README.md).


## Native35 — inventários explícitos de áudio e SDI; compilado, teste real pendente

Root integrou onze arquivos de produto (seis Native/cinco painel) após repetir25modelos áudio e13SDI e verificar as revisões independentes. Leituras de áudio usam inventários cacheados sem criar sessão/timer ASIO nem enumerador WASAPI. Atualizar dispositivos consulta explicitamente. SDI/destinos leem cache; Consultar placas e modos faz refresh explícito e configure/start revalidam. IDs salvos ausentes permanecem indisponíveis, sem escolher outro driver automaticamente. Parar Direct Out existente continua possível sem inventário e sem criar filtro. Configure ASIO registra imediatamente invalidação de perfil/coleção; watchdog permanece.

Native35 5b680a17a1db65c66ce6a696f1da8ca69d29f49e ALL_BUILD/2085arquivos rehash/35patches/3submódulos/231snapshots/reconstrução--checkPASS. Fonte 0.1.0-local.20261010175421 somenteDEV. Nenhum Native35 iniciado. App34 bloqueado original preservado; App35 precisa snapshot/classificação atual e QA real com zero comandos/mutações ao abrir menus. Dirty-form DirectOut está em revisão separada: polling ainda pode sobrescrever uma escolha pendente até essa correção. Não há prova física de ASIO/SDI/HDR, hotplug ou latência/watchdog. Flags de inventário não certificam hardware.

Gemini foi priorizado: áudio recebeu resposta vazia/exit0 e SDI timeout vazio; fallback operacional documentado, sem alegar cota. Revisão compacta de áudio retornou2334bytes/31,9s e recebeu crítica independente. Setup600 permanece selecionado e imutável. [Fontes, pinos e limites](evidencias/20261010-native35-device-inventory/ROOT-README.md).


## Direct Out — escolhas pendentes preservadas, teste real ainda pendente

Root integrou um arquivo frontend final após19checks VM/DOM/UTF8 e9independentes. Polling conserva dispositivo, volume, atraso e ligar/desligar; Aplicar/Descartar ficam bloqueados durante ACK e refresh. ACK tardio não limpa uma edição nova nem uma nova fonte. Fonte/coleção/queda observada descartam somente o draft local. Não há escrita automática ou retry. Repro anterior de botões habilitados durante ACK e versão com texto corrompido foram recusados/preservados antes da integração.

Reconexão invisível entre polls com mesmos IDs continua sem geração no contrato; falha GET/DOM não prova geração Native. O HTTP legado não comprova cancelamento nem tem deadline de operação nesta mudança. Nenhum Native/API/navegador/dispositivo iniciado por este ensaio. [Fonte, revisão e limites](evidencias/20261010-direct-out-draft-preservation/ROOT-README.md).

Revisão transitive adicional encontrou um bloqueador em Native35: audio_capabilities chama defaults de SourceRecord, que alcançam callbacks do encoder escolhido no perfil. Não será classificado como leitura pura genérica. Nova correção mínima está em revisão: observar a capability uma vez no startup e em atualização explícita, guardar resultado/known e ler cache no getter, preservando os busesISO do replay após startup. Native35 build/2085pins/reconstrução permanecem válidos; App35 não foi iniciado. Nova fonte/build e App próprio ainda precisam de qualificação. Setup600 continua selecionado e imutável.


## Native36 — capability SourceRecord cacheada após inicialização

Gemini implementou a correção mínima em uma fonte e fez revisão independente com respostas reais de3486/3123bytes. Root repetiu14modelos de statements extraídos e3do consumidor Replay, verificou19pinsautor+9revisão/8inputs e integrou. Capability SourceRecord inicia false/unknown; FINISHED_LOADING observa uma vez depois dos módulos, Atualizar dispositivos reobserva, getter serializa somente bool/known. Nenhum novo scanASIO/WASAPI no startup. Callback de defaults do encoder continua manutenção declarada na inicialização/refresh, não uma leitura pura genérica. Isso conserva o contrato dos busesISO após startup sem alterar Replay.

Native36 e81afe793708bd17821c9dc866b066783251e5fc ALL_BUILD/2085arquivos rehash/36patches/3submódulos/231snapshots/reconstrução--checkPASS. Fonte 0.1.0-local.20261010181335 somenteDEV. Nenhum Native36 iniciado. App34BLOCKED e blockerSourceRecord35 preservados; App36 deve observar bool/known pósREADY e repetir as cinco telas com zero incrementosrun/execute/journal/mutatingReq e snapshots iguais. Depois Preview/Cut/ACK/latência/persistência. Startup com encoder externo pode ter latência; não é homologação física nem cancelamento/watchdog. DirectOutfinalff4a integrado19+9modelos, com limites de reconexão invisível/HTTP herdado. Setup600 permanece selecionado e imutável. [Fonte, pinos e limites](evidencias/20261010-native36-source-record-cache/ROOT-README.md).


## App36 — teste real: capability passou; gate de menus falhou no autosave

Root abriu e reviu cinco telas próprias. SourceRecord known/premix true após READY, sem discovery; buses A/B do Replay disponíveis. GET HTTP manteve contadores; defaultsNative zero em HTTP/IAB. Áudio/destinos/configuração não mudaram. Durante a permanência nas telas, journal2→3 e mutatingReq19→20: FAIL preservado, run0/execute1 iguais. Journal próprio registrou autosave60,645s após native_state; fonte mostra timer60s→capture(false)→backup→save_preset. Navegação não foi comprovada como causa e identidade da chamada mascarada não foi observada diretamente.

Preview/Cut/dedupe/persistência não executados após a falha. Native72084 encerrado cooperativamente e CIM ausente, APIexit0/alloc0/Meter0/crash0, pins2085Native+453runtime intactos. Sem dados do operador ou nova instalação selecionada. Foco: autosave consciente de mudanças com proteção de recuperação preservada; nenhuma exclusão de contadores nem desligamento para passar. [Prova e limites](evidencias/20261010-app36-real-readonly-fail/ROOT-README.md).


A integração mecânica exata do módulo de autosave foi de ANTES a57f → DEPOIS a245, com 15 contratos CPU executados pelo autor Gemini e repetidos pelo Root. O revisor Gemini REVIU os contratos mas NÃO EXECUTOU. O save_preset continua ESCRITA/MUTANTE NUNCA readonly, com intervalo de 60s e gates zero intactos. O App36R3FAIL está preservado, o App36R4 em runtime real permanece PENDENTE e Setup/Native continuam congelados sem alteração. [Recibo de integração](ROOT-RECEIPT.json).
