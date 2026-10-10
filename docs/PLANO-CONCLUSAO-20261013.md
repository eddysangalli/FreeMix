# FreeMix — execução autorizada até terça-feira, 13/10/2026

## Estado ativo após o ensaio instalado QR45

O instalador selecionado continua000500. QR45 NÃO foi aprovado: importação e preparação passaram; QR inicial e atualização UTF-8 foram decodificados no CEF real após esperar a carga antes de ativar. A recuperação com mídia falhou porque o scanner interpreta require(./utils) interno ao encoder autocontido como arquivo externo. Não chegou ao restore. As falhas anteriores de ativação imediata e os recibos permanecem preservados; nenhuma mesa foi substituída.

O scanner de dependências foi corrigido no Git2a58feb, com33 verificações locais. A primeira ativação/recarga e ON/OFF passaram no CEF Native real, com QR decodificado; patch obs-browser dd26fda e Native500ced5 compilado/freeze2085 arquivos. Export22patches e reconstrução real das árvores do pai/plugin passaram em clone próprio com bases oficiais locais. O novo candidato031500 está em preparação, sem aprovação instalada. HTTPS local passou50 verificações TLS/assinatura/download, sem mudança no produto nem publicação. Recuperação QR/ticker pela API/CEF instalada ainda exige o próximo candidato. Transportes integra fontes/reconstrução do submódulo; Installer prepara QA instalada; Auditoria prepara SRT HDR opaco em draft isolado.000500 permanece selecionado.010000 teve apenas preflight; QR45 rejeitado está arquivado com hashes preservados em archived/candidato-rejeitado-20261010004500. Nenhuma mesa foi substituída.

Ticker2D está no Git f2683e2f603ecf26fcc650da157ed385a4f47a54, com30checks próprios/46QR/33formas; API/CEF/recuperação instalada do ticker ainda faltam. TypeAdd/fila/unidadeSpeed permanecem limitações explícitas. QR45 encerrou Native/API próprios cooperativamente com contador[0] e zero crash, sem alterar seu conteúdo selado. Referências: package-native-startup-045000-qr-fail-allowlist.json e native21-qr045000-retry3/failure-report.json em qa-finalizacao.

---

Registros anteriores, com seus limites e datas:


O usuário autorizou implementar todas as pendências do chat com subagentes enquanto viaja. Este registro orienta as próximas execuções. Não é uma declaração de entrega pronta. A referência inicial é AUDITORIA-PENDENCIAS-20261009.md, complementada pelos pedidos de timeline contínua e entradas/autoplay do Replay.

## Objetivo e restrições

Entregar código integrado no GitHub, instalador/pacote local atualizados e evidência por requisito. Preservar mesa, gravações, mídia, configurações e processos do operador; raízes/portas isoladas para testes; releases seladas imutáveis. Não publicar nem enviar dados externos. O receptor alpha WebBrowser foi abortado por desempenho e não deve ser retomado. Logs ficam em ZIP local para envio manual pelo beta.

Não confundir implementação, teste simulado, ensaio nativo local e homologação física/externa. Não marcar objetivo concluído por atingir terça-feira. A falta de equipamento/acesso precisa indicar exatamente o ensaio e os recursos necessários; não elimina trabalho implementável.

## Frentes e donos dos arquivos

