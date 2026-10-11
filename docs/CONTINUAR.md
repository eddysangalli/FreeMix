# Continuidade do FreeMix
<!-- rodada-20261010-noite -->
> **Leia primeiro este bloco.** É o resumo vigente, em linguagem direta. O registro detalhado do Codex (até 10/10, 19h) continua logo abaixo, sem alteração.

## Mudança de rumo pedida pelo dono — 10/10, 23h25: telas primeiro

O dono reclamou, com razão, que o trabalho recente era quase só teste e que **as telas continuavam iguais: deviam ser cópias das do vMix e fáceis de mexer**. A partir daqui a ordem é: **refazer as telas uma a uma olhando a tela real do vMix** (ajuda em `https://www.vmix.com/help29/`, imagens das janelas; textos em português do arquivo de idioma do dono, `archived/referencias/vMix27-copia/languages/pt br eddy 29-0-0-40.txt`), e usar teste só para conferir cada tela no fim. Não restilizar de cabeça.

### Feito: janela "Configurações de streaming" (engrenagem do Transmitir)
- Cópia da janela *Streaming Settings* do vMix, no tamanho dela (700×445): botões **1 a 5**, **Destino**, **URL**, **Chave de Stream**, **Avançado**, **Qualidade** com engrenagem, codificador com "Use Encoder da Placa de Vídeo (GPU)", **Use Qualidade do Stream 1** (destinos 2 a 5), e embaixo **Iniciar tudo / Começar N / Ver Status / Salvar e Fechar**. O 1 é a transmissão principal; 2 a 5 são os quatro destinos adicionais. Destino no ar fica travado e o botão vira "Parar N" em vermelho, como no vMix.
- Arquivos: `painel/remoto/transmitir.html`, `transmitir.js` e `vmix-dialogo.css` (visual de diálogo do vMix, para reaproveitar nas próximas janelas); rota `/transmitir` no `servidor-api.mjs`; na Mesa, a engrenagem do Transmitir abre essa janela. O editor antigo (`/saidas?context=streaming`) continua acessível pelo botão **Avançado**.
- No motor (Native38, `ed08547`): as janelas do programa agora podem abrir no tamanho que a página pede (antes toda janela abria 1200×850). Native37 (`d5cc34d`): lista de dispositivos de áudio não é mais descartada por causa de uma entrada defeituosa.
- Conferido de verdade: `scripts/qa/test-transmitir.mjs` — 19 de 19: configurar e pôr no ar os destinos 2 e 1 em servidores RTMP locais de teste, parar, Iniciar tudo / Parar tudo, Ver Status, destino que não responde (aviso claro), liberar um destino, Salvar e Fechar. A janela também foi aberta dentro do programa (cópia de teste) e fotografada.
- **Ainda não está no instalador nem na mesa do operador.** Diferenças para o vMix, de propósito: sem a linha "Perfil" (o motor só tem salvar/carregar perfis dos destinos 2–5; entra quando houver excluir); "Aplicação: FFMPEG" virou "Codificador" com a lista real.

### Próximas telas, na ordem (cada uma com a janela do vMix aberta ao lado)
1. **Externo** (engrenagem do Externo): menu *Output 2/3/4 ▸ fonte*, *SRT*, *Output / NDI / SRT Settings*, *External Output Settings* e a janela com abas External 1–4 (ajuda: `ExternalOutput1.html`, `ExternalOutput.html`, `SettingsOutputs.html`).
2. **Calls**: aba *Video Call* do Add Input — Host a Call / Connect to Call, Password + Copy + Reset, Return Feed (Video Source, Video Bandwidth, Audio Source) (`VideoCallSetup.html`, `CallManagerChat.html`).
3. **Gravação** (engrenagem do Gravar) e **MultiCorder**.
4. **Replay** (configurações) e **Settings** geral (categorias à esquerda como no vMix).

### Bancada para trabalhar nas telas
`scripts/qa/sandbox-telas.mjs` (rodar com o `runtime/node.exe` do pacote selecionado) instala uma cópia de teste própria, abre o programa minimizado e a API, e serve o painel direto de `FreeMix/painel`: edita o arquivo, recarrega a página. Fecha pedindo (`--fechar`), sem matar nada. `scripts/qa/abrir-janela-real.mjs` abre a página numa janela do próprio programa; `scripts/qa/capturar-janela.ps1` fotografa essa janela.

## Onde estamos — 10/10/2026, 23h30 (Claude assumiu de onde o Codex parou)

**Instalador selecionado:** continua o `0.1.0-local.20261010060000` (motor Native24). **Fonte atual:** motor Native36 (`e81afe7`) + painel deste repositório. Tudo o que foi corrigido desde a madrugada do dia 10 (menus que não disparam comandos, inventários de áudio e SDI, cursor de mídia, salvamento automático só quando há mudança) está na fonte e **ainda não está em instalador**.

