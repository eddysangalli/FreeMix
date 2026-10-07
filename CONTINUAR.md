# FreeMix: estado do projeto e como continuar

Este arquivo é para quem assumir o trabalho (pessoa ou outra IA). Ele diz o que existe, o que foi verificado, o que falta e em que ordem. Mantenha-o atualizado a cada etapa concluída.

Última atualização: 07/10/2026, 18h00, pelo Claude (as duas IAs escreveram neste arquivo durante a tarde; cada trecho diz de quem é). Começa pela conferência da rodada do Antigravity (11h55 às 12h55). O registro que ele escreveu aqui foi substituído por esta seção, que só afirma o que foi rodado e visto.

## Onde parou (07/10, 16h40) e o que fazer em seguida

### Feito depois da conferência (07/10, 16h45 às 17h20), a pedido do dono ("faça todos os passos que faltam")

Tudo abaixo foi rodado e testado; os números são dos testes de `obs-vmix\ferramentas`.

- **O programa inteiro agora sai do nosso código.** `compilar-2026.ps1` (na raiz) configura e compila `freemix-app` com o Visual Studio 2026 na pasta `build_2026` (4 minutos, zero erros), incluindo os três módulos que dependiam do ATL (`frontend-tools`, `obs-qsv11`, `win-dshow` com as câmeras virtuais de 32 e 64 bits). `obs-vmix\ferramentas\instalar-compilado.ps1` copia programa, bibliotecas, módulos e dados para a cópia portátil (não toca em plugins de terceiros, configurações, painel nem arquivos de idioma). `test-compilado.mjs`: 7 de 7, incluindo captura de câmera de ponta a ponta (programa → câmera virtual → entrada de câmera, 1920×1080). A pasta `build_x64` (Visual Studio 2022) continua valendo para recompilar só a interface.
- **Downstream Keyer incorporado** em `freemix-app\plugins\downstream-keyer` (código oficial 0.4.4, GPL-2.0, guardado em `downloads\obs-downstream-keyer-0.4.4-source.zip`). Duas mudanças nossas: `hideAfter` inicia em zero (era o defeito dos overlays e barramentos) e o pedido novo `dsk_set_hide_after {dsk_name, hide_after}` em milissegundos, que serve para a "Duração" do overlay. Testado: keyer criado na hora nasce com zero. O saneamento do `preparar.ps1` ficou como proteção para presets antigos.
- **Retorno do FreeMix Call de verdade** (`patch-retorno.mjs`, `test-retorno.mjs` 9 de 9): um botão "Ligar retorno" na janela da chamada. Ele liga a câmera virtual, põe o barramento B para tocar no cabo de áudio virtual que já existir na máquina (filtro Audio Monitor `FreeMix Retorno (áudio)` na fonte `FreeMix Bus B`), monta o mix-minus (todas as entradas no B, menos as chamadas) e cria a fonte `FreeMix Retorno`, uma página dentro do programa que publica vídeo e áudio em `ID_ret`. Conferido de fora, num navegador: vídeo do programa tocando e trilha de áudio ao vivo. Depende de o programa abrir com `--enable-media-stream` (já está nos dois atalhos). **Sem cabo de áudio virtual instalado, o retorno vai só com vídeo** e a janela avisa. Só reconhece o VB-Cable (`CABLE Input` / `CABLE Output`), que o usuário instala por conta própria; não distribuímos.
- **Cabo de áudio de licença aberta:** não há um que dê para embutir. O `VirtualDrivers/Virtual-Audio-Driver` (MIT), sugerido pela outra IA, é beta, exige o Windows em modo de teste de assinatura, não tem versão publicada e a página não diz que o alto-falante virtual volta no microfone virtual. A "captura de áudio por processo" do Windows não cria dispositivo de entrada, então não serve para a página de envio.
- **Barra de mídia:** tempo da playlist (`lista 2/2 · total 03:09 · falta 00:17`); a duração de cada arquivo é lida pelo próprio painel. `test-midia.mjs`: 12 de 12.
- **Trava de fechar em português:** botões "Sim" / "Não" (`OBSMessageBox`), textos nas chaves `FreeMix.Close.*` dos arquivos de idioma. Texto novo no C++ entra pelos dois lugares com `ferramentas\textos-freemix.mjs`.
- **Título do Output** volta a aparecer logo depois de trocar de preset; **cruz do Safe Area** com braços iguais.
- As três mudanças de CMake da outra IA foram guardadas em `antigravity-cmake-win-dshow.patch` (raiz) e desfeitas; com o Visual Studio 2026 não são necessárias.
- Bateria completa no programa compilado: áudio 28/28, camadas 10/10, mídia 12/12, correções 7/7, barra de baixo 7/7, barra de cima 7/7, retorno 9/9, compilado 7/7.

**Mudanças em `freemix-app` ainda sem commit** (`git status` lista): Downstream Keyer, textos, trava, título do Output, cruz. O dono não pediu commit a esta IA.

- **Multistream nativo (17h30).** `freemix-app\frontend\widgets\FreeMixMultistream.cpp`: até quatro destinos além do principal, cada um uma saída própria que reaproveita os codificadores de vídeo e áudio da transmissão principal (codifica uma vez, manda para todos). Entram no ar junto com o destino 1 e param com ele; ligar ou desligar um destino com a transmissão no ar vale na hora. A lista fica por perfil em `freemix-destinos.json` (contém chaves: tratar como segredo). O painel fala com isso pelo servidor de controle, fornecedor `freemix`: pedidos `get_destinations` e `set_destinations`, evento `destinations_changed`. Na janela de transmissão as abas 2 a 5 viraram de verdade (nome, URL, chave, usar, estado). RTMP, RTMPS, SRT e RIST. **Testado sem sair da máquina** com `test-multistream.mjs` (12 de 12): três receptores RTMP locais (`rtmp-teste.mjs`, escrito para isso) no lugar dos serviços; vídeo e áudio chegaram aos três, desligar e religar um destino no ar, destino que não responde aparece com erro sem derrubar os outros. O teste troca o destino principal por um endereço local e devolve no fim. Limites: os destinos extras têm a mesma qualidade do principal (não há codificador separado por destino) e só funcionam com o principal no ar; SRT e RIST não foram testados (só RTMP).

- **Galeria Visual de Títulos e Conversor de GT Title (.gtzip) vMix (17h45).**
  - **Conversor autônomo (`ferramentas/gtzip_converter.mjs` e `gt_utils.mjs`):** código puro em Node.js (zero dependências npm). Descompacta qualquer pacote `.gtzip` do vMix GT Title Designer, interpreta `document.xml` (Compositions, Layers, Rectangles, TextBlocks, Tickers, Images, Storyboards), converte cores ARGB para CSS `rgba()`, gera CSS com keyframes `@keyframes` para animações In/Out (`Fly`, `Fade`), converte relógios em tempo real (`{0:HH:mm}`), extrai imagens e miniaturas (`thumbnail.png`).
  - **Protocolo broadcast nativo FreeMix (`window.GC`):** o template HTML gerado implementa `window.GC = { play(data), stop(), update(data) }` e se conecta ao `gc.js`, permitindo disparar transições In/Out e atualizar campos dinâmicos diretamente pelos Overlays 1 a 8 e pela janela de edição de títulos (`gcedit`).
  - **Importador em lote (`ferramentas/importar-gt-packs.mjs`):** comando CLI para converter pacotes avulsos ou pastas inteiras (`--dir <pasta>` ou `--sample`), gravando em `painel/gc/gt_titles/` e reconstruindo o catálogo automaticamente.
  - **Catálogo recursivo (`ferramentas/gerar-catalogo-gc.mjs`):** varre subpastas recursivamente e gera `catalogo.js`. Catálogo expandido de 4 para 11 modelos ativos (Placar esportivo VBA com relógio, Ticker contínuo de notícias, lower thirds e spinners).
  - **Galeria visual no painel (`painel/mesa.html`):** no modal `Input Select › Title`, o dropdown simples foi substituído por uma galeria visual estilo vMix com abas de coleções (`Todas`, `GT Titles vMix`, `Jornalismo`, `Esportes`, `Marca`), grade de cards com miniaturas, seleção em 1 clique e botão "📥 Importar .gtzip".
  - **Testado e conferido:** conversão de 7 modelos reais do vMix 27 concluída sem erros; catálogo carregando 11 modelos com sucesso.