1. **auditoria_pendencias_reais (agora implementação Replay):** replay-*.mjs, remoto/replay.js/html e QA própria. Histórico contínuo com vídeo/áudio, timeline automática, seeks e IN/OUT, quatro players e medição de custo/PTS. Root integra HTTP /api/replay-preview/<token> com GET/HEAD/Range autenticado. Não editar centrais, mesa, Git mirror, instalador ou operador.
2. **installer_exe:** scripts/installer-windows, iniciar-freemix/api, preparar/instalar-portatil, recuperacao-*, diagnostico-producao/zip, settings*/recuperacao*/diagnosticos*/studio-dialog.css. Migração .fmx offline explícita e opt-in para coleção nova, mídia verificada, credenciais novas, zero autostart; desinstalador só de arquivos próprios imutáveis verificados, preservando dados e alterados; responsividade/descrições; ZIP sanitizado. Não selar release final antes da integração.
3. **transportes_rede_conclusao:** Native multistream e transportes/NDI/OMT/SDI/SRT; ferramentas e telas saídas/rede. Estabilidade, múltiplos senders, alpha/áudio, reconexão, receptor nativo separado SRT→NDI/OMT para uma entrada vMix, contratos HDR, bonding/FEC/NACK e kits HTTPS/TURN. Não fazer build compartilhado nem deployment externo.
4. **Root:** servidor-api, controle-producao, mesa, empacotar-limpo, integração/commits/build final; áudio/ASIO/Direct Out e N-1; composições H/V/GTZIP, macros/controladores, efeitos/legendas. Pode redistribuir essas tarefas a um agente ao encerrar uma frente. Arquivos compartilhados são integrados em série.

## Lista de aceite

| Requisito | Próximo resultado verificável |
|---|---|
| Replay completo | Assistir à gravação com vídeo/áudio, timeline atualizando durante REC, escolher pontos antigos, criar lance em todos os ângulos sem parar REC nem alterar Programa; medir prévia/seek. |
| Instalação e atualização | Novo EXE com correções posteriores à build 153453, migração opt-in, atualização/rollback, desinstalação preservando projetos, teste de caminhos/portas, fontes correspondentes. |
| Menus e branding | Telas acessíveis, sem duplicar configurações operacionais; descrições; matriz de resoluções/DPI; FreeMix nas superfícies do produto, preservadas atribuições/licenças. |
| Recuperação | Alterações de composição/título/mídia/saída após snapshot recuperadas e dependências ausentes diagnosticadas; esclarecer janela de persistência e zero autostart. |
| Áudio | Buses independentes além de M/A/B, rotas reais; esclarecer captura ASIO versus playback ASIO e implementar saídas suportadas; N-1/talkback sem Master, watchdog/reconexão. |
| Transportes | Origem/conexão persistem, múltiplos envios independentes, Fill/Key/alpha/áudio, recuperação de queda, contratos HDR reais. |
| Alpha em uma entrada vMix | Receptor nativo separado, vídeo pós-chroma arbitrário, recomposição Fill/Key com mesmo PTS e áudio, saída NDI/OMT; performance medida. |
| Composições/GC | Vínculo H/V propaga conteúdo/dados mantendo geometrias próprias, desfazer/recuperação; GTZIP suportados enumerados com alertas de nós ausentes; assets/fontes e sinal congelado. |
| Replay multicâmera | Offsets/referência comum, áudio exclusivo, drift e VFR/taxas incompatíveis tratados; não afirmar genlock físico. |
| Macros/controladores | Ações/eventos e feedback de estado, reconexão sem duplicação; separar simulador de dispositivo físico. |
| Efeitos/legendas | Blur e XYZ/tracking com material representativo; reconhecimento operacional em português com qualidade/carga medidas. |
| Rede/distribuição | Bonding com perdas/falha/roteamento, FEC/NACK e mídia decodificada; kit HTTPS/TURN/receptor pronto, WAN apenas com infraestrutura e conexões reais disponíveis. |
| Logs beta | Botão/CMD ZIP local completo e sanitizado, com versão, identificação de máquina, logs/crashes/dependências; sem upload automático. |

## Estado inicial desta rodada

Git produto: feat/native-menus-config-screens, 6de1000. Build instalada/pacote selado: 153453, ainda anterior às correções de Replay e algumas telas. Timeline atual é JPEG por quadro e atualização manual; a reprodução contínua do histórico e crescimento automático são pendências concretas. A/B/autoplay já foram corrigidos e testados; validar com o novo fluxo. O serviço foi atualizado após encerramento da Call e manteve REC na mesma sessão, com arquivo crescendo; a mesa carrega a interface nova na abertura normal. Não reiniciar motor/serviço do operador quando houver Calls/saídas/REC ativos sem uma janela autorizada.

