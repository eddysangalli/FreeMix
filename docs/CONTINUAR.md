<!-- prazo-humano-20261012-1900 -->
## Prazo vigente — segunda-feira, 12/10/2026, às 19h de Brasília

Pedido direto do dono em 11/10: entregar o sistema pronto amanhã às 19h (22h UTC), substituindo o prazo anterior de 13/10. Coordenar Claude CLI e Antigravity continuamente enquanto disponíveis, acompanhar cada tarefa até uma entrega revisável e verificar cota quando houver parada. Com um provedor indisponível, seguir pelo outro; com ambos limitados, aguardar e verificar disponibilidade espaçadamente. Não inventar saldo nem tratar timeout ou resposta vazia como falta de créditos.

A automação existente passa a acompanhar a cada 20 minutos; tentativas de provedor com limite prolongado permanecem espaçadas. Preservar a mesa do operador. Entregar código, documentação e pacote local qualificado; registrar separadamente o que ainda não passou em testes ou depende de equipamento/rede/licença. O prazo não transforma recurso pendente em concluído. A meta antiga do aplicativo está em `usageLimited`; a ferramenta disponível não permite editar seu objetivo/prazo. Este bloco e a automação registram o novo prazo sem encerrar falsamente a meta antiga.

Pedidos do replay preservados: agulha com visualização durante a busca e IN/OUT preciso, listas sequenciadas com transições e curva de velocidade. Comparar codecs para qualidade, gravação, leitura e busca rápidas com testes próprios; distinguir compressão sem perda de qualidade visualmente próxima. Recursos novos e pacote completo atual continuam pendentes de integração/qualificação.

---
# Continuidade do FreeMix
<!-- rodada-20261011-1523-r3 -->
> **Leia primeiro este bloco.** Pendências e histórico cronológico: PENDENCIAS-REAIS.md e CHANGELOG.md (novo). O bloco de 10/10, 23h25, “telas primeiro”, abaixo, continua valendo.