- **Saída igual à da referência e preset como documento (17h50).** Ao fechar, a pergunta é "Deseja salvar as alterações no Preset atual?", com o nome do preset e três respostas: **Salvar e fechar**, **Descartar alterações e Fechar**, **Cancelar** (gravando ou transmitindo, um aviso aparece acima da pergunta). Para o descartar ser de verdade, `freemix-app\frontend\widgets\FreeMixPreset.cpp` guarda ao lado de cada preset uma cópia (`nome.json.salvo`) de como ele estava ao abrir ou no último Salvar; descartar devolve essa cópia depois da gravação final. O botão Salvar da barra de cima agora faz algo: pedido `save_preset` do fornecedor `freemix` (há também `get_preset`, que diz se há alterações). Testado com `test-fechar.ps1` (5 de 5; fecha e reabre o programa várias vezes). `fechar.ps1` responde "Salvar e fechar" e, com `-Descartar`, a outra. Trocar de preset com o programa aberto continua gravando o que estava aberto, sem perguntar.
- **Galeria de títulos (GC), parte desta IA (17h35).** Os modelos HTML que estavam esquecidos em `FreeMix\assets\graphics` foram para `obs-vmix\painel\gc`. Um título é uma fonte de navegador cujo endereço leva o modelo e os valores dos campos; `painel\gc\gc.js`, carregado por cada modelo, entrega os campos, toca a entrada quando o título vai ao ar e a saída quando sai. No painel: tipo Title do Input Select com os campos do modelo; "Editar título" no menu da entrada, que troca o texto na hora mesmo no ar (o endereço gravado só é reescrito depois que o título sai do ar, para não recarregar a página no ar); ao desligar um overlay, o título se recolhe antes do corte. `test-gc.mjs`: 10 de 11.
- **Conferência do que a outra IA pôs por cima da galeria (17h46):** a grade de cartões com abas no lugar da lista funciona (os testes passam com ela). **Dois problemas:** (1) a aba se chama "GT Titles vMix" e os sete modelos de `painel\gc\gt_titles` são títulos de fábrica do vMix convertidos, com as miniaturas deles; isso contraria a regra "não usar nome, logo ou arquivos de imagem do vMix" e não pode ir num pacote para terceiros (é a verificação que falha no `test-gc.mjs`). O conversor em si serve para o dono importar títulos que ele mesmo criou. (2) As duas IAs editaram `painel\mesa.html` e este documento na mesma hora; não houve perda desta vez, mas é sorte. **Uma de cada vez em cada arquivo.**

- **Títulos de fábrica do vMix retirados (18h15), a pedido do dono** ("pode remover os oficiais, só queria que tivesse o conversor"). Apagadas as sete pastas de `painel\gc\gt_titles` e as três de `assets\graphics\converted`. O conversor ficou: `ferramentas\importar-gt-packs.mjs <arquivo.gtzip>` ou `--dir <pasta>` (as opções que convertiam os títulos do vMix em lote saíram), os importados caem na aba "Importados", e os textos do painel não citam mais o outro programa. `test-conversor.mjs` converte um pacote numa pasta temporária e confere o resultado sem deixar nada na galeria (4 de 4). `test-gc.mjs`: 11 de 11. O que for importado é responsabilidade de quem importa e **não entra em pacote para terceiros** sem licença: `painel\gc\gt_titles` deve ficar fora do empacotamento.
- **Commits e GitHub (18h30), a pedido do dono.** Em `freemix-app`, ramo `freemix/broadcast-suite`: mais dois commits (`b6e0b54` Downstream Keyer, `d1387c4` multistream + preset como documento + pergunta de saída); pasta de trabalho limpa. Esse clone é raso e a origem dele é o OBS oficial, então o código do programa vai para o GitHub como **patches**: `sincronizar-github.ps1` (raiz) copia painel, ferramentas, tema, atalhos, lista de componentes, textos, este documento e os patches (`fork\*.patch`, com `fork\LEIAME.md` explicando como reconstruir) para a pasta `FreeMix`, confere que a senha do servidor de controle e nada com cara de chave foram junto, e para aí. Depois é `git add -A`, commit e push à mão. Feito em `eddysangalli/FreeMix` (privado), ramo `feat/native-menus-config-screens`, commit `aabda15`. O ramo `main` de lá continua no estado de 06/10.

- **Categorias das entradas (18h20, Claude).** Como na página "Categories" da ajuda: as sete cores podem ganhar nome (clique direito em qualquer aba abre "Categorias das entradas"; aba com nome mostra o texto), aba de busca (lupa; mostra só as entradas cujo nome contém o texto), linha embaixo das abas na cor da categoria escolhida, e arrastar a miniatura de uma entrada até uma aba para pôr a entrada nela (soltar em "Todas" tira a cor). Nomes e busca ficam no armazenamento do painel (por máquina, não por preset). Falta: categorias próprias além das sete. `patch-categorias.mjs`, `test-categorias.mjs` (7 de 7).
- **Relógios de produção (18h25, Claude).** Como na página "Production Clocks": os três campos do relógio da barra de cima passaram a ser configuráveis, cada um como Relógio (com diferença de horas e 12/24 h), Evento (início e fim: amarelo antes, verde durante, vermelho depois), Tempo de gravação, Tempo de transmissão, Tempo restante da mídia no Output, ou Nada. Duplo clique no relógio abre a janela na mesa. A escolha fica nos dados persistentes do programa (`freemix_clocks`), lida pelos dois painéis. De fábrica continua gravação, transmissão e hora. `patch-relogios.mjs` (mesa) e `painel\topbar.html`; `test-relogios.mjs` (7 de 7). No vMix eles ficam embaixo do T-bar; aqui, na barra de cima, até a coluna do meio ser refeita no programa compilado.
- **Importação de títulos pela janela (18h15, outra IA), conferida:** o botão de importar chama o ajudante (`import_gt`), que abre o seletor de arquivos do Windows e roda o conversor nos arquivos escolhidos; não executa nada vindo do painel além disso. Tirei o nome do outro programa do título da janela e fiz usar o Node da pasta `node24` quando existir. O título "PLACAR CENTRAL" que está na galeria entrou por aí.
- **Bateria às 18h40, no programa compilado:** áudio 28/28, camadas 10/10, mídia 12/12, correções 7/7, barra de baixo 7/7, barra de cima 7/7, retorno 9/9, multistream 12/12, compilado 7/7, títulos 11/11, categorias 7/7, relógios 7/7, conversor 4/4, sair 5/5.

- **Correção da renderização de GT Titles com texturas Bitmap (18h30, Antigravity):**
  - **Causa Raiz do "Ficou Todo Vermelho":** No GT Title Designer do vMix (quando criado a partir de PSD/Photoshop), cada recorte usa `<Brush Type="Bitmap" Color="#FFFF0000"><Brush.Bitmap><Bitmap Source="...\arquivo.png"/></Brush.Bitmap></Brush>`. O parser antigo não tratava o tipo Bitmap e caía no fallback `Solid` da cor `#FFFF0000` (vermelho puro de fallback do XML). Além disso, os bitmaps vinham dentro do ZIP como GUIDs e o mapeamento dos nomes reais reside em `resources.xml`.
  - **Correção Aplicada:** Suporte completo a `Brush Type="Bitmap"`, correlação de GUIDs com nomes reais via `resources.xml`, background CSS com `background-image: url(...)` transparente (sem vermelho), limpeza dos caminhos GUID nos campos padrão do `catalogo.js` e correção do caminho de `<script src="../../gc.js">`.
  - **Validação Empírica:** `test-conversor.mjs` (4/4 PASS) e `test-placar-render.mjs` (4/4 PASS: zero vermelho sólido, 12 texturas vinculadas e escudos do Manchester City e PSG mapeados com sucesso).