Atualizar este documento com entregas e evidências ao integrar cada frente. Registrar requisitos externos que não puderem ser executados; não reciclar os relatórios antigos como se validassem a nova build.

## Progresso verificado — 09/10, rodada atual

- Prévia Replay HTTP integrada pelo root: GET/HEAD/Range local e autenticado, lease liberada em término/cancelamento/erro/HEAD/416. Treze verificações HTTP reais em porta efêmera (`resultado-replay-preview-http.json`). Player contínuo ainda em testes do agente; não selado nem aplicado no operador.
- Composições H/V: contrato de conteúdo existente identificado, corrigida propagação indevida de Fit/Fill, adicionado desfazer de conteúdo por sessão e indicação de vínculo. Seis regressões + sete verificações no motor real isolado, detalhes em COMPOSICOES-HV-20261009.md. Isso resolve conteúdo/fontes/fundo e preserva geometria; não propaga toda edição de layout.
- Build Native `obs-studio` terminou exit 0, EXE SHA-256 `09ae2e0f2c72df7e4245df2cb616ba3ede281fe28eb9dc2a6cde0e9b91df105e`. Alterações de transportes ainda em QA dirigida pelo agente. Não copiado para operador nem selado em entrega.
- ASIO de saída: SDK oficial 2.3.4 obtido por `https://www.steinberg.net/asiosdk`, redirecionamento `https://download.steinberg.net/sdk_downloads/ASIO-SDK_2.3.4_2025-10-15.zip`, SHA-256 `d5ebf0c20dd2c5f43771fd0c1418f4b361bf52434ee670097cfa6b3a335e2eca`. Fontes locais em downloads/asio-sdk-official/source/ASIOSDK; licença oferece GPLv3. Playback multicanal ainda por implementar; obter SDK não conclui áudio.

## Integrações posteriores — 09/10, 18h05

- **Replay contínuo:** SourceRecord real com duas câmeras, histórico de 6,32 para 9,82 segundos, prévia preparada em 356 ms, IN/OUT dos dois ângulos sem parar REC ou mudar Programa. Fontes, HTTP, interface e QA no Git `9f94659`.
- **Transportes:** cor Fill sem premultiplicação duplicada, Key silenciosa, reconexão NDI/OMT com áudio de 440 Hz e fontes da ponte nativa SRT→NDI no Git `205af12`. A rejeição explícita de HDR não suportado está em `41508d8`. HDR OMT P216 PQ/HLG passou no receptor real do SDK: 190/187 quadros, gradiente com 765/766 níveis, PCM e PTS monotônicos. Enumeração das fontes HDR e quatro emissores ainda em integração. Envio HDR por NDI depende do Advanced SDK licenciado.
- **ASIO playback:** mock IASIO com 16 formatos, oito rotas e 16 canais; dez mil callbacks sem alocação em tempo real. Build nativa exit 0. Vendor real enumerou quatro drivers sem abrir dispositivos; integração no Git `12cf444`. Playback em hardware físico ainda não homologado.
- **Distribuição e recuperação:** trinta fontes e sete recibos integrados no Git `3e6a1dc`. Importação online passou no motor real: título, UUID, 4:4:4 e alpha packed preservados em perfil/coleção novos, com saídas desligadas. Instalador final ainda não foi gerado.
- **Adicionar títulos:** dezesseis combinações de resolução/DPI passaram, com rodapé na base e formulário ocupando a altura disponível. Screenshot inspecionado. A matriz de distribuição tem outras 36 combinações em três telas.
- **Legendas em português:** sete expressões reconhecidas na fala sintética Windows Maria; primeiro texto em 501 ms. LocalVocal foi recompilado em QA; cancelar a inferência liberou a thread em 19 ms. A suíte completa revelou outro bloqueio no advanced-scene-switcher. Não declarar todo o fechamento corrigido até concluir esse cenário.
- **Donos atuais:** auditoria_pendencias_reais trata o fechamento das extensões; installer_exe amplia GTZIP, grupos, transformações, animações e fontes; transportes_rede_conclusao integra HDR OMT nativo/SDK/interface. Root integra fontes, pacote, builds e QA.
- Mesa e gravações do operador preservadas. Novos binários não foram ativados na instalação de uso. Goal e heartbeat continuam ativos; a conclusão de todos os requisitos ainda não foi declarada.

