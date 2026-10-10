# Menus restantes: evidência, proposta e limites

Auditoria de navegação em 2026-10-10. Fonte: snapshot atual FreeMix/painel/remoto, com hashes em BASELINE.json. Dados próprios simulados; nenhuma API do operador, Native, gravação ou saída foi acionada. O coordenador capturou as rotas pelo IAB nesta rodada; este agente abriu as mesmas imagens com view_image. CUA deste agente retornou IAB indisponível e listBrowsers vazio. Não foi usado Playwright externo.

## Fluxo capturado e estado de cada passo

1. **Configurações gerais — utilizável, com oportunidades de orientação.** Imagem01. Categoria de vídeo tem campos reais, ajuda e Aplicar/Cancelar sempre visíveis. O menu contém configuração global, editores embutidos e ferramentas Native. Não confundir esses tipos.
2. **Áudio das entradas — sobrecarregado para tarefa básica.** Imagem02. AFV/mute e estado da fonte estão claros, mas atraso/filtros ocupam a primeira tela; barramentos/dispositivos/ASIO continuam abaixo. Não há indicação imediata de onde ajustar apenas uma fonte, formato global ou retorno.
3. **Operar Replay — ordem inicial confusa para primeira utilização.** Imagem03. Quatro players vazios aparecem antes de preparar câmeras/REC. A timeline existe, mas gravar e selecionar câmeras vêm depois. Os comandos rápidos IN/OUT em tempo real são distintos dos pontos IN/OUT do histórico.
4. **Formato global do áudio — formulário real, separado do roteamento.** Imagem04. Amostragem e monitoração são preferências do perfil, com reinício explícito. Monitoração é texto livre nesta cadeia; não há descoberta de devices nessa tela. A proposta não inventa dropdown nem muda validação Native.
5. **Engrenagem do Replay — destino existe, vista não era distinta.** Imagem05. A URL view=settings só mudava título/abria áudio. A âncora caía no meio do console, ainda com MARK IN/OUT, players, eventos e NO AR. Não era um404; era uma vista de configuração incompleta.
6. **Áudio simplificado em draft — divisão visível melhorou.** Imagem06. Tarefas no topo; fonte/AFV/mute primeiro. Processamento e roteamento avançado ficam em details. Todos os IDs, campos e ações existentes permanecem.
7. **Configuração distinta do Replay em draft — divisão visível confirmada.** Imagens07/08. Câmeras, retenção e áudio ficam na configuração; players, histórico, lances e NO AR são ocultos nessa vista. Imagem07 precede a ressalva de REC e pré-requisitos de alinhamento; imagem08 inclui essas ressalvas.
8. **Operação reorganizada em draft — sequência e readiness visíveis confirmados.** Imagens09/10. Preparar→histórico→capturar→lances→players. Imagem09 preserva o NO AR vazio habilitado antes do ajuste. Imagem10 mostra NO AR vazio desabilitado; o helper deriva prontidão do player selecionado conforme contrato real, sem afirmar entrada Native confirmada.
9. **Links do formato global de áudio — falha visual preservada e correção local preparada.** Imagem11 preserva links azul-escuros ilegíveis sobre fundo escuro. O CSS existente de Settings tinha especificidade superior à regra compartilhada. O draft acrescenta regra por ID, cor clara, hover e foco visível; contraste das duas paletas passou em teste finito. Imagem13 final capturada pelo coordenador e revista por ambos os agentes: links claros e legíveis. A imagem11 permanece como evidência da falha anterior. Hover/foco têm prova CSS/DOM/contraste; não se infere captura de todos os estados interativos da imagem13.
10. **Configuração final de Replay — divisão e limites reafirmados.** Imagem12 mantém configuração sem players/NO AR e separa restrição de REC parado dos controles de reprodução. Não comprova execução de áudio ou REC.

As imagens01–13 são evidência atual da rodada, com dados simulados e motor ausente. Demonstram disposição e navegação; não demonstram som, latência, execução Native, foco/z-order de janelas, teclado de todo o produto ou conformidade acessível completa.

## Mudança concreta preparada: cinco arquivos