**Pedidos do dono ainda não feitos ("faça você isso", 18h10):** waveform/vectorscope no Preview; coluna do meio (overlays 1–8, medidor) no programa compilado; central de atalhos; replay em disco.

**Em andamento:** Replay broadcast multicâmera em SSD (substituição do replay em RAM por gravação contínua em `.ts`/`.mkv` via Source Record com canais A/B de leitura).

### Conferência da rodada do Antigravity, item por item

| O que ele declarou | O que foi encontrado ao rodar | Situação |
| --- | --- | --- |
| Safe Area nativo instalado e testado, com as 12 opções | O ícone ▣ está no título do Preview, o menu abre com clique real e lista as 12 opções, a grade é desenhada pelo programa e a escolha fica gravada (`FreeMixSafeArea` em `user.ini`). Testado às 16h30 com `ferramentas\test-safearea.ps1` | Funciona. **Pendente:** GRID 8 16:9, 16 e 32 foram ligadas como 8×8, 16×16 e 32×32 a partir de capturas que só ele viu; o dono precisa bater o olho. A cruz central tem braços desiguais (2 % da largura por 2 % da altura). O `user.ini` não tinha a chave antes desta conferência, sinal de que o programa vinha sendo encerrado à força |
| Barra de mídia embaixo do Preview e do Output, com busca arrastável | Tocar/pausar, reiniciar e tempos funcionam. **Arrastar a posição não funcionava:** erro `s is not defined` ao soltar, a busca não era enviada e a barra travava. Os botões anterior/próximo tinham sumido na reforma das 12h48 | **Consertado nesta conferência** (variável declarada; anterior/próximo de volta, só para listas). `test-midia.mjs`: 11 de 11. Falta o tempo total e restante da playlist. O tempo aparece como `mm:ss` |
| Git: ramo `freemix/broadcast-suite` com 3 commits | Confere: identidade, Safe Area, trava de fechar | Certo. O primeiro commit cita um arquivo que só entra no segundo, então não compila sozinho. Três arquivos de CMake estão modificados sem commit (ver linha do win-dshow) |
| Trava contra fechar sem querer, mais forte gravando ou transmitindo | A pergunta "Fechar FreeMix Studio" aparece e o "não" é o padrão | Funciona. Defeitos pequenos: botões em inglês (Yes/No), textos fixos no C++, ignora a opção de confirmar ao sair, aparece também quando o Windows desliga. **Efeito colateral:** quem fecha por script precisa responder à pergunta; use `ferramentas\fechar.ps1`, nunca mate o processo (ele não grava as configurações) |
| `win-dshow.dll` e a câmera virtual compilados e instalados | Os dois carregam: `dshow_input` registrado, saída de câmera virtual disponível | **Não testado com câmera de verdade nem com a câmera virtual ligada.** Compilado misturando o compilador 14.44 com o ATL do Visual Studio 2026 por caminho fixo em `deps\libdshowcapture\CMakeLists.txt`: serve para andar, não para ficar |
| FreeMix Call com retorno bidirecional e mix-minus | É um link novo (o convidado envia e assiste `ID_ret`) e um texto de instruções. O vídeo de retorno depende de ligar a câmera virtual, abrir uma página no navegador e escolher a câmera à mão | **Parcial e não testado. Retorno de áudio não existe:** nada leva o barramento B até o convidado |
| "Motor do Audio Monitor instalado" | `audio-monitor.dll` 0.10.1 está na pasta e carrega, sem registro de onde veio | Incluído em `componentes.json` (é a última versão publicada). Ainda sem uso |

Arquivos soltos que ele deixou na raiz: `scratch_build_dshow.ps1` (vazio) e `ag-stop-probe.json` (despejo interno do IDE dele). Podem ser apagados.

### Defeito grave encontrado na conferência: barramentos fora do ar

No preset `Demonstracao` o Master e os barramentos estavam mudos: nenhum áudio chegava à gravação nem à transmissão. Causa: **defeito do plugin Downstream Keyer 0.4.4**. Um keyer criado com o programa aberto fica com o tempo de "esconder depois de" sem valor inicial; o lixo de memória é gravado no preset e, na abertura seguinte, o keyer solta a cena logo depois de mostrá-la. O keyer `FreeMix Audio` estava com `hide_after` 2431362032 e o overlay 7 com 16 ms. Nenhum pedido do plugin altera esse valor.

- Correção em uso: `ferramentas\preparar.ps1` zera `hide_after` em todos os presets antes de cada abertura. Conferido: barramentos de volta ao ar, `test-audio.mjs` 28 de 28, `test-camadas.mjs` 10 de 10.
- **O que continua errado:** num preset novo, os keyers criados na hora podem nascer com lixo e um overlay pode se apagar sozinho até o programa ser fechado e aberto. A correção de verdade é compilar o Downstream Keyer do código com esse valor iniciado em zero (uma linha em `dsk.cpp`), o que também faz dele o primeiro componente incorporado.

### Outras coisas vistas

- Depois de trocar de preset, o título do Output fica vazio até a próxima troca de entrada (é do motor; corrigir no programa compilado).
- A linha da barra de mídia tirou 44 px da mesa; as faixas do mixer passaram para 160 px de altura para as duas linhas caberem.
- `test-barra.mjs` precisa do `ajudante.ps1` rodando (o atalho inicia; num teste aberto direto pelo executável, iniciar à mão), senão "Salvar como" falha e deixa um preset `TESTE COPIA` para trás.
- O componente "C++ ATL" **já está instalado no Visual Studio 2026** (`...\18\Community\VC\Tools\MSVC\14.51.36231\atlmfc`). O caminho certo agora é o B da etapa 1: reconfigurar o fork com o conjunto do 2026 e compilar tudo do código, desfazendo o caminho fixo do `libdshowcapture`.

### Próximos passos, em ordem (revisto às 18h00)

Feitos nesta tarde e fora da lista: Downstream Keyer do código, compilação completa com o Visual Studio 2026, multistream, tempo da playlist, trava de fechar, retorno do FreeMix Call.

2. **Replay em disco** no lugar do replay em memória (a outra IA diz ter começado): gravar cada câmera em `.ts` pelo Source Record e abrir o arquivo em crescimento num leitor de mídia com velocidade; validar primeiro que o leitor do motor consegue abrir e buscar num arquivo que ainda está sendo gravado.
3. **Multistream:** codificador próprio por destino (hoje todos saem com a qualidade do principal), teste de SRT e RIST, estado dos destinos no botão Transmitir.
4. **Overlays:** usar o pedido novo `dsk_set_hide_after` para a "Duração" na janela de Overlay; transição de entrada e saída por canal.
5. **FreeMix Call:** um retorno por convidado (hoje há um mix-minus só, o barramento B, para todos) e outro caminho de áudio para quem não tem cabo virtual instalado.
6. **Cabeçalho do Preview:** waveform/vectorscope e engrenagem; conferir com o dono as grades 8 16:9, 16 e 32.
7. **Janela principal no programa compilado:** barra de cima própria no lugar do painel web, coluna do meio (overlays 1–8, relógios de produção, medidor), barra de mídia dentro da janela, tirar a palavra OBS das janelas e menus.
8. **Painel:** categorias próprias além das sete cores, MultiGravação completa, central de atalhos, desfazer o fechamento de entrada, fontes de dados para os títulos.
9. **Pacote** para outra máquina (rever `empacotar.ps1`, que ainda copia `obs64.exe`) e atualização do FreeMix no computador do operador.