## Integração em 2026-10-09T21:30:58.826Z

Native final: commit 99e5944cf61aacc4c07167ef867d4ce52a752ae6; EXE 1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744. Catorze patches foram aplicados em índice separado e produziram a mesma árvore do HEAD. Não publicado no upstream OBS.

GTZIP congelado: 21 fontes e três recibos hash-verificados espelhados; recuperação .fmx com HTML/imagem/fonte livre/campos passou no Native final sem originais, zero saídas e saída 0. Fonte gtzip-runtime é autocontida em cada título; o FAIL anterior de dependência fora da pasta foi preservado.

LocalVocal e dois DLLs SceneSwitcher têm patches, fontes oficiais, licenças e receitas reproduzidas. Suíte completa com NDI fechou normalmente em 876/892 ms. Entrarão apenas no pacote novo, sem sobrescrever operador. Packager agora calcula fechamento de 97 módulos, inclui NDI pinado e aceita overlays explícitos de plugins por SHA-256.

Donos atuais: auditoria_pendencias_reais executa Replay/CEF20min; transportes_rede_conclusao executa ponte Native alpha20min; installer_exe corrige reconexão/feedback/releases de controladores e verifica24 casosUI. Root prepara selagem, instalador e integração final. Ensaios interrompidos por falhas de isolamento/instrumentação são preservados como FAIL, não resultados de mídia homologados.

## Integração em 2026-10-09T21:57:17.226Z

Native99e5944/EXE1c045e5d e 14 patches reproduzíveis no candidato213415. ReplayCEF20min e ponte nativa alpha20min concluídos; falhas de isolamento/instrumentação preservadas. auditoria_pendencias_reais mede alinhamento multicâmera; transportes_rede_conclusao implementa SDIHDR; installer_exe confere o EXE selado, duas instalações reais, importação/ZIP e desinstalação. Root faz início completo pelo launcher instalado, selagem e Git. Ponte permanece beta separada, sem inclusão automática no instalador.

## Conferência posterior ao instalador 213415

Estado em 2026-10-09T22:41:31.392Z. A entrega instalável continua sendo 213415, já verificada; as alterações seguintes pertencem às fontes e ensaios da próxima versão. A série Native e seus snapshots foram verificados por árvore. Isso não publica o fork no upstream OBS.

- SDI HDR: implementação, compilação/link e seis guards negativos passaram em raiz isolada. O plugin não inicializou por falta de iterator/driver nesta máquina; capabilities de uma placa e sinal físico permanecem inconclusivos. SDR rotulado HDR, alpha/FillKey incompatíveis e dispositivo ausente foram recusados sem ativar saída. A mensagem agora distingue driver ausente e versão sem contrato; sua repetição no novo EXE está em andamento.
- Replay: reproduzidos drift visual A/B, salto após seek e falha de cue depois de EOF. Seek/relógio e restart off-air receberam correções compiladas. Opt-in de apresentação sem fila apenas para arquivos privados do Replay está em ensaio. Cursor igual não foi aceito como prova de quadros iguais: a matriz visual ainda registrou dois quadros de diferença. Não espelhar JS ainda sem allowlist final nem declarar sincronismo concluído.
- Estabilidade: três instalações TEMP com os mesmos 159 binários de 213415 reproduziram saldo de duas alocações: Native direto, launcher e Native+API. Fechamentos cooperativos em 727/761/709 ms, sem crashes/objetos restantes/double-destroy; exit0 capturado nos filhos diretos, launcher separado confirmado encerrado por PID/caminho. Isso não atribui o saldo ao launcher. Tamanhos, origem e crescimento seguem em investigação por instrumentação QA exclusiva.
- Fontes: exportação Native verifica a série completa em índice separado e compara a árvore ao HEAD antes de escrever snapshots. O builder exige ZIP e destino explícitos, preservando releases existentes. Logs brutos de QA não são publicados no Git.