### Fechado nesta rodada
- **"Abrir os menus não pode executar comando" passou em execução real** (App36 R4e): cinco telas abertas por 60 s, contadores idênticos aos de antes (run 0, execute 1, journal 2, escritas 19). Preview em 90 ms e Cut em 165 ms confirmados pelo motor; salvamento automático só depois de mudança; salvamento manual OK; fechamento limpo (0 vazamentos, 0 crash). [Prova e limites](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md).
- As rodadas R4, R4b e R4c do dia 10 falhavam por **três defeitos do próprio roteiro de teste**, não do programa: exigência de contadores zerados em valor absoluto (contraditória com a partida do áudio), processo da API de teste que não conseguia terminar (faltava `process.disconnect()`) e pedido de salvamento manual com nome de ação errado (`checkpoint` em vez de `recovery_checkpoint`). Os recibos de falha foram mantidos; nenhum critério foi afrouxado.
- A parte que era feita à mão (abrir as cinco telas e tirar os retratos) agora é um script com navegador real. Um ensaio completo leva cerca de 8 minutos e fecha tudo sozinho.

### Em andamento
1. **Revisão de código das 12 mudanças do motor que ainda não foram para instalador** (patches 0025 a 0036), pedida ao Gemini e conferida item por item contra a fonte antes de aceitar. Primeira conferência: o alerta sobre o talkback ficar aberto é **falso** (existe o temporizador de 100 ms que fecha quando o prazo vence); os alertas de que **uma única entrada defeituosa no registro do ASIO ou um único dispositivo de reprodução sem nome fazem o programa descartar todos os dispositivos válidos** são **verdadeiros** e serão corrigidos.
2. Depois das correções: compilar (Native37), congelar, repetir o ensaio de App e **selar o instalador novo**.

### Continua pendente (sem mudança nesta rodada)
- **Calls com vídeo contínuo:** sincronismo reprovado (o vídeo recebido atrasa 9,78 ms a cada segundo; o áudio chega no tempo certo). É recurso experimental e fica desligado. O retorno atual das Calls continua o de imagens até 5 por segundo.
- **Redução de ruído (RNNoise):** reduziu 1,04 dB no ruído de teste; o exigido é 3 dB.
- **Legendas (LocalVocal):** falta provar fechamento com o filtro ainda trabalhando.
- **FTB em 29,97:** o cursor passou; falta o ensaio completo no Master.
- Dependem de equipamento, licença ou rede de fora: SDI/HDR/ASIO/PTZ físicos, NDI HDR (SDK Advanced), WAN/bonding com duas redes, Windows limpo, certificado de assinatura.

### Como repetir o ensaio de App (para quem assumir)
1. Derivar a rodada nova a partir da última (`qa-finalizacao/native36-real-app-r4e-offside-20261011/derive-r4e.mjs` é o modelo: copia os arquivos de teste, troca os nomes, registra o que mudou).
2. Rodar o preparador gerado (`prepare-app36r4.mjs --commit=<HEAD do FreeMix> --integration-receipt-sha=<...>`) e a conferência (`preflight-app36r4.mjs`) com o `runtime/node.exe` do pacote selecionado. O preparador exige o repositório `FreeMix` limpo e no commit informado.
3. Em dois terminais: `root-browser.mjs` (espera o programa de teste, abre as telas, salva os retratos e aguarda `ROOT-REVIEWED.json`) e `launch-root-only.mjs --root-launch-authorized=...` (instala a cópia de teste, abre, roda, fecha). Olhar os cinco retratos e só então gravar `ROOT-REVIEWED.json` com `{"approved": true}`.
4. O resultado sai em `receipt.json` na pasta de preparação. Recibo de falha não se apaga: a tentativa seguinte ganha pasta nova.

### Ajudante Gemini (Antigravity CLI)
`scripts/agentes/agy-pedir.mjs` envia um pedido ao `agy.exe` (modelo `gemini-3.8-flash-high`) e guarda pedido, resposta e recibo em `qa-finalizacao/agy-<data>-<nome>`. Material maior vai em arquivos numa pasta `qa-finalizacao/agy-trabalho-<nome>`. **Só fonte do produto ou do teste** entra nessas pastas: nada da instalação do operador, de logs, de mídia ou de senhas. Resposta do ajudante é material para conferir, não decisão: na primeira leva, um dos cinco achados "certos" era falso.

### Regras que continuam valendo
Mesa, API, vMix, Calls, gravações, mídia e configurações do operador não são tocados. Ensaios rodam em pasta e portas próprias (`FreeMix-QA-…`), fecham o programa pedindo, nunca matando. Falha fica registrada como falha. Publicar: só commit e push no GitHub privado e pacote local.

---