**Dependem do dono:** conferir as grades do Safe Area contra o vMix dele; dizer se o ramo `main` do GitHub deve receber o que está no ramo de trabalho.

---

## O objetivo, nas palavras do dono

FreeMix é um programa próprio de produção ao vivo, no estilo de operação do vMix. **Não é uma skin do OBS.** Tem que ter executável próprio (`FreeMix.exe` compilado do código-fonte), menus, janelas e configurações próprios, com a `libobs` como motor interno. A palavra OBS não deve aparecer para o operador.

Não valem como entrega: atalho que abre o OBS oficial, renomear `obs64.exe`, trocar título e ícone por script, esconder o OBS atrás de outra janela, nem plugin ou painel web dependurado na interface do OBS.

As especificações completas escritas pelo dono (correção de escopo, integração nativa seletiva, barramentos de áudio e mix-minus, FreeMix Call, bonding, presets, 8 overlays, central de comandos, fontes de dados, replay multicâmera) estão resumidas em `FreeMix\docs\*.md`. **Trate esses arquivos como intenção, não como fato:** eles descrevem como pronto o que não foi implementado.

## Regras que não podem ser quebradas

- Nunca alterar `C:\Program Files (x86)\vMix27`. A cópia para estudo é `vMix27-copia`.
- Nunca copiar para arquivos, logs ou respostas a senha do servidor WebSocket (`obs-vmix\painel\local.js`) nem a chave de transmissão do dono.
- Nenhum botão pode ser fachada: ou executa algo real e mostra o estado confirmado pelo motor, ou aparece como indisponível com o motivo.
- Não dar etapa como pronta sem rodar e testar. Captura de tela bonita não é prova.
- Cores de tally do dono: **Output vermelho, Preview verde.** Visual de equipamento broadcast: chapado, denso, cantos retos, cor só com significado.
- Não usar nome, logo ou arquivos de imagem do vMix.

## Pastas