Subagentes ativos: replay/áudio/VFR; regressão SRT e guards SDI; rastreamento isolado das alocações. Nenhuma sessão, gravação ou instalação do operador foi ativada/alterada.

## Integração Native21 — 2026-10-10T00:21:27.223Z

Estado operacional atual em CONTINUAR.md; os blocos acima são cronologia. Native4793d1a40f56ea9b6e887eb49189d937758e3b7f compilado/freeze2085arquivos;21 patches/187 snapshots reconstruídos para árvore7604633e921339aa65f40015dcc3175e26accfc7. Marca/privacidade OAuth e GTZIP Polygon/Path diretos integrados e enviados ao GitHub3737e79. Coletor149 verificações PASS; GTZIP33PASS.

Candidato000500:9563 arquivos assinados e hash-verificados, manifesto6fbf37845536e8b3a6478ec15274f5ce9f7bf14051e10703f2c197550f417619. ZIP/CRC/hashes PASS e EXEcd7529d9d9ebf2806b40252691d73c7f28d5dcf49aeeddcbf85ea2cd5c624798 gerado. Startup instalado Native21 PASS, NDI/buses/API prontos, noveHTML, fechamento773ms, contador0/crashes0 e processos próprios encerrados. Duas instalações/diagnósticos OAuth/importações/desinstalações ainda em execução antes da seleção. Candidato233334 PASS permanece histórico não selecionado e imutável.

## Master digital A/B/C/D — Native21

QA própria capturou mix0/track1 final, estéreo48k, em oito segmentos: ProgramaA/B/C/D, áudio desabilitado, fora do ar, ganho−6dB e arquivo substituído. Cada player entregou o tom próprio (440/660/880/1100Hz), demais bins abaixo do critério1.5%, estados de mute com PCM zero e ganho medido0.5011919 para esperado0.5011872. View liberada, saídas0, shutdown aceito,exit0/776ms,contador0 e marcadores de crash0. Não houve mudança de produto, SourceRecord nos players, dispositivo físico ou operador. Prova fecha a lacuna local do Master citada no relatório de auditoria; transientes rápidos/endurance/audição física continuam fora do escopo. Allowlist qa-finalizacao/replay-master-four/ALLOWLIST.json SHA446690f32f8938e423c5798c3bd16937b9c4fdf81fcdbdfe3b003b30e492b9c6.

## Entrega selecionada — 2026-10-10T00:31:16.414Z

Instalador atual: **0.1.0-local.20261010000500**, selecionado em entregas/INSTALADOR-ATUAL.json. Use **INSTALAR-FREEMIX.cmd**, escolha uma pasta nova/vazia e depois abra pelo atalho FreeMix Studio. Duas instalações/importações/diagnósticos/desinstalações reais e startup passaram. Native **4793d1a40f56ea9b6e887eb49189d937758e3b7f**, 21 patches/187 snapshots com reconstrução de árvore verificada. Fechamento cooperativo em 773 ms, contador de alocações zero e nenhum crash novo no ensaio instalado.

A instalação do operador não foi substituída. ABRIR-FREEMIX.cmd mantém a mesa legada e seu atualizador incremental; não aplicar pacote completo por esse atualizador. Créditos/licenças OBS permanecem. Diagnósticos são ZIP local sanitizado, enviado manualmente. Nenhum upload ou serviço externo foi publicado.

