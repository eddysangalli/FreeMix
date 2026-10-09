# Recuperação, automação e instalação local

Atualizado em 8 de outubro de 2026. Implementação e ensaios desta frente ocorreram em raízes temporárias, com dados sintéticos e portas exclusivas; a instalação do operador foi preservada.

## Configurações — evidência inicial, ampliada na raiz

Padrões, Importar e Exportar funcionam nas categorias suportadas da central: vídeo, gravação simples e transmissão simples. Padrões e Importar preparam um rascunho; somente Aplicar altera o perfil. Cancelar recarrega os valores do motor. Valores atuais e FPS racional são preservados, inclusive quando a opção atual não consta da lista padrão.

Exportação de transmissão omite endereço do servidor e credenciais. Importação recusa chaves, senhas, tokens e campos desconhecidos; Aplicar mantém o servidor e os segredos já configurados. Os modos avançados continuam acessíveis pelas configurações completas do OBS. Esses comandos não representam uma importação universal de todas as opções do OBS.

Evidências: `qa-portatil/resultado-settings-transfer.json` (10 verificações) e `resultado-settings-transfer-nativo.json` (5 verificações com motor real, sem iniciar transmissão). A tentativa visual adicional ficou indisponível porque o navegador da ferramenta não abriu; não foi declarada validação visual dessa revisão.

## Snapshots e recuperação

Snapshots `.fmx` versionados incluem coleção, perfil e metadados por produção: controle, dados, entradas, Calls, Replay, ISO, macros, saídas, fila, controladores e roteamento de áudio. A configuração `freemix-audio-routing` conserva AFV e atraso por UUID; filtros e parâmetros nativos também pertencem à coleção. Configuração de rede/bonding com segredos e configurações globais de dados ficam fora desse conjunto.

O snapshot é uma recuperação local do perfil e pode incluir credenciais de serviços já presentes nos seus arquivos. Ele não tem a mesma política de remoção de segredos do JSON da central Settings e não deve ser incluído no pacote público. O journal registra somente parâmetros operacionais permitidos.

O autosave pode capturar durante gravação; recuperação exige saídas paradas e cria outra produção, sem substituir a original. Opcionalmente cria outro perfil. Hashes, manifesto e caminhos são conferidos antes da recuperação. Gatilhos de macros ficam desativados na cópia e filtros de gravação não retomam automaticamente. A configuração de AFV recuperada conserva a escolha do projeto e volta a observar o tally quando essa cópia for aberta.

A inclusão de mídias cobre arquivos e pastas explicitamente referenciados e recursos relativos de HTML/CSS, com limite de 1000 arquivos/2 GB. Dispositivos, plugins, fontes, páginas remotas, scripts dinâmicos e todas as dependências implícitas não são recriados universalmente.

O marcador de sessão diferencia reinício da API com o mesmo motor, troca de motor e encerramento normal. Relatório de crash posterior também pode tornar recuperável uma sessão marcada como encerrada. Há retenção de autosaves e preservação de cópias manuais e do candidato de recuperação.

Evidências: `resultado-automacao-recuperacao-avancada.json` (23 verificações), `resultado-automacao-recuperacao-nativa.json` (12), `resultado-recuperacao-audio-routing.json` (4). O teste de áudio verifica snapshot/load e corrupção no filesystem com motor simulado; essa adição não recebeu outro ensaio nativo completo.

## Journal após o snapshot

Ações operacionais confirmadas pela API, macros e controladores recebem registros com cadeia de hashes. A recuperação pode apresentar um plano e, mediante opção explícita, reaplicar Preview, Programa/corte/transição, overlays, mute, volume, barramentos e transporte de mídia na nova cópia. Ações de controladores são resolvidas para o alvo salvo, sem repetir wrappers nem parâmetros privados.

O plano exige checkpoint correspondente, UUIDs válidos e cadeia íntegra. Uma alteração não suportada após o snapshot bloqueia esse replay antes de criar a cópia; ainda é possível recuperar somente o snapshot. Journal truncado ou adulterado também é recusado. Não retoma transmissões, gravação, microfone privado, conexões externas ou alterações arbitrárias em arquivos/configurações. Edições nativas não registradas na API não constituem um histórico completo.

Evidências: `resultado-journal-replay.json` (8 verificações), `resultado-journal-replay-nativo.json` (5) e `resultado-journal-origens-nativo.json` (3). O ensaio nativo confirmou Preview/volume recuperados e o arquivo original preservado byte a byte.