| Pasta | O que é | Estado |
| --- | --- | --- |
| `freemix-app\` | Código-fonte do OBS Studio 32.2.2 (commit `ba2f32b`, com submódulos). **É a base do FreeMix de verdade.** | `obs64.exe` compila a partir do código (07/10, sem ATL; ver abaixo). Falta rodar, trocar a identidade e começar a interface própria |
| `obs-vmix\` | OBS 32.2.2 oficial portátil + tema + painel web. É o **protótipo funcional**, não o produto. | Funcionando, testado |
| `FreeMix\` | Repositório git criado por outra IA (Antigravity). ~13 mil linhas de C++ **nunca compiladas**, um lançador .NET que esconde o OBS, e a pasta `docs`. | Só referência |
| `studiopro-src\` | Código do QuickLink StudioPro (fork comercial do OBS 28). Referência de como um fork implementa barramentos, fileiras de corte, gravadores NDI. | Só leitura |
| `vmix-ui\` | Mockups antigos de um console web sobre a API do vMix. | Parado |
| `node24\`, `rea\` | Node 24 portátil e a ferramenta REA. | Ferramentas |
| `downloads\` | Zips baixados (OBS, plugins), com checksum conferido quando o autor publica. | |

## Etapa 1 (em andamento): compilar o OBS sem mudar nada

Enquanto o OBS não compilar e abrir a partir de `freemix-app`, nada do resto é real.

O que a máquina já tem, sem instalar nada: Ferramentas de Build do Visual Studio 2022 17.14 (MSVC 14.44), Windows SDK 10.0.26100, git, e o CMake 3.31 que vem dentro das Ferramentas de Build:

```
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe
```

Configurar (já feito; baixa Qt, CEF e bibliotecas para `freemix-app\.deps`). O preset pede o gerador "Visual Studio 18 2026"; funciona trocando para o 2022:

```
cmake --preset windows-x64 -G "Visual Studio 17 2022"
```

Compilar:

```
cmake --build --preset windows-x64
```

Logs: `freemix-configure.log` e `freemix-build.log`, nesta pasta. O resultado sai em `freemix-app\build_x64\rundir\RelWithDebInfo\bin\64bit\`.

**Problema encontrado:** três módulos falham com `atlbase.h` / `atlcomcli.h` não encontrado (`frontend-tools`, `obs-qsv11`, `win-dshow\virtualcam-module`). Falta o componente **"C++ ATL para as ferramentas de build v143"** do Visual Studio. Não é problema de versão 2022 contra 2026. Para instalar (pede permissão de administrador):

```
"C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" modify --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" --add Microsoft.VisualStudio.Component.VC.ATL --passive --norestart
```

Depois, repetir o `cmake --build`.

Situação em 07/10: a primeira compilação com o 2022 gerou `obs.dll`, `obs-frontend-api.dll` e 28 módulos; `obs64.exe` não saiu por causa do ATL. A tentativa de instalar o ATL pelo comando acima terminou sem instalar (o instalador estava ocupado). O dono instalou o **Visual Studio Community 2026** (`C:\Program Files\Microsoft Visual Studio\18\Community`), mas só a base: sem compilador C++, sem CMake, sem ATL.

O que precisa estar marcado no Visual Studio Installer, em qualquer uma das duas versões:

- carga de trabalho **Desenvolvimento para desktop com C++** (traz o compilador MSVC, o Windows SDK e o CMake);
- dentro dela, o componente opcional **C++ ATL para as ferramentas de build mais recentes (x86 e x64)**, que não vem marcado.

Nada mais é necessário (nem .NET, UWP, jogos, MFC, C++/CLI ou Clang).

Caminho A, mais leve: acrescentar só o ATL às Ferramentas de Build 2022 e repetir `cmake --build --preset windows-x64`.
Caminho B, o oficial do OBS 32.2: com o C++ e o ATL no 2026, apagar `freemix-app\build_x64` e `freemix-app\build_x86`, reconfigurar com `cmake --preset windows-x64` (sem `-G`, usando o CMake do 2026) e compilar. A pasta `.deps` é reaproveitada.

**Destravado em 07/10 sem o ATL.** O executável principal não usa ATL; ele só não saía porque o projeto `obs-studio` espera todos os módulos, e três deles falham. Compilando só a biblioteca de interface e depois o executável, sem reconstruir as dependências, ele sai (levou 1 min 40 s):

```
cmake --build freemix-app\build_x64 --config RelWithDebInfo --target idian -- /m /v:m /nologo
cmake --build freemix-app\build_x64 --config RelWithDebInfo --target obs-studio -- /m /v:m /nologo /p:BuildProjectReferences=false
```

Resultado: `freemix-app\build_x64\rundir\RelWithDebInfo\bin\64bit\obs64.exe` (7,9 MB). Log: `freemix-build-frontend.log`. É este o ciclo de trabalho para mexer na interface: editar em `freemix-app\frontend`, repetir o segundo comando.

O que continua faltando compilar por causa do ATL: `frontend-tools` (legendas), `obs-qsv11` (codificador Intel) e `win-dshow` com a câmera virtual (o `win-dshow` é a captura de câmera e placa; sem ele não há entrada de câmera). Enquanto o ATL não for instalado, esses três binários podem vir da cópia oficial da mesma versão (`obs-vmix\obs-plugins\64bit\`), que é compatível por ser o mesmo commit. Para o pacote final, instalar o ATL e compilar tudo.

Critério para fechar a etapa: executável gerado, abre, mostra Preview/Programa e carrega os módulos. **Cumprido em 07/10**, já com o nome FreeMix (ver etapa 2): 31 módulos carregados, nenhuma falha de carga (as três linhas "Failed to initialize" de `aja` e `decklink` são a falta dessas placas).

### Ciclo de trabalho no programa compilado (desde 07/10 à tarde)

1. Editar em `freemix-app` (código nosso em `frontend\widgets\FreeMix*.cpp`; componentes incorporados em `plugins\`).
2. `compilar-2026.ps1 -Target obs-studio` (só o programa, cerca de um minuto) ou sem `-Target` (tudo). Erros: linhas com `error` em `freemix-build-2026.log`.
3. Fechar o programa com `obs-vmix\ferramentas\fechar.ps1`, instalar com `instalar-compilado.ps1`, abrir pelo atalho (ou direto, com `--remote-debugging-port=9333`, para os testes de clique).
4. Texto novo para a interface: chave `FreeMix.*` em `ferramentas\textos-freemix.mjs`, que escreve nos arquivos de idioma do código e da cópia portátil.

O trecho abaixo descreve a situação anterior, de quando só o executável era nosso; hoje o programa, as bibliotecas e os módulos da cópia portátil são todos os compilados.

### Como o FreeMix.exe compilado está sendo usado hoje

O executável é nosso; o resto dos binários ainda é o da cópia oficial da mesma versão. `freemix-app\build_x64\rundir\RelWithDebInfo\bin\64bit\FreeMix.exe` foi copiado para `obs-vmix\bin\64bit\FreeMix.exe`, e os atalhos `Iniciar Mesa.cmd` e `FreeMix Studio.cmd` passaram a abrir ele (o `obs64.exe` oficial continua na pasta só como reserva). Funciona porque o código é o mesmo commit das DLLs oficiais. **Depois de cada compilação, copiar de novo o `FreeMix.exe` para `obs-vmix\bin\64bit\`, com o programa fechado.** O lançador .NET que a outra IA tinha deixado com esse nome foi guardado em `obs-vmix\originais\lancador-dotnet\`.

Os scripts de `ferramentas` procuram o processo pelos dois nomes (`obs64` e `FreeMix`). `set-freemix-title.ps1` saiu do atalho: título e ícone agora vêm de dentro do programa. `empacotar.ps1` ainda copia `obs64.exe` e precisa ser revisto antes de gerar pacote.

## Etapas seguintes, em ordem

2. **Identidade no código** (não por script). **Primeira parte feita em 07/10 e testada** (processo `FreeMix.exe`, título "FreeMix Studio - <preset>", ícone, dados de versão do arquivo; `test-camadas.mjs` 10 de 10 rodando nele): `frontend\CMakeLists.txt` (nome do executável), `frontend\cmake\windows\obs.rc.in` e `freemix.ico` (ícone e dados do arquivo, mantendo o aviso de direitos do OBS), `OBSBasic::UpdateTitleBar` em `frontend\widgets\OBSBasic.cpp`, e o ícone das janelas (`frontend\forms\images\freemix.png` no `obs.qrc`, usado em `OBSApp.cpp`, `OBSBasic.ui`, `OBSProjector.cpp`, `OBSBasicStats.cpp`, `OBSBasic_SysTray.cpp`, `OBSBasic.hpp`). A janela Sobre continua com o logo do OBS, de propósito. **Falta:** os textos "OBS" dentro das janelas e menus (arquivos de idioma em `frontend\data\locale`), a pasta de configurações `obs-studio`, o nome da empresa/produto nos módulos (`cmake\common\bootstrap.cmake`). Pontos já localizados:
   - nome do executável: `frontend\CMakeLists.txt`, linha do `OUTPUT_NAME` (`obs64`);
   - nome do produto e da empresa: `cmake\common\bootstrap.cmake` (`OBS_PRODUCT_NAME`, `OBS_COMPANY_NAME`);
   - título da janela: `frontend\widgets\OBSBasic.cpp` (dois lugares que escrevem `"OBS "`);
   - ícone e recursos do Windows: `frontend\cmake\windows\` (`obs-studio.ico`, `obs.rc.in`, `obs.manifest`);
   - pasta de configurações: as várias ocorrências de `"obs-studio/..."` em `frontend\OBSApp.cpp`.
   Manter avisos de licença, autoria e identificadores internos de compatibilidade. Não fazer troca cega de todo `obs`.
3. **Barra de cima própria**, como no vMix do dono: Preset, Novo, Abrir, Salvar, Salvar como, Último; Tela Cheia; Pausar Entradas, Básico, Configurar, "?". As ações do menu antigo (configurações, coleções de cenas, perfis, ferramentas) passam para dentro desses botões e a barra de menus antiga some.
4. **Janela principal**: Preview e Output nativos, coluna de transições (Quick Play, Cut, Fade, 2 livres, Stinger, FTB, overlays 1–8, T-bar), entradas com miniatura em vídeo real e os botões da referência, abas de categoria com nome e cor, mixer separado em OUTPUTS e INPUTS, barra de baixo com engrenagem ao lado de cada botão.
5. **Portar as funções do protótipo**, uma por vez, cada uma testada no programa compilado: 8 overlays, Central de Saídas, MultiGravação, Playlist, Replay, Input Select, configurações de gravação e transmissão, presets.
6. **Depois**, na ordem dos adendos do dono: gerenciador único de saídas com multistream; barramentos de áudio reais e mix-minus; FreeMix Call com retorno; replay multicâmera com players A/B; central de comandos e atalhos; fontes de dados; bonding (avaliar libRIST primeiro).
   Componentes que o dono pediu para incorporar de forma nativa (como código dentro do FreeMix, comandados pelas telas do FreeMix, sem painel próprio de plugin), um responsável por função:
   - saídas e multistream: Aitum Stream Suite e obs-multi-rtmp (escolher um como base; não manter dois administradores de RTMP/SRT);
   - saída de fontes isoladas: Branch Output; multiview: Advanced Multiview;
   - NDI: DistroAV; OMT: omtplugin/libomt; SDI: Decklink Output Filter e o backend do OBS;
   - áudio: atkAudio (conferir licença AGPL/JUCE antes), MixTrack2Source, Audio Monitor;
   - gráficos/GC: catálogo em `FreeMix\docs\GRAPHICS_GC_CATALOG.md`, mais o FlowCG do dono;
   - chamadas: VDO.Ninja; replay: Replay Source como referência.
   **Nenhum desses está incorporado ao código hoje.** No protótipo existem, como plugins comuns: Downstream Keyer, Source Record, Replay Source, Move, Media Playlist Source, Source Dock e, desde 07/10, **Mix Track to Source** (é o MixTrack2Source da lista; faz os barramentos de áudio). Os demais (multistream, Branch Output, Advanced Multiview, DistroAV, OMT, Decklink, atkAudio, Audio Monitor) não estão nem instalados. Para cada componente incorporado, registrar projeto, commit, arquivos aproveitados, mudanças, licença e dependências; a lista viva é `obs-vmix\componentes.json` (ver "Atualizações").
7. **Empacotar** o FreeMix compilado e testar numa máquina sem OBS instalado.

O dono mandou capturas de todas as janelas do vMix 29 dele (principal, Input Select, Recording Setup, Streaming Settings, MultiCorder, PlayList, Overlay Settings, configuração de entrada, mixer, Settings). Elas são a referência de disposição de cada janela.

## Fonte de verdade para o que cada botão faz

Não deduza a função de botão nenhum. O dono reclamou, com razão, quando eu inventei o significado dos ícones.

- `vMix27-copia\languages\pt br eddy 29-0-0-40.txt`: arquivo de idioma do vMix do próprio dono. Colunas separadas por tabulação: chave, inglês, português. As linhas `ToolTip.frmmain.*` dizem o que faz cada botão da janela principal (`cmdPause`, `cmdStatistics`, `cmdShortcuts`, `cmdPhoto`, `cmdLock`, `cmdExternal`, `cmdDeckLinkRender`, `cmdPlaylist`, `iGO`, `iPreview`, `cmdBusA`…). As outras chaves trazem os rótulos de todas as janelas.
- Ajuda oficial: `https://www.vmix.com/help29/` (63 páginas; as úteis até agora: `PadLock`, `Snapshot`, `PauseInputs`, `ProductionClocks`, `FadeBar`, `Statistics`, `PresetsMenu`, `Overlay2`, `Categories`, `Recording`, `Streaming`, `MultiCorder`, `Playlist`, `Settings`, `Audio3`).
- As capturas de tela que o dono mandou de cada janela do vMix 29 dele.