## Git vs. pacote — 11/10, ~15h23
Base verificada: HEAD `c4f374268adae2e73a71189400cd1bd26997d59b`, limpo e idêntico ao branch remoto `feat/native-menus-config-screens` (https://github.com/eddysangalli/FreeMix) nesta checagem — commits futuros ficarão adiante deste HEAD. Código integrado publicado; propostas/bancadas offside permanecem locais. Instalador completo selecionado `0.1.0-local.20261010060000` / Native24 foi validado em instalação própria do Root, não é a versão em produção na mesa (que roda `0.1.0-local.20261009153453`). Atualização incremental `0.1.0-local.20261011145116` (Native38 `ed08547` + painel `71f8aa7`) está armada, aplica-se só na próxima abertura via `ABRIR-FREEMIX.cmd` com o programa fechado. Ainda não há pacote completo novo selado com as fontes finais do Native38.

## Prioridade agora: estabilidade de transmissão/rede (P0) e as telas vMix já aprovadas
Não duplicar o trabalho antigo de Configurações (já feito e documentado, ver abaixo). Três frentes:
1. **Claude/Root — janelas e QA real dentro do programa.** Sete janelas revisadas; roteiros relataram 122/122, mas a maior parte roda em Edge externo — só o caminho real (clicar a engrenagem, abrir, fechar dentro da janela nativa) foi provado separadamente. [App36 R4e](evidencias/20261011-app36-r4e-real-pass/ROOT-README.md) confirmou o gate de menus sem autosave indevido (Native36 + painel `e801`). Falta repetir isso sobre o Native38 atual, QA de longa duração e chamadas reais de áudio/rede.
2. **Telas aprovadas do vMix.** O dono aprovou a linha visual geral (cópias do vMix); a prévia de Calls com API MOCK não é prova de motor/microfone/WAN. Faltam os menus grandes antigos (Áudio, Fontes de dados, Composições, Macros, Recuperação, Diagnósticos, console do Replay, Avançado, SRT/RIST/SDI externos).
3. **Estabilidade de streaming/rede — P0 atual.** Saídas simultâneas, reconexão e latência sob carga são prioridade imediata do dono, separada do endurance específico do Replay. Hipóteses de stream/concorrência/reconexão aguardam confirmação em runtime; ainda não há pacote completo novo selado com as fontes finais do Native38 para essa qualificação. Especificação de QA de fontes/preferências do Calls pronta, com 3 testes de Configurações Gerais ainda pendentes.

## AGY/Claude
Última chamada ao AGY: HTTP 429 (RESOURCE_EXHAUSTED, resposta 0 bytes); nova tentativa também 429. Claude retomou e respondeu integralmente depois disso — não está bloqueado. Retomada do AGY depende de cota externa, sem horário garantido.

Regras de sempre: mesa/API, vMix, Calls, gravações, mídia e configurações do operador não são tocados; publicar é só commit/push no GitHub privado e pacote local; nada de CLI bruto, log ou segredo do operador no Git.

---
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

### 11/10, 11h — as seis janelas novas conferidas **com o programa de verdade** (Claude)
Durante a madrugada o Codex, com o Gemini, integrou Externo, Gravar, MultiCorder e Configurações do Replay, todas conferidas só com API simulada (`MOCK_API_REAL_DOM_ONLY`). Nesta rodada cada janela foi aberta contra uma cópia de teste real (motor Native38 `ed08547`) e clicada com mouse de verdade. O que apareceu e foi corrigido:
- **"Fechar" não fechava a janela dentro do programa.** Em todas as janelas novas o botão Cancelar / Fechar / Salvar e Fechar chamava `window.close()`, que na janela do programa não faz nada (só funcionava no navegador de teste, onde era simulado). Agora a página pede ao programa para fechar a própria janela: `painel/remoto/fechar-janela.js` → `POST /api/panel-close` → pedido `close_panel` do motor (que já existia e ninguém usava). Conferido clicando em Cancelar na janela real: fecha.
- **Gravar** dava erro de script a cada atualização de estado (faltava o elemento que o `controle.js` exige) e tinha outro visual (fundo branco, barra lateral). Reescrita no molde das outras (`vmix-dialogo.css`), como a *Recording Setup* do vMix: formatos em botões no topo (MKV / MP4 / MOV), Pasta, Codec + "Use Encoder da Placa de Vídeo(GPU)", Qualidade, "Modo Tolerante a falhas" (grava MP4/MOV híbrido ou fragmentado), OK / Cancelar. 700×300.
- **MultiGravação** tinha três botões de enfeite (AVI, vMix AVI, FFMPEG, sempre desabilitados), uma coluna "Dropped Frames" que nunca mostrava nada, "Start/Stop" em inglês e limite de 8 s para um início que o próprio motor pode levar 10 s para confirmar. Reescrita no mesmo molde: formatos reais (MPEG-2 TS / MKV / MP4), Áudio, Novo arquivo a cada, Pasta, lista de entradas com caixa de marcar, **Começar / Parar**, Avançado, Salvar e Fechar. Se o motor demora, a janela espera o estado dele e não repete comando.
- **Externo**: o que era digitado e não iniciado se perdia ao fechar a janela (ficava só na sessão da janela). "Salvar e Fechar" agora guarda neste computador.
- **Configurações do Replay**: oferecia de novo uma câmera da sessão anterior que já não existia na mesa (e o programa recusava); mensagens mostravam nome interno de comando ("camera-options"). Corrigido.
- **Todas**: botão colorido (verde/vermelho/âmbar) perdia a cor enquanto o ponteiro estava em cima — exatamente depois de clicar em "Começar".

Resultado, com gravação, envio NDI/OMT e câmera virtual reais na cópia de teste: streaming 19/19, Calls 29/29, Externo 17/17, Gravar 15/15, MultiGravação 12/12, Replay 12/12. [Prova, retratos e limites](evidencias/20261011-janelas-conferidas-no-programa/README.md). Roteiros em `scripts/qa/test-*.mjs` (usam `navegador-teste.mjs`); `sondar-janela.mjs` abre qualquer janela e lista erros, pedidos e controles sem clicar.

**Limite conhecido do motor (não é da janela):** MultiGravação em **MKV de uma entrada parada** (cor lisa, imagem fixa) é recusada com "não produziu vídeo no disco": o motor exige um pacote de vídeo no arquivo em 10 s e o MKV demora mais a descarregar quando quase não há dados. Em MPEG-2 TS grava normal. Fica em pendências.

**Caminho real da mesa conferido (11h30):** na cópia de ensaio já atualizada, com a janela principal visível, cada engrenagem da mesa de dentro do programa (Gravar, Transmitir, Externo, MultiGravação) foi clicada na janela real (`scripts/qa/clicar-janela.ps1`), a janela nova abriu e o botão dela mesma fechou. Depois o programa fechou em 2 s, sem relatório de erro, 0 vazamentos.

**Armadilha de teste registrada:** carregar uma **cópia da página da mesa num navegador de fora** e mandar essa cópia abrir janelas (`scripts/qa/test-mesa-janelas.mjs`) deixa o programa de teste num estado em que ele trava ~40 s ao fechar e grava relatório de erro no navegador interno (3 de 3 vezes, em duas instalações de teste). Só carregar a cópia, ou abrir/fechar janelas por pedido direto, ou o caminho real acima, fecham limpo (`scripts/qa/experimento-fechamento.mjs` roda cada cenário e lê como a sessão terminou). Não é caminho do operador; não usar esse roteiro como prova e não deixá-lo por último numa bateria. A causa no motor não foi investigada.

**Rede de segurança do dono:** `DESFAZER-ATUALIZACAO.cmd` (na raiz) desfaz a última atualização aplicada na mesa com o atualizador da própria instalação e repõe o ponteiro; ensaiado numa cópia (`scripts/qa/ensaiar-desfazer.mjs` → `UNDO_OK_ON_REHEARSAL_COPY`: versão, motor e ponteiro de volta).

**GitHub:** os scripts da raiz (`scripts/qa`, `scripts/agentes`, os de atualização da mesa, os lançadores) agora também vão para o repositório, por `scripts/build/subir-scripts-para-repo.mjs` (só copia o que é novo ou o que é editado na raiz; arquivo que o repositório tem mais novo é deixado como está; confere senha/chaves antes).

**Para o Codex (que segue na janela de Configurações gerais):** não mexi em `settings.html` / `settings.js` nem na pasta `D:/FreeMix-QA-Gemini-GeneralSettings-…`. Mudei `gravar.*`, `multicorder.*`, `externo.js`, `replay-settings.*`, `calls.*`, `transmitir.*`, `vmix-dialogo.css`, `mesa.html` (tamanho da janela de gravação) e `servidor-api.mjs` (rota `/api/panel-close`): os PINs antigos desses arquivos não valem mais. Janela nova que fecha: carregar `fechar-janela.js` e chamar `window.FreeMixClosePanel()`.

### Atualização da mesa — **autorizada pelo dono em 11/10** ("sim, pode mexer")
Fluxo: `scripts/qa/ensaiar-atualizacao.mjs` (ensaio numa cópia da versão da mesa) → `scripts/distribuicao/montar-atualizacao-mesa.mjs --target=obs-vmix` (pacote assinado) → `scripts/distribuicao/armar-atualizacao-mesa.mjs --package=…` (grava `entregas/ULTIMA-ATUALIZACAO.json`; recusa sem ensaio aprovado do mesmo motor e do mesmo commit). Armar não toca na instalação: o pacote é aplicado pelo iniciador na próxima vez que o dono abrir a mesa pelo `ABRIR-FREEMIX.cmd` com ela fechada, com cópia de segurança em `obs-vmix/updates`. Desfazer antes de aplicar: `armar-atualizacao-mesa.mjs --desarmar`.

**Estado em 11/10, 11h51: ARMADA, ainda não aplicada.** Pacote `entregas/FreeMix-Atualizacao-0.1.0-local.20261011145116` (394 arquivos, 175 MB): motor Native38 `ed08547` + painel/ferramentas do commit `71f8aa7` (já com a janela de Configurações), sobre a mesa `0.1.0-local.20261009153453`. Substituiu o pacote `…143637` armado às 11h37 (commit `220e831`, sem Configurações), que não chegou a ser aplicado; o ensaio foi repetido para o pacote novo (`ensaio-atualizacao-…145021.json` e `ensaio-abertura-…145021.json`). Antes de armar, numa cópia da versão da mesa: aplicar (`ensaio-atualizacao-0.1.0-local.20261011143510.json`), os seis roteiros de clique na cópia atualizada (104/104), o caminho real engrenagem→janela→fechar clicando dentro do programa, **abrir pelo mesmo iniciador que o `ABRIR-FREEMIX.cmd` usa** (`scripts/qa/ensaiar-abertura.mjs` → `REAL_START_PATH_OK_ON_REHEARSAL_COPY`: pronto, barramentos, NDI, janelas novas servidas, fechamento limpo) e desfazer (`ensaio-desfazer-…140049.json`). **Não provado:** a atualização sobre as configurações, cenas e dispositivos do próprio operador (os ensaios usam configuração nova de fábrica; a do operador não é copiada nem aberta em teste). Se a mesa não abrir bem depois de aplicar: `DESFAZER-ATUALIZACAO.cmd`. Quando o dono abrir, o recibo sai em `entregas/APLICACAO-ULTIMA.json`.

### Feito (11/10, 00h15): janela "Chamada de Vídeo" (Calls)
- Cópia da aba *Video Call* do vMix somada ao *Call Manager*, numa janela só (700×540): botões **1 a 8** (um por chamada; o próximo livre aparece como **+**), **Nome** + **Hospedar chamada**, **Senha** + **Copiar Link** + **Redefinir Senha**, **Sinal de retorno(Para Convidado)** com **Fonte de vídeo** e **Fonte de áudio** + **Aplicar**, **Convidados ouvem uns aos outros**, **Mostrar opções avançadas** (nível do retorno, Reconectar, microfone do diretor, para quem vai o talkback, rede TURN, diagnóstico), a lista **Gerenciador de chamadas**, e embaixo **Preparar retornos / Segure para falar / Gerenciador de chamadas / Salvar e Fechar**.
- Três coisas novas no programa (`ferramentas/calls-producao.mjs`), todas comandos reais: **`call_create`** (Hospedar chamada cria a entrada na mesa, igual ao Adicionar Entrada › FreeMix Call, e já reserva o endereço do retorno: o link do convidado nasce definitivo), **`call_reset_password`** (troca a senha e o endereço do retorno; o link antigo deixa de valer) e **`call_link`** (reserva o endereço de uma chamada antiga antes de copiar o link). O estado de cada convidado agora traz `route` (o que está salvo para ele ver e ouvir), mesmo com os retornos parados.
- De propósito ficou fora, porque o programa não tem: *Conectar-se a Chamada*, *Largura de vídeo* por chamada e *Somente conexão direta ponto a ponto*. Nada disso aparece como botão de enfeite. O vídeo contínuo experimental continua sem botão (sincronismo reprovado).
- Conferido de verdade: `scripts/qa/test-calls.mjs` — 29 de 29 com mouse real numa cópia de teste. **Dois limites declarados:** "Preparar retornos" foi conferido só como comando enviado (executar publicaria um retorno por serviço de internet) e a área de transferência é capturada dentro da página (o teste não mexe na do computador). [Prova e retratos](evidencias/20261011-janela-calls/README.md).
- Na janela de streaming: lista aberta não fecha mais sozinha a cada 2 s (as listas só são reescritas quando o conteúdo muda).

### Ensaio de atualização da mesa (11/10, 00h03) — passou, **não armado**
A mesa do operador (`obs-vmix`) continua na versão `0.1.0-local.20261009153453`: por isso nada do que foi feito desde 09/10 aparece para ele. `scripts/distribuicao/montar-atualizacao-mesa.mjs` monta um pacote assinado só com o que difere (mesa: 382 arquivos, 174 MB) e `scripts/qa/ensaiar-atualizacao.mjs` instala a versão da mesa numa pasta de teste, aplica o pacote com o atualizador da própria instalação e confere (versão, motor, janela nova, cópia de segurança): `UPDATE_APPLIED_ON_REHEARSAL_COPY`, e a janela de streaming passou 19/19 na cópia atualizada. **Armar a atualização para a mesa de verdade (`entregas/ULTIMA-ATUALIZACAO.json`) é decisão do dono e ainda não foi pedida/feita.**

### Feito (11/10, 11h45): janela "Configurações" (engrenagem geral)
- No molde da *Settings* do vMix (760×540): **categorias à esquerda**, campos à direita, **Importar / Exportar / Padrão** e **OK / Cancelar** embaixo. Arquivos novos `painel/remoto/configuracoes.html` + `configuracoes.js`, rota `/configuracoes`; na Mesa, `settings` e `config` abrem essa janela.
- Nada escrito à mão: cada campo vem do que o programa informa em `GET /api/settings` — o formato do quadro (Exibir) e as **98 preferências reais do motor** em 10 grupos (Aparência, Tela cheia e MultiView, Opções, Desempenho, Cor e sistema, Arquivos de gravação, Saída avançada, Rede da transmissão, Audio, Trilhas de áudio). OK envia cada categoria alterada com `settings_apply`; Padrão/Exportar/Importar usam `settings_defaults/export/import`. As preferências do motor valem a partir da próxima abertura do programa (a janela avisa); o formato do quadro trava enquanto grava/transmite.
- Categorias que já têm janela própria (**Saídas / NDI / SRT, Gravando, Streaming, Saídas de Áudio, Controlador Web, Atalhos**) abrem essa janela em vez de repetir a tela: rota nova `POST /api/panel-open {route}` (lista fechada de janelas conhecidas; usa o `open_panel` do motor).
- O editor antigo continua em `/settings` (é para onde vão os botões "Avançado" de Gravação e Streaming). **Para o Codex:** o rascunho `DRAFT-settings-r2.*` não foi usado nem tocado; ele substituiria `settings.html/js` e quebraria esses "Avançado" (não tem as categorias `recording`/`streaming`). Se for integrar algo dele, faça sobre `configuracoes.*`.
- Na cópia de ensaio já atualizada, clicando dentro do programa (11h53): **Configurar** (menu de cima) abre esta janela em 760×540, trocar de categoria funciona, **Cancelar** fecha; **Calls** (menu de cima) abre a Chamada de Vídeo e o botão dela fecha; o programa fechou em 2 s, sem relatório de erro, 0 vazamentos. Retratos da janela real em `evidencias/20261011-janela-configuracoes/`.
- Conferido com o programa real: `scripts/qa/test-configuracoes.mjs` 18/18 (salvar Opções e ler de volta, Padrão sem gravar, Exportar, Cancelar, mudar o quadro para 1080p, trava gravando, "Gravando ›" abrindo a janela de gravação dentro do programa). Bateria das sete janelas: 122/122. [Prova](evidencias/20261011-janela-configuracoes/RESULTADO-cliques.txt). Não conferido: Importar com arquivo real, o download do Exportar dentro da janela do programa, e "Todas as preferências do programa" (abre o diálogo nativo do motor).

### Telas: o que já foi e o que falta
Feitas e conferidas com o programa real: Streaming, Chamada de Vídeo, Saídas externas, Gravação, MultiGravação, Configurações do Replay, **Configurações**.
Faltam:
1. Janelas que ainda abrem no editor antigo e grande: Áudio (`/audio`), Fontes de dados, Composições, Macros, Recuperação, Diagnósticos, o console do Replay (`/replay`), e os editores "Avançado" (`/saidas`, `/settings`, `/iso`).
2. No Externo: SDI/DeckLink e SRT/RIST continuam só no editor avançado.

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


## Continuação — Diálogo Gravar (Status Pós-Cleanup R3)

* **Cleanup R3 Concluído (Exit 0):** `cleanup-gravar-r3-own-edge.mjs` executou com sucesso, encerrando cooperativamente o Edge órfão (PID 40932). O recibo `cleanup-r3-own-edge-receipt.json` (SHA `af34930d8038fb70e590836694574784f21bfa625aeb4467c95c6e714c7dcd23`) comprova: `ownPidAbsent=true`, `exitAbsentCIM=true`, `ownedProfileEdgeCount=0` e `errors=[]`. Root CIM confirmou PIDs 40932 e 136676 ausentes e zero processos `msedge.exe` nos perfis de teste. Perfis preservados; nenhum force-kill, deleção ou impacto no operador. PINs confirmados idênticos (HTML `d01392b...`, JS `5544e6d...`, runner R3 `88eb27b...`).
* **Diagnóstico de Execução:** Os runners reais R2 e R3 falharam no bootstrap de descoberta do CDP antes de alcançar menus ou gates, sem gerar recibos de teste. O `finally` projetado em R3 não preveniu o processo órfão em runtime. Logs de STDERR/STDOUT, recibo de falha de R2b (self-matching) e auditoria Root CIM permanecem preservados como evidência.
* **Status do Código Gravar:** Fonte R3 (HTML `d013...` / JS `5544...`) permanece em `SOURCE_ACCEPTED_QA_PENDING` exclusivamente em `D:/FreeMix-QA-Gemini-Recording-20261011-0730`. **Não integrado e não instalado na Mesa.** O runner R3 (SHA `88eb...`) está reprovado e não deve ser reexecutado. Nenhuma sessão ativa no momento.
* **Próxima Sessão Gemini:**
  1. Comparar detalhadamente o bootstrap de CDP com o runner Externo R1 homologado (SHA `2ddf3be...` em `D:/FreeMix-QA-Gemini-Externo-Review-20261011-0630`), adotando estritamente seu padrão funcional comprovado.
  2. Diagnosticar a divergência de inicialização antes de instanciar novo Edge, preservando integralmente os 17 gates originais de R3, timeout de 8000ms e rotina de cleanup.
* **Invariantes:** Externo integrado no commit `0c3f59c` (árvore limpa, 26/26 PASS em mock DOM). Instalação do operador (versão base `0.1.0-local.20261009153453` com Setup selecionado `0.1.0-local.20261010060000` Native24) permanece imutável; updater NÃO armado. Ordem confirmada: Gravar → MultiCorder → ReplaySettings.

# Próximos Passos: Roadmap de Janelas Modais

## Estado Atual
- **Gravar**: Concluído no código-fonte canônico (rota `/gravar`, Mesa `recset:[700,540]`, HTML SHA `5220ea2a...`, JS SHA `5544e6df...`).
- **Evidências**: Arquivadas em [`evidencias/20261011-janela-gravar-gemini/README.md`](evidencias/20261011-janela-gravar-gemini/README.md).
- **Ambiente QA**: Todos os processos Edge e CLIs de teste finalizados cooperativamente.
- **Instalação do Operador**: Operador `0.1.0-local.20261009153453` e Setup Native24 `0.1.0-local.20261010060000` permanecem intocados. Updater não armado; Mesa não atualizada; não repetir Gravar29/Calls25/Externo26 sem que fonte ou motor tenham mudado. Antigravity ONLY autoria/análise/review; Root mecânico.

## Próxima Tarefa: MultiCorder
- **Sequência**: Avançar para a modelagem da janela **MultiCorder**.
- **Diretrizes**:
  - Consultar a documentação canônica na raiz (`docs/`) e os arquivos mais recentes em `FreeMix/docs/` antes de iniciar a modelagem.
  - Reutilizar contratos existentes do backend sem inventar rotas ou APIs não documentadas.
  - Manter política de isolamento: implementação offside em draft com validação prévia independente em Real DOM antes de qualquer integração na Mesa.

### CONTINUAR: MultiCorder R7 Integrado nos Fontes Canônicos

- **Status:** Integração do MultiCorder R7 concluída com sucesso sobre `HEAD 4282be6ce582d3625425389b2a384e0516dcbe45` após aprovação do runner empírico R7 (26/26 PASS, recibo `6dce860c6ab8dd28d163eb8512eff5bceb57ab912c6f74de3f2ee3e965fda3c5`, encerramento cooperativo CIM `edgeProfileCount: 0` e PINs inalterados).
- **Fontes Canônicos Atualizados:**
  - `painel/remoto/multicorder.html` e `painel/remoto/multicorder.js`: Diálogo de MultiGravação moderno com 4 deadlines de 8s protegidos, isolamento de `stateEpoch`, discriminação entre falha de rede e HTTP 400 e preservação de seleções do operador.
  - `painel/mesa.html`: Engrenagem da MultiGravação vinculada a `/multicorder` no viewport padrão 700×540 px.
  - `ferramentas/servidor-api.mjs`: Rota `/multicorder` adicionada, preservando a rota legada `/iso` para acesso às opções avançadas.
- **Histórico e Diagnóstico:** Artefatos e evidências de falha das etapas R1 e R5 mantidos imutáveis no repositório.
- **Fronteiras e Escopo:** Validação estrita em `MOCK_API_REAL_DOM_ONLY`. Não inclui alteração em binários de distribuição, Setup 600 ou drivers de hardware CEF.
- **Próximo Alvo de Engenharia:** Diálogo de Configurações de Replay (`ReplaySettings` em `/replay?view=settings#replay-config`).

### Continuidade da Integração Canônica e Próximos Passos (CONTINUAR)

> [!NOTE]
> **Status da Integração de Fontes:**
> A integração dos fontes de `ReplaySettings` foi **CONCLUÍDA COM SUCESSO** no repositório base (`HEAD ae245369305728d9b1fb01b83eae33f51e072f30`), conforme atestado em `ROOT-INTEGRATION-R3-RECEIPT.json` (`status: INTEGRATED_SOURCE_SYNTAX_DIFF_PASS`):
> - 2 arquivos copiados: `painel/remoto/replay-settings.html` (SHA: `99d640...`) e `painel/remoto/replay-settings.js` (SHA: `05cb27...`).
> - 2 âncoras aplicadas (diff exato de 1 linha): `painel/mesa.html` e `ferramentas/servidor-api.mjs`.

> [!WARNING]
> **Ambiente Operacional e Pacote Final Pendentes:**
> - A instalação no ambiente em execução do operador ainda não foi realizada (`operatorUpdated: false`).
> - A homologação final depende da validação no binário compilado com CEF 38 (Native 38).

> [!IMPORTANT]
> **Próxima Frente de Trabalho:**
> Com a fonte de `ReplaySettings` integrada e congelada, o escopo avança para o painel de **Configurações Gerais (`Settings` global)**.