- audio.html: links por tarefa, processamento e roteamento avançado recolhidos; AFV/mute/estado mantidos no início.
- replay.html: grupos explícitos configuração/operação, cabeçalhos do fluxo e controles preservados.
- settings.html: links para áudio das entradas/saídas e Calls quando a categoria global áudio é selecionada.
- menus-tarefas-ui.js: apenas navegação, abertura de details, ordem dos nós e readiness derivado do estado já fornecido. Sem fetch, transportes ou comandos novos.
- menus-tarefas-ui.css: estilo limitado aos três documentos, mesma família existente, foco visível e adaptação estreita. Não altera estilo da mesa/Calls/SRT/Multi.

Engines settings.js/settings-help.js/audio.js/audio-buses.js/replay.js continuam byte a byte iguais aos baselines servidos. Canonical, obs-vmix, API, Native, Git e pacote não foram editados.

Readiness usa o contrato existente replay-disco.mjs:622/627: player selecionado com eventId/cam/file e metadataProbed/hasVideo verdadeiros. Não depende de um item ainda aparecer na lista de eventos, pois a exclusão da lista não descarrega o player. O backend continua verificando arquivo/configuração/probe antes de levar ao ar. Readiness não afirma transmissão confirmada. Voltar ao vivo só é desabilitado quando program é conhecido e não é REPLAY A/B/C/D; estado desconhecido não é tratado como confirmação. Snapshot antigo/incompleto exige recarregar o lance; isso deve ser conferido na próxima prova instalada.

Configuração: câmeras, retenção e fonte do áudio gravado exigem REC parado; volume/silêncio são reprodução. Alinhar pelo áudio comum exige carregar o mesmo lance e vincular players no console de operação. O link leva aos controles existentes; a configuração não inventa alinhamento automático.

## Mapa factual: dono, formulário e encaminhamento

| Entrada | Destino / implementação | Tipo real | Pendência / proposta |
|---|---|---|---|
| Configurar / settings / config | /settings, settings.js | Formulário global com categorias | Manter vídeo/áudio global/opções antes de recursos avançados; links por tarefa preparados. Não repetir gravação/saídas no menu global. |
| Atalhos / Automação / Recuperação dentro Settings | iframe /atalhos, /macros, /recuperacao | Editor real separado, embutido | Aplicar da janela externa fica desabilitado; editor interno salva. Explicar que o dono é o editor mostrado. |
| Ferramentas de plugins / Editor completo | settings_plugin_open / settings_native | Pedido de janela Native | ACK não prova visibilidade/foco. Texto atual “abertas” merece “solicitadas no motor”. Nenhum hack always-on-top. Sem captura Native nesta auditoria. |
| Engrenagem Gravar | /settings?category=recording&context=recording | Formulário de gravação principal | Preservar dono na engrenagem. Não redrafted nesta frente. |
| Engrenagem MultiGravação | /iso | Formulário ISO | Preservar seleção/arquivos neste dono; não confundir com REC de Replay. Não redrafted. |
| Engrenagem Externo | /saidas?context=external | Central real já tratada | HDR futuros ficam fora deste draft. |
| Botão Externo na mesa | A.external → ToggleVirtualCam | Ação imediata da câmera virtual | Mesmo nome tem semântica diferente da engrenagem. Root precisa decidir se botão passa a abrir central e câmera virtual vira ação explícita nela; não editar aqui. |
| Transmitir / engrenagem | /saidas?context=streaming | Encaminhamento ao MultiStream já tratado | Preservar dono; não repetir SRT/NDI neste menu. |
| Áudio global Settings | categoria audio → nativePreferences | Formato/preferências, reinício | Não substitui mixer, AFV, rotas nem retorno. |
| Áudio de uma fonte | /audio?input=... | AFV/mute/atraso/filtros e roteamento real | Draft simplifica descoberta; não altera semântica. |
| Mixer / busman | mesa popup / barramentos M/A/B/trilhas | Matriz de envio com mudanças imediatas | Não chamar submix independente e matriz de trilhas pelo mesmo nome. Não consolidar engines diferentes sem contrato. |
| Retorno / talkback novo | /calls | Editor individual já tratado | Draft só oferece link. Não promete seletividade do legado Bus B. |
| Link de convidado via menu da entrada | calllink → popup call → retorno B/câmera virtual | Fluxo legado paralelo | Duplicação residual factual. Encaminhar ao dono Calls ou explicar legado; root decide, mesa intacta. Não adicionar N-1 paralelo. |
| Replay principal | /replay | Console real, /api/replay | Draft reorganiza preparação, busca, salvamento e reprodução. |
| Engrenagem Replay | /replay?view=settings#replay-config | Antes console inteiro; draft vista específica | Sem mudança de endpoint/motor, apenas grupos visíveis. |
| Replay legado Native menu pop=replay | mesa.html?pop=replay → location.replace /replay | Redirect | Destino existente. Sem prova da abertura Native nesta rodada. |