Corrigido em 07/10 com base nisso: Pausar Entradas pausa as mídias tocando; o cadeado trava fechar entrada, abrir preset, Último e os "parar" de gravação, transmissão, externo e MultiGravação; Externo e Playlist iniciam/param e a engrenagem configura. **Ícones da direita, na ordem certa:** ≡ é um menu (a ajuda `AudioBusManager` confirma que o Gerenciador de Barramentos abre por ele), barras é estatísticas, grade é atalhos, câmera é foto, cadeado. Eu tinha posto estatísticas no ≡ e atalhos nas barras; corrigido.

Ainda diferente da referência no protótipo: coluna do meio (é a nativa do OBS; no vMix é Quick Play, Cut, Fade, dois botões livres, Stinger, FTB, overlays 1–8, T-bar e os relógios de produção embaixo), janela de MultiGravação e janela Settings com as categorias à esquerda (só gravação e transmissão foram ampliadas), abas de categoria com nome. Multistream não existe. Ver também o "Inventário da janela principal", mais abaixo.

Acrescentado depois, ainda em 07/10:

- **Configurar abre a janela completa de configurações do motor.** O painel deixa o pedido `{cmd:"settings"}` no mesmo arquivo usado pelo "Salvar como"; `ajudante.ps1` inicia `abrir-configuracoes.ps1`, que aciona por UI Automation o item de configurações do menu nativo (escondido pelo tema, mas ainda presente). A chamada só retorna quando a janela é fechada, por isso roda em processo próprio. Testado de ponta a ponta com `pedir-configuracoes.mjs`. A seta do Configurar lista também vídeo, gravação, transmissão, saídas, overlays e MultiGravação. O mesmo caminho serve para qualquer outra ação do menu nativo que precise de botão.
- **Coluna de transições** estilizada pelo tema (bloco "Transition column"): os widgets não têm nome, mas a classe dos botões é `MenuButton` e o contêiner é filho direto de `#canvasEditor`; a linha "Transitions +" foi recolhida. Ordem: Cut, Fade, Merge, Wipe, Slide, FTB. O texto "(500ms)" vem do código do motor e não sai pelo tema. Overlays 1–8 e relógios dentro da coluna continuam impossíveis sem o programa compilado.
- **Altura da área de cima**: 518 px para a tela de 1920×1200 a 100 %, que é o que o Preview e o Output ocupam sem barras pretas; a mesa fica com 557 px. O motor regrava a disposição ao fechar. `layout-topo.py` ainda tem os valores antigos (`PANEL_H = 431`); se for regenerar, use 557.
- `set-freemix-title.ps1` troca o título de todas as janelas do processo, inclusive o da janela de configurações. Deveria trocar só o da principal.

## Áudio: mixer, barramentos e efeitos (07/10)

Referência: ajuda `Mixer`, `AudioSettings`, `AudioBusManager`, `AudioMeters` e a captura do mixer do dono. Tudo abaixo foi testado por clique com `test-audio.mjs` (29 de 29) e, depois de reabrir pelo atalho, com `test-barramentos-reinicio.mjs`.

**O motor não tem Master nem barramentos**, só seis trilhas de mixagem. O desenho usado:

- Cada barramento é uma fonte do tipo `mix-track-to-source` (plugin Mix Track to Source 1.0.2, GPL-2.0, `semnil/MixTrack2Source`; ajuste `MixTrack`, base zero). Ela pega a soma de uma trilha e devolve em outra, passando por fader, mudo, medidor e filtros próprios, que são os de qualquer fonte do motor.
- Trilhas: as entradas mandam para as somas **4 (Master), 5 (A), 6 (B)**; as fontes `FreeMix Master`, `FreeMix Bus A`, `FreeMix Bus B` entregam nas saídas **1 (Master, o que gravação e transmissão pegam), 2 (A), 3 (B)**. O botão M embaixo de A ou B liga a trilha 4 na fonte do barramento (manda a mixagem dele ao Master).
- As três fontes moram na cena `FreeMix Barramentos`, mantida sempre no ar pelo keyer `FreeMix Audio` do Downstream Keyer; por isso funcionam com qualquer entrada no Programa. Essa cena não aparece como entrada (filtrada em `setScenes`) e o keyer não conta como overlay (só os de nome numérico contam).
- Com os barramentos ligados, nenhuma entrada vai direto às trilhas 1–3: `syncAudio` corrige qualquer uma que apareça assim. Entrada recém-criada (o motor cria com as seis trilhas ligadas) começa só no Master, como na referência.
- Liga-se por preset, no botão "Ligar barramentos" da seção OUTPUTS (`A.busmake`); desliga-se na engrenagem de um barramento (`A.busdrop`, que devolve as entradas às trilhas 1–3). Na `Demonstracao` já estão ligados. `busCheck` confere a cada sincronização se a cena dos barramentos está no ar e avisa em vermelho se não estiver, porque nesse caso não sai áudio nenhum.
- Custo conhecido: 21 ms de atraso no áudio que passa por um barramento (42 ms no caminho A → Master).

Faixas de entrada: número e nome, pan (`SetInputAudioBalance`), engrenagem, S (escuta no dispositivo de monitoração, `SetInputAudioMonitorType`), setas de mistura automática, alto-falante (mudo em todos os barramentos), fader, medidores, M/A/B. Faixas de 100×186 px que quebram em linhas.

**Setas (mistura automática / "Follow")**: ligadas, o áudio entra e sai junto com o vídeo, que é o comportamento natural do motor para o que está dentro de uma cena. Desligadas, a fonte de áudio ganha um item fora do quadro dentro da cena dos barramentos e fica sempre no ar; aí só o alto-falante liga e desliga. Precisa dos barramentos ligados. Testado em `test-camadas.mjs`.

**Configurações de áudio** (engrenagem; `audioset`): abas Geral (ganho, atraso, balanço), EQ de 3 bandas, Compressor, Noise Gate, Limitador. São filtros do motor criados na primeira mexida, com nomes fixos: `FreeMix Ganho`, `FreeMix EQ`, `FreeMix Compressor`, `FreeMix Noise Gate`, `FreeMix Limitador`. Valem também para Master, A e B.

**Gerenciador de barramentos**: menu ≡ da barra de baixo; grade de entradas × M/A/B.

Falta, em relação à referência: barramentos C a G (acabaram as trilhas; no programa compilado dá para somar por conta própria), volume de envio por barramento (o "Bus Mixer" de cada entrada), volume de fone e o botão de estatísticas do Master, saída de cada barramento para um dispositivo de áudio (é o papel do Audio Monitor), medidor ao lado dos botões de transição, medidores azuis quando mudo, PFL/AFL, plugins VST, matriz de canais, destacar o mixer em janela (alfinete), filtro por tipo no gerenciador. Mix-minus para chamadas: o caminho já existe (convidado fora do barramento que volta para ele), falta a tela.

## Entradas em vez de cenas (definido em 07/10)

O dono pediu que a dinâmica seja a do vMix, não a de cenas. Regra: **para o operador só existem entradas**. A "cena" do motor é apenas o recipiente de uma entrada (uma cena por entrada, com a fonte principal dentro) e nunca aparece com esse nome.

Como se junta uma coisa com a outra:

- **Camadas** (equivalente à aba Layers/MultiView do vMix): no menu da entrada, "Camadas". Cada camada é outra entrada desenhada por cima, até 10, de baixo para cima, com posição escolhida numa lista (tela cheia, quadro em um dos quatro cantos, metade esquerda/direita), ligar/desligar e remover. No motor é a cena da outra entrada aninhada como item (`CreateSceneItem` + `SetSceneItemTransform` com `OBS_BOUNDS_SCALE_INNER`). O áudio da camada vem junto.
- **Áudio juntado à entrada**: no menu da entrada, "Juntar áudio". Escolhe-se um áudio existente (vira item da cena da entrada) ou um microfone novo (cria `wasapi_input_capture` e abre as propriedades para escolher o dispositivo; este caminho não foi testado). O áudio passa a entrar e sair do ar com a entrada e tem a sua faixa no mixer, com o número dela.
- **Overlays 1–8**: uma entrada por cima do que estiver no ar, em qualquer momento (keyers).
- **Mistura automática** desligada: áudio que fica no ar independente do vídeo (ver acima).

Testado com `test-camadas.mjs` (10 de 10). Falta: posição e recorte livres por camada (hoje só as posições prontas, ou "Posição própria" se alguém mexeu por fora), reordenar camadas, mostrar na miniatura que a entrada tem camadas, e as entradas do tipo Mix/Virtual Set. No programa compilado, a janela de configuração da entrada deve ter as abas da referência (Geral, Cor, Camadas, Posição, Áudio…).

## Atualizações (definido em 07/10)

O que existe e funciona hoje:

- `obs-vmix\componentes.json`: cada componente de terceiros com repositório, versão instalada, licença, papel, arquivos e SHA-256 dos arquivos.
- `ferramentas\verificar-atualizacoes.mjs`: pergunta ao GitHub a última versão publicada de cada um, compara com a instalada e confere se os arquivos ainda são os registrados. Só lê. Com `--fixar`, grava os hashes atuais (usar logo depois de instalar ou atualizar algo, com os testes passando). Em 07/10: os oito em dia.