## Macros e controladores

Macros persistem por produção, com ações permitidas, pausas, condições, cancelamento, gravação de ações e gatilhos com debounce/cooldown e proteção contra repetição. A restauração opcional do Preview em falha respeita alteração manual do operador; Programa e saídas não sofrem rollback automático.

Atalhos de teclado e MIDI usam UUIDs e ações autorizadas, com feedback do estado observado. Talkback momentâneo fecha ao soltar a tecla/botão, perder foco, desconectar cliente/dispositivo ou expirar o prazo de retenção. MIDI Learn requer permissão WebMIDI. Hardware MIDI físico, Stream Deck/Companion e interoperabilidade desses dispositivos não foram homologados nesta frente.

Evidências: `resultado-controladores-avancados.json` (14 verificações), `resultado-controladores-nativos.json` (6), `resultado-controladores-ui.json` (5) e capturas da central. Eventos Calls usam a evidência de peer de retorno conectado; isso não comprova audição humana pela internet.

## Instalador offline

`INSTALAR-FREEMIX.cmd` funciona na raiz do workspace e na pasta de um payload completo extraído. Exemplo:

```text
INSTALAR-FREEMIX.cmd --source "D:\Pacote\FreeMix" --dest "D:\FreeMix-Novo" --check
INSTALAR-FREEMIX.cmd --source "D:\Pacote\FreeMix" --dest "D:\FreeMix-Novo" --api-port 8088 --ws-port 4466
```

O formato aceito é `manifest.json` com `format: 2`, `kind: "freemix-portable-full"`, versão e lista completa de hashes/tamanhos, acompanhado de `manifest.sig` Ed25519. A chave pública confiável vem da instalação que executa o instalador; não há opção CLI para trocar essa chave. O payload também precisa ter a mesma chave pública e uma configuração inicial sanitizada.

Antes de copiar, o instalador confere assinatura, arquivos obrigatórios, todos os hashes/tamanhos, arquivos extras, caminhos ambíguos, links/junções, pastas aninhadas e destino. Aceita somente destino novo ou completamente vazio. Usa pasta de preparação e não sobrescreve uma instalação existente. Configura os caminhos e gera senha nova do motor por instalação. Não abre o aplicativo.

`--check` não cria destino nem inicia API/motor. Firewall não é aplicado por padrão. Somente `--firewall` junto de `--control-lan`, `--ndi` e/ou `--omt` chama o configurador nativo após instalação e solicita elevação do Windows. As regras são específicas da instalação, rede privada e sub-rede local. Não suprime globalmente a segurança do Windows, não instala runtime NDI nem substitui drivers.

Evidência desta frente: `resultado-instalador-offline.json`, 21 verificações com fixture completa sintética assinada, sem execução de aplicativo ou firewall. A verificação do payload real empacotado pertence à entrega final da raiz. Não foi criado um instalador MSI, serviço, mecanismo de atualização online ou distribuição pública nesta frente. Em falha excepcional de preparação depois da cópia, a pasta nova fica identificada com erro; a instalação do operador continua preservada.

Os receipts citados estão em `qa-portatil` no workspace; a raiz mantém o registro final de entrega e pendências gerais.


## Ampliação de dependências e replay — rodada seguinte de 8/10

O coletor inclui referências literais estáticas transitivas de HTML/CSS/JavaScript: scripts, imports/exports, require com caminho explícito, fetch local literal, new URL relativo a import.meta.url, CSS import/url e arquivos de webfonts. Mantém caminhos relativos no bundle. Limites: 1000 arquivos/2 GB, textos de até 2 MB e 24 níveis transitivos. Referência local declarada mas ausente ou que escape da pasta permitida bloqueia a cópia completa de mídia. Referências remotas, endpoints da API, módulos bare e expressões dinâmicas recebem diagnóstico, sem execução de código ou download. Não resolve bundlers/import maps, código calculado nem todas as construções sintáticas possíveis de JavaScript.

Os snapshots novos trazem inventário consultado do motor (versão, tipos de entrada/filtro), arquivos DLL de plugins com hashes, dispositivos configurados com consulta às opções disponíveis e nomes de famílias de fonte solicitadas. Lista os arquivos de fontes do Windows, porém não deduz correspondência de família pelo nome do arquivo. O botão de diagnóstico compara inventário de origem e computador atual, com erro explícito quando uma consulta não está disponível. Não reinstala plugins, drivers ou fontes. Hashes de plugins são reaproveitados durante a sessão enquanto tamanho/data do arquivo não mudam, para não ler DLLs grandes em cada autosave.