Fontes do payload correspondem ao Git **3737e790945962df9feff07287e4dda3e07c054d**, branch feat/native-menus-config-screens. Provas posteriores e documentação recebem commits separados. O EXE contém assinatura interna Ed25519, sem certificado Authenticode.

Master digital dos quatro players passou; relatório instalado000500 e allowlist foram congelados. Auditoria implementa QR GTZIP offline com edição validada e leitura independente; root integra em nova versão após freeze. Installer/transportes encerraram as matrizes locais. Demais recursos externos e limites estão no estado atual de PENDENCIAS-REAIS.md; os blocos acima são cronologia.

## QR GTZIP implementado depois da entrega000500

Seis fontes congelados: QR direto/grupos/aninhado, texto UTF-8 editável até512bytes, quadrado16–2048px, ECC M/quiet-zone4. Encoder offline qrcode1.5.4/dijkstrajs1.0.3 MIT, sem CDN/rede/node_modules em execução do título. Save/prepare recusam valores inválidos antes de persistir ou solicitar mudança Native.46 checks de navegador/decoder independente e28 de backend PASS; regressão Polygon/Path33PASS.4/4 QR presentes no inventário foram reconhecidos;743 hashes preservados e nenhum asset/texto proprietário copiado. CEF ainda aguarda ensaio instalado; não afirmar compatibilidade universal de atributos/transformações QR.

Candidato0.1.0-local.20261010004000 será empacotado com mesma build Native21;000500 permanece o instalador selecionado até terminar assinatura/ZIP/Setup e QA própria. QR não está no payload000500 imutável. Provas: qa-finalizacao/gtzip-qr/ALLOWLIST.json e gtzip-direct-shapes-qr-regression/ALLOWLIST.json.

## Candidato QR corrigido

040000 foi rejeitado: preparação documental falhou e a assinatura avançou indevidamente. Payload imutável arquivado, sem instalação/ZIP/EXE/mesa. Novo candidato0.1.0-local.20261010004500 exige recibo presealPASS anterior à assinatura.000500 continua selecionado. Auditoria prepara ticker2D em rascunho isolado, sem alterar os seis fontes QR congelados desta versão.

## Ticker2D integrado nas fontes posteriores ao QR45

Três fontes aplicados por cópia byteidêntica ao draft verificado: template finito com dois textos e uma imagem, campos editáveis,geometria2D preservada e Shrink limitado a10passos.30checks Edge/parser/conversão/edição PASS,46regressões QR e33formas PASS; sem cópia de modelo proprietário. TypeAdd/fila e unidadeSpeed exata continuam avisos explícitos; movimento local aproximado de um item. Sequências examinadas não possuem alvo/frames/tempo utilizáveis e não foram inventadas.

Root prepara candidato0.1.0-local.20261010010000 com mesmoNative21; ticker ainda não recebeu QAAPI/CEF/recuperação instalada.000500 segue selecionado enquanto QR45 terminaQA. Provas em qa-finalizacao/gtzip-ticker-template/ALLOWLIST-APPLIED.json; não transferir PASS do draft para CEF.

## Correção de recuperação QR integrada, aguardando pacote novo

O scanner agora reconhece o encoder autocontido somente quando conteúdo/tamanho/manifesto GTZIP/campo QR/licença MIT correspondem exatamente ao helper local aprovado. Não interpreta os requires internos como arquivos externos. Scripts arbitrários, traversal e adulterações continuam recusados.33 verificações locais passaram, incluindo backup .fmx real, restauração sem originais e QR decodificado em Edge/ZXing. Native/API eram mocks neste teste; recuperação pela API/CEF instalada ainda precisa do candidato seguinte. Nenhum pacote selado foi alterado. A primeira ativação está em QA separada no obs-browser.