## Registro anterior (Codex, até 10/10 19h)
Entrega selecionada: **0.1.0-local.20261010060000, Native24/a047860**, imutável. Fonte atual Native36/e81afe7 compilada viaALL_BUILD e congelada:2085arquivos,36patches/3submódulos/231snapshots reconstruídos. Cursor retido integrado; reinício NTSC real33 PASS no cursor, fullFTB ainda pendente. Ainda não há novo instalador aprovado. Native30/93d73e2 e candidato093000/FAIL permanecem históricos.

Leia [situação](ATUALIZACAO-20261010.md), [pendências](PENDENCIAS-REAIS.md), [entrega selecionada](ENTREGA-ATUAL.md) e [plano](PLANO-CONCLUSAO-20261013.md).

## Situação conferida em10/10,13:35UTC

Medidores Native30 passaram39/39eventos reais com dois clientes, troca de coleção/UUIDs e fechamento:0avisos/alocações/crash. FTB30fps passou9checks reais;29,97fps falhou no cursor após RESTART2702→33→0. Calls recebeu áudio remoto no ensaio sintético, mas sincronismo continua FAIL:drift9,78ms/s; helper fica somente QA.

AppR2 e ReplayR2 falharam na preparação e continuam preservados. QA176324 foi fechado pelo usuário e conferido:0avisos/alocações/crash e pins600 intactos. ReplayR3 corrigido executou de fato18capturas A/B (diferença0) e14segmentos Master exclusivos/silêncio; NTSC/VFR/velocidades/seek e avanço permitido PASS, fechamento automático exit0. Todos os Native QA anteriores foram encerrados e conferidos. Novos ensaios usam prefixo FreeMix-QA-, ownership/PID/marker, qaClose e fechamento cooperativo automático, sem depender do usuário; nenhuma proteção foi contornada.

## Novas frentes autorizadas

- Assistente de projetos: provisionamentoR3 e hostR4 congelados com modelos PASS. Quatro helpers Native e duas consultas readonly compilados no32; scan exige consentimento. Agente prepara wiring centralR5 com gate global, mesmas conexões e auth; criação permaneceOFF até QA próprio. ExportarJSON não é projeto pronto.
- Qualidade: onze arquivos R5+abasR6 integrados; Root repetiu9casos de conexão,28adaptador e8abas PASS. Um formulário visível por vez. Tiny e8defaults Native30 reais pinados; pixels/PCM/ASR ainda requerem QA32. SDKNVIDIA e traduçãoEnglish/cloud continuam desabilitados. FalhaR4 de conexão antiga preservada e corrigida, sem despacho na nova conexão.
- Botões da mesa: reproduzida uma corrida entre leituras antigas/novas e Preview por nome apesar de UUID. DraftR2 passou21modelos; revisão Root encontrou ausência de identidade da conexão e aceitação de GET desconhecido. MesaR4 integrada exatamente à fonte;54checks Root PASS, sintaxe inline PASS,12pins congelados e7referências externas intactas. Conexão/coleção/UUID/capacidades conferidos; GET desconhecido preserva snapshot completo, ISO ausente precisa lista vazia confirmada. Isso não comprova a causa de todos os congelamentos relatados.
- Atualizações: verificador cliente integrado e3checks PASS. Guardas de oito caminhos Native de updates e sete alvos de plugins/SDK integrados e compilados; policyexpectedINFO, erro de loaderWARNING. DistroAV stock ainda sem fork qualificado; LocalVocal catálogo/modelos em revisão separada. Canal onlineEd25519 existe, destinoHTTPS não configurado.

Preservar a mesa/API51911, vMix, Calls, REC, mídia e configurações do operador. Máximo Root+3 agentes, testes em raízes/portas próprias, fechamento cooperativo; nenhum force. Todos os Native QA anteriores foram encerrados e conferidos. Novos ensaios usam prefixo FreeMix-QA-, ownership/PID/marker, qaClose e fechamento cooperativo automático, sem depender do usuário; nenhuma proteção foi contornada. Não reviver alpha web abortado; ponte nativa beta separada. Commit/push GitHub e pacote local autorizados; nenhum upload/publicação de serviços ou dados externos. O prazo não transforma recurso sem prova em concluído.

[Medidores e fechamento](evidencias/20261010-meter30-real-pass/ROOT-README.md) · [FTB30/NTSC](evidencias/20261010-ftb-native30-gate6/ROOT-README.md) · [Calls AV](evidencias/20261010-calls-av-muted-consumer/ROOT-README.md) · [Replay/cadência](evidencias/20261010-replay-full-cadence-r2/ROOT-README.md) · [Saídas](evidencias/20261010-outputs-read-ack/ROOT-README.md) · [Governança cliente e capacidades](evidencias/20261010-quality-project-update-checkpoint/ROOT-README.md) · [MesaR4](evidencias/20261010-mesa-r4-root/ROOT-README.md).

Histórico exato anterior preservado em historico/20261010-1255-before-current-status/.


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