Journal/macros/controladores aceitam também alterações de slots, geometria, estilo, máscara, visibilidade/bloqueio, categorias, âncoras horizontais/verticais, GC lower/score e AFV/mute/atraso de fonte pública. A validação preserva UUIDs e recusa campos não suportados, slots ausentes, polígonos inválidos e microfone privado. Criação de variantes, enquadramento automático do locutor e comandos de saídas/mixes continuam sendo lacunas explícitas no replay, em vez de executar uma aproximação. Máscaras e âncoras foram validadas por normalização nesta frente; a prova nativa abaixo cobre geometria/GC/delay/AFV. Assets explícitos image_path/file de máscaras e sombras entram no coletor de dependências da coleção.

Há protocolo genérico FreeMix HTTP control v1 para mapear botões Companion, Stream Deck ou XKeys: controller_adapter_read fornece receitas de press/release/heartbeat dos bindings salvos; controller_adapter_fire aceita somente nome do adaptador, ID salvo, fase e UUID do cliente. Não recebe uma ação arbitrária do dispositivo. Feedback vem do estado da produção. Não é módulo oficial Companion, plugin Stream Deck, driver XKeys nem comprovação física de esses equipamentos. Talkback exige release e heartbeat, com o watchdog existente.

O seletor de hotkeys conserva trigger.global e mostra diagnóstico de suporte nativo. Com state.globalHotkeys.available verdadeiro, o navegador deixa a tecla global para a ponte nativa, evitando acionamento duplo. O código nativo e o ensaio de teclas globais pertencem à frente da raiz; esta frente validou persistência/normalização e prevenção de duplicata física entre foco/global.

Evidências desta rodada: resultado-recuperacao-transitiva.json (fixture curta), resultado-recuperacao-transitiva-nativa.json (5 verificações, uma sessão privada WS14479/API18104) e resultado-recuperacao-transitiva-encerrada.json (QA salva/fechada, operador intacto). O ensaio nativo reaplicou geometria de composição, GC, atraso e AFV, confirmou inclusão de JS/webfont e inventário consultado, e não iniciou transmissão/gravação/retorno/talkback. O conteúdo operacional da produção original permaneceu igual; o motor reordenou apenas sua serialização do array de transições, portanto esse novo ensaio não afirma bytes idênticos. O arquivo de fonte da fixture é somente dependência sintética: renderização de fonte não foi homologada.

## Integração final da raiz nesta rodada

A central agora inclui 31 preferências tipadas em cinco categorias adicionais, com Padrões/Importar/Exportar/Aplicar e readback nativo. Exigem reinício. Editor original continua acessível; não há migração universal. Hotkeys globais foram registradas no motor e acionadas pela API nativa, com eventos down/up e troca real de Preview; tecla física/background fica para a rodada humana. Evidências: resultado-hotkeys-preferencias-nativo.json e resultado-settings-nativas-ui.json.

## Biblioteca GC e fundo no journal — rodada de 08/10

Macros, controladores e replay pós-snapshot aceitam `gc_library_save` somente com ID de título já salvo, `gc_library_prepare`, `gc_library_air` e `input_background` por cor ou entrada já existente. O plano lê o namespace GC do snapshot, preserva IDs e valida modelo/campos antes de aplicar na produção recuperada. O editor de macros oferece seleção do título e chave colocar/retirar do ar; a edição avançada preenche JSON com os campos atuais. Objetos JSON inválidos, `null` em campos GC, texto representado por objeto, número representado por texto, campos desconhecidos, IDs/fonte ausentes e imagem nova são recusados.

A restauração força somente na nova cópia os namespaces ADV para `active=false/startup_behavior=2/autoStartEvent=0` e captions para `enabled=false`; regras da produção original são preservadas. Ela não ativa automações de plugin ou reconhecimento Google. Criação de títulos/composições/variantes, locutor automático, imagem nova e comandos de saídas/mixes continuam exigindo snapshot ou execução posterior explícita; não são simulados pelo replay.