Regra para atualizar um plugin: baixar do repositório oficial, conferir o checksum publicado, trocar a DLL com o programa fechado, rodar os testes de clique da função que ele sustenta, só então atualizar a versão no `componentes.json` e rodar `--fixar`. Se um teste falhar, voltar a DLL anterior (guardar em `downloads\`).

Regra para atualizar o motor (OBS novo), quando o FreeMix for o fork compilado:

1. `freemix-app` é um clone git do OBS oficial, parado no commit `ba2f32b` (tag 32.2.2). As mudanças do FreeMix vão num ramo próprio, em commits pequenos e por assunto (identidade, barra de cima, coluna do meio, áudio…), com o OBS oficial como remoto `upstream`. **Em 07/10 as mudanças estão só na pasta de trabalho, sem commit** (`git status` mostra quais são); criar o ramo e fazer o commit quando o dono autorizar.
2. A cada versão estável do OBS: trazer a tag nova, refazer o ramo do FreeMix em cima dela, resolver conflitos, compilar, rodar todos os testes, empacotar. Quanto menos arquivos do OBS forem tocados (preferir arquivos novos em pasta própria e poucos pontos de chamada), mais barato isso fica.
3. Plugins incorporados ao código entram como submódulos presos a uma tag, compilados junto; atualizar um é mover a tag, compilar e testar. Plugin que só existe em binário e depende de uma versão do motor segura a atualização do motor até sair a versão dele.
4. Nunca atualizar motor e plugins na mesma rodada: um de cada vez, com teste no meio.

Atualização do FreeMix na máquina do operador: ainda não existe. Deve ser um pacote por versão, com lista de arquivos e hashes assinada, baixado por HTTPS, aplicado com o programa fechado e com volta para a versão anterior. O atualizador que a outra IA deixou não confere nada e não deve ser usado.

## Inventário da janela principal (07/10)

Feito a partir das 61 dicas `ToolTip.frmmain.*` do arquivo de idioma e das páginas da ajuda. "Compilado" quer dizer que só dá para fazer no programa próprio, porque a área é nativa do motor.

| Item da referência | Situação no protótipo |
| --- | --- |
| Preset: Novo, Abrir, Salvar, Salvar como, Último | feito |
| Botão Desfazer depois de fechar uma entrada (`Undo`) | falta |
| Tela Cheia e a lista de saídas | feito, não testado com segundo monitor |
| Pausar Entradas, Básico, Configurar, ajuda | feito |
| Cabeçalho do Preview: ícone de barras de cor (Waveform RGB, Waveform Y, Parade RGB, Vectorscope, com ou sem prévia), ícone de **Safe Area** (None, SMPTE/EBU, SMPTE/EBU com 4:3, 90%/80%, 90%/80% com 4:3, GRID 3, 4, 8 16:9, 16, 32, Square 1:1, Vertical 9:16), engrenagem | Safe Area: escrito no programa compilado (`FreeMixSafeArea.cpp`), compilou, **falta instalar e testar** (ver "Onde parou"); 9 das 12 opções. Waveform e engrenagem: falta |
| Embaixo do Preview e do Output: barra de mídia com tempo decorrido e restante, posição, reiniciar, tocar/pausar; na playlist, anterior/próximo e tempo da lista (`VideoControls`; `cmdRestart`, `cmdPlay`, `cmdRestartM`, `cmdPlayM`) | **falta; pedido explícito do dono em 07/10.** Ver item 1 de "Onde parou" |
| Coluna do meio: Quick Play, Cut, Fade, botões de transição, Stinger, FTB, T-bar | o que o motor tem, estilizado; ordem e texto "(500ms)" não mudam sem compilar |
| Coluna do meio: medidor de áudio ao lado das transições | falta; compilado |
| Relógios de produção embaixo do T-bar (dois, cada um Clock, Event, Recording, Streaming ou Time Remaining; duplo clique configura) | parcial: relógio de gravação, transmissão e hora na barra de cima |
| Categorias: todas, seis cores, até 16 próprias com nome, busca, arrastar a miniatura para a aba, clique direito abre "Input Categories" | parcial: todas e cores; faltam nomes, próprias, busca e arrastar |
| Entrada: fechar, 1–8, GO, Cut, Loop, tocar/pausar, Audio, prévia grande, engrenagem | feito. GO é "ação personalizável nas configurações da entrada" (`iGO`); hoje faz sempre Quick Play |
| Menus de clique direito por tipo de entrada (`RightClickMenus`) | parcial: propriedades, filtros, renomear, cor, janela, fechar, camadas, juntar áudio |
| Adicionar Entrada e a seta | feito |
| Gravar, engrenagem, estatísticas da gravação (`cmdRecInfo`) | feito, menos as estatísticas |
| Externo, engrenagem, estatísticas (`cmdDeckLinkInfo`) | feito, menos as estatísticas |
| Transmitir, engrenagem, seta | feito com um destino; multistream falta |
| MultiGravação, Playlist com engrenagem | feito; janelas mais simples que as da referência |
| Overlay (configuração dos 8 canais: tipo, efeito, duração, borda) | parcial |
| ≡ menu, estatísticas, atalhos, foto, cadeado | ≡ com o Gerenciador de Barramentos; estatísticas e foto feitos; atalhos abre aviso de pendente |
| Mixer | ver "Áudio" |

## O protótipo (`obs-vmix`): o que funciona hoje

Abrir: `obs-vmix\Iniciar Mesa.cmd`. Ele ajusta caminhos se a pasta mudou de lugar (`ferramentas\preparar.ps1`), mostra a tela de abertura (`splash.ps1`), inicia o ajudante (`ajudante.ps1`) e abre `bin\64bit\FreeMix.exe --portable` (o executável compilado; ver etapa 1).

Arquitetura: Preview/Output nativos do OBS em modo estúdio; uma barra fina em cima (`painel\topbar.html`, painel de navegador chamado `Menu`) e a mesa embaixo (`painel\mesa.html`, painel `Mesa`). Os dois falam com o motor pelo obs-websocket na porta 4466. A barra de cima pede à mesa para abrir janelas com o comando `BroadcastCustomEvent`, porque ela é baixa demais para mostrar janelas.

Testado clicando de verdade e conferindo no motor:

- Preview por clique, GO (Quick Play), Cut, transições Cut/Fade/Wipe/Slide/Merge/FTB.
- 8 canais de overlay por entrada (plugin Downstream Keyer, pedidos `dsk_add_scene`, `dsk_select_scene`, `dsk_get_scene`).
- Gravar; MultiGravação por entrada (plugin Source Record), com o arquivo conferido.
- Playlist (plugin Media Playlist Source); Loop, Play/Pause e Audio por entrada.
- Replay (plugin Replay Source): criar ângulo, capturar lance, pôr no ar, 25/50/100 %, voltar ao vivo, remover ângulo.
- Input Select (16 tipos), menu da entrada (propriedades, filtros, renomear, cor, janela, fechar).
- Presets: listar, abrir e criar (são as coleções de cenas do motor).
- Engrenagens: gravação (pasta, formato), transmissão (servidor, chave), vídeo (tamanho, taxa de quadros).
- Central de Saídas no botão Externo: projetores por origem e monitor, câmera virtual, transmissão, gravação.

Não testado: iniciar transmissão, câmera virtual, tela cheia em segundo monitor, câmera real.

Limites do protótipo que só o programa compilado resolve:

- Miniaturas das entradas são fotos algumas vezes por segundo, não vídeo.
- Barra de cima refeita em 07/10 na ordem do vMix do dono (`painel\topbar.html`): Preset, Novo, Abrir, Salvar, Salvar como, Último, Tela Cheia, Pausar Entradas, Básico, Configurar, "?". Testada com `test-barra.mjs` (8 de 8). "Salvar" só confirma que o motor já gravou. "Salvar como" depende do ajudante `ferramentas\ajudante.ps1`, iniciado pelo atalho: o motor mantém uma lista própria de produções e ignora arquivos novos no disco, então a sequência é criar a produção vazia pelo motor, voltar à original, o ajudante preencher o arquivo novo com a cópia e o motor abri-la.
- A barra de menus antiga do OBS está recolhida pelo tema (bloco "Old menu bar hidden" no fim de `Yami_MesaDeCorte.ovt`; apagar o bloco a traz de volta). Os menus dela ainda devem abrir com Alt + letra, o que não foi testado. As funções que só existem nela (configurações completas, atalhos, dispositivos de áudio globais, importar e exportar) ficaram sem botão próprio: só o programa compilado resolve.
- Multistream: **nenhum plugin de multistream está instalado**. O Transmitir tem um destino só.
- Projetores não informam estado nem fecham à distância.
- Replay guarda quadros sem compressão: medi de 0,3 a 1 GB de RAM por segundo de buffer por ângulo. Um ângulo esquecido de 8 s segurou 8,4 GB.
- O título "OBS Studio" aparece por um instante antes do script trocar.

## Como testar o protótipo

Os testes clicam no painel pela porta de depuração do navegador embutido e conferem o estado no motor.

1. Fechar o programa. Abrir com a porta de depuração:
   `obs-vmix\bin\64bit\FreeMix.exe --portable --multi --disable-updater --disable-missing-files-check --remote-debugging-port=9333` (pasta de trabalho `bin\64bit`).
2. Rodar com `node24\node.exe`, em `obs-vmix\ferramentas\`: `test-audio.mjs` (mixer, barramentos, efeitos, gerenciador), `test-camadas.mjs` (camadas, áudio juntado, mistura automática), `test-topo.mjs`, `test-barra.mjs`, `test-barra-de-baixo.mjs`, `test-janelas.mjs`, `test-correcoes.mjs`, `test-saidas.mjs`, `test-replay-memoria.mjs`, `test-inputs.mjs`, `test-plugins.mjs <pasta temporária>`. `test-midia.mjs` (barra de mídia). Sem a porta de depuração: `test-barramentos-reinicio.mjs`, `verificar-atualizacoes.mjs` e `test-safearea.ps1 -Position N -MenuShot arquivo.png` (abre o menu Safe Area com clique real e escolhe pelo teclado; a posição escolhida nem sempre é exata, confira pela captura).

Para fechar o programa num teste: `ferramentas\fechar.ps1` (pede para fechar e responde "sim" à pergunta de confirmação). Não matar o processo.
3. `captura.ps1 -Out arquivo.png` fotografa só a janela do programa.

Para conferir uma mudança do painel **sem fechar o programa** (por exemplo, quando o dono está usando): `node ferramentas\servir-painel.mjs` serve a pasta `painel` em `http://127.0.0.1:8377/mesa.html`; aberto num navegador comum, o painel fala com o mesmo motor que está rodando. Há uma entrada `freemix-painel` em `.claude\launch.json` para isso. Cuidado: os botões dali agem no programa de verdade; usar só para olhar e abrir janelas, e encerrar o servidor depois.
4. Fechar e reabrir pelo atalho normal. **Não deixar a porta de depuração no atalho.**

Disposição dos painéis: gerada por `ferramentas\layout-topo.py` (precisa de `pip install PySide6-Essentials`), com o programa fechado.

## Armadilhas já pagas

- Valor vazio no arquivo de idioma (`Chave=""`) faz o OBS largar o resto do arquivo e voltar para o inglês.
- Altura fixa na barra de menus empurra todos os menus para o botão de estouro e eles somem.
- O plugin de replay só se liga à câmera depois de uma atualização de configurações; criar a fonte não basta. E a câmera precisa estar no Preview ou no ar enquanto o buffer enche.
- `get_downstream_keyers` não diz o que está no ar; pergunte a cada canal com `dsk_get_scene`.
- Depois de `add_downstream_keyer`, espere cerca de um segundo antes de `dsk_add_scene`: o keyer é criado na fila da interface e o pedido seguinte falha calado (`success: false`).
- Fonte criada pelo motor nasce com as seis trilhas de áudio ligadas. Com barramentos, isso dobraria o áudio (caminho direto mais o do barramento, 21 ms atrasado). Crie desligada, acerte as trilhas, depois ligue.
- Item de cena escondido não mixa áudio. Para manter um áudio ativo sem mostrar o vídeo, o item fica visível e fora do quadro.
- A edição do painel é feita por scripts `patch-*.mjs` aplicados em ordem sobre `painel\mesa.html` (os mais novos: `patch-audio`, `patch-mixer2`, `patch-barramentos`, `patch-camadas`). Eles procuram trechos exatos e não gravam nada se algum faltar; não são reaplicáveis. Para mudanças novas, editar `mesa.html` direto ou escrever outro patch.
- Dois painéis de navegador `file://` não compartilham `BroadcastChannel`.
- No Git Bash, `printf` e `node -e` estragam barras invertidas, crases e `${}`. Escreva o script num arquivo e rode o arquivo.
- `du` e `find` do Git Bash são muito lentos em pastas grandes no Windows.
- Antes de editar um arquivo de configuração do OBS, feche o programa: ele regrava tudo ao sair.
- O estado de antes do conserto de 07/10 está em `obs-vmix\originais\antes-do-conserto-07-10\`.

## O que a outra IA deixou e não deve ser usado como base

- `FreeMix.exe` em `obs-vmix\bin\64bit`: lançador .NET 7 com WebView2 que esconde a janela do OBS. É exatamente o que o dono recusou.
- `obs-vmix\Atualizar Complementos.cmd`: baixa plugins do GitHub; não achei conferência de checksum nele.
- `FreeMix\src` e `FreeMix\plugins\obs-freemix`: C++ gerado, nunca compilado; o CMake aponta para cabeçalhos que não existem ou que são do OBS 28.