Não foi comprovado404 nas rotas locais dessa tabela. Existe quebra semântica no Replay settings e semântica divergente Externo/engrenagem; há também risco de serviço indisponível em launchPanel (health guard), que não é uma rota ausente. A prévia própria não serve todos os editores de ponta a ponta e não deve ser usada para atribuir404 ao produto.

## Ordem familiar, sem copiar promessas do vMix

O [guia oficial Settings](https://www.vmix.com/help29/Settings.html) separa Display, Outputs, Options, Performance, Recording, External Output, Audio e Audio Outputs; isso sustenta separação entre formato global, envio e operação. A gravação/saída continuam donas de suas engrenagens conforme pedido do usuário.

O [guia oficial Audio Outputs](https://www.vmix.com/help29/AudioOutputs.html) distingue Master, Headphones e mixes auxiliares. No FreeMix, matriz M/A/B, submix independente, WASAPI e ASIO têm contratos distintos; a navegação proposta explica as tarefas sem prometer equivalência de canais/driver.

O [guia oficial de início do Replay](https://www.vmix.com/help29/GettingStarted1.html) começa por câmeras, configuração de gravação e áudio, e permite voltar à configuração pela engrenagem do controlador. A proposta aplica essa sequência ao contrato realmente existente do FreeMix. Não incorpora armazenamento/formatos/transições ou funcionalidades ausentes apenas porque existem no vMix.

## Verificação e integração

45 contratos do helper HTML/DOM/VM (incluindo contraste normal/hover/foco): preservação IDs/handlers/scripts, ordem, links, views, details, seleção de players e readiness. Dez contratos settings.js real em VM; total55 PASS: choices reais, fração FPS, defaults sem aplicar, dirty/confirm, busca, import inválido/válido, cancel, apply seletivo e categoria ausente. Os dois FAIL de harness foram preservados (rotas CSS tratadas como páginas; dataset não refletido em atributos no DOM finito) e corrigidos na própria QA. Não houve patch de produto para eles.

Após review, Root pode integrar exatamente os cinco arquivos com preflight de hashes. Referências nos3HTML adicionam os2helpers locais à closure. API/engines não mudam. Próxima prova instalada deve abrir as duas vistas Replay, selecionar A/B/C/D/carregar um lance, verificar enable/disable sem modificar escolha/autoplay, REC/retention/áudio e retorno de Calls existentes, fechar normal. Validar largura/DPI/teclado adicionais, device físico e visual da janela Native continua separado.

### Primeiro uso proposto

1. Abra Configurações→Vídeo e confira quadro/FPS; aplique fora do ar quando necessário.
2. Abra Áudio das entradas, selecione a fonte e defina AFV ou mute manual. Formato do projeto e retorno das Calls têm links próprios.
3. Abra engrenagem Replay, escolha câmeras/áudio gravado/retention com REC parado.
4. Abra Operar Replay e inicie REC. Histórico é prévia fora do Programa; marque IN/OUT ali ou capture os últimos segundos.
5. Carregue o lance em um player e confira o estado. Selecione o player e use REPLAY NO AR. Voltar ao vivo solicita a volta pelo caminho existente do motor.

Nenhuma aprovação geral do produto é inferida dessas telas.