Evidências: `qa-portatil/resultado-journal-gc-logica.json` (quatro ações válidas e dez recusas), `resultado-journal-gc-nativo.json` (macro real de quatro passos, plano íntegro, restauração em nova produção), `resultado-journal-gc-encerrada.json` (apenas QA fechada). A sessão exclusiva WS14479/API18104 confirmou título editado no CEF pelo readback da URL, overlay pelo estado real e fundo pelo metadado da composição recuperada; nenhuma gravação/transmissão/retorno/talkback começou. Nesse ensaio específico, o arquivo original permaneceu byte a byte idêntico durante a recuperação. Não foi reexecutada a bateria completa da galeria ou dos plugins.

## Estados confirmados após o snapshot — implementação ampliada

As lacunas de criação de composição/GC, variantes, imagens novas e configuração de saídas descritas acima foram ampliadas por registros de estado da produção. Após uma ação confirmada que não tem replay determinístico, o journal guarda o ID de um snapshot local completo com mídia e hashes, preservando os UUIDs gerados. A recuperação seleciona o último estado íntegro posterior ao snapshot escolhido e aplica somente os deltas operacionais que ocorreram depois dele. Não reexecuta uma criação com UUID diferente nem finge reproduzir um comando externo. O candidato pós-crash aponta para o último estado persistido. Esses estados entram na retenção junto aos autosaves; cópias manuais continuam preservadas.

Cobertura: criar/duplicar/remover/variar composições, fundo com imagem local, templates/reordenação/undo, configuração do locutor; criar/importar/duplicar/remover/variar/desvincular GC; configurações e perfis de saídas, macros e controladores. Imagens/fontes GC são inventariadas por token SHA256 no diretório próprio e restauradas sem sobrescrever conteúdo existente divergente. Locutor automático, gatilhos de macros e controladores permanecem desligados na cópia. Um erro de captura fica registrado como lacuna; uma operação externa como iniciar transmissão não deixa de ser lacuna só porque depois houve um estado completo.

Destinos e Mixes nativos são globais ao perfil OBS. Para recuperar suas configurações, o estado arquiva o perfil e parâmetros consultados no motor. A recuperação cria obrigatoriamente um perfil separado, inclusive se a opção geral de restaurar perfil estiver desmarcada; não altera a configuração global do perfil original. Aplica `set_destinations` somente ocioso, com `enabled=false/autoStart=false`, preserva UUID de conteúdo, resolução, encoder, áudio e demais parâmetros. Mixes são recuperados pelo arquivo do novo perfil; não dispara start/take. Configuração de saída externa via `FREEMIX_OUTPUT_CONFIG` requer tratamento manual e é recusada pelo guard disponível nesta integração.

O campo de mapeamento permite substituir uma dependência já declarada por outro arquivo/pasta local existente. Recusa referências desconhecidas, UNC, symlinks e JSON inválido. Mídias incluídas no estado são remapeadas automaticamente para a cópia com hashes verificados. Código remoto/calculado, import maps/bundlers, arquivos ausentes sem substituição fornecida, plugins/fontes de sistema/drivers/dispositivos e edições nativas fora dos hooks da API continuam sem reconstrução universal. O limite de mídia permanece 2 GB/1000 arquivos; estados com mídia podem consumir espaço e atrasar a conclusão da ação enquanto são salvos. Dependências ausentes continuam visíveis no diagnóstico e resultado; não há promessa de mídia inexistente recuperada.

Evidências desta implementação: `resultado-journal-estados-nativo.json` (3 verificações: composição+GC+imagem criados depois do snapshot, original e asset apagados no teste, UUID/campos/remapeamento reais recuperados); `resultado-recovery-saidas-nativo.json` (2: destino por UUID com 640×360/barramento A e Mix 3 640×360, perfil original preservado, nenhuma saída iniciada); `resultado-recovery-estados-logica.json` (4: lacunas externas preservadas, asset GC por hash, mapeamento conhecido/local e automações desativadas); `resultado-recovery-estados-ui.json` (3 verificações de contrato DOM, sem aprovação visual); `resultado-recovery-estados-encerrada.json` (apenas QA privada fechada). A primeira comparação de bytes da coleção falhou por ordem de propriedades gerada pelo OBS e foi preservada em `resultado-journal-estados-nativo-serializacao.json`; a comparação JSON semântica passou. O arquivo original de destinos permaneceu byte idêntico. Esta prova não deve ser confundida com preservação universal de serialização OBS nem teste de scripts externos.
