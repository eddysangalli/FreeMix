# Pendências da integração atual

Atualizado em 2026-10-09T22:14:45.649Z. Leia [PENDENCIAS-REAIS.md](PENDENCIAS-REAIS.md) para o estado por frente, recursos externos e critérios de conclusão.

Ainda em execução: HDR SDI e alinhamento multicâmera dirigido, investigação das alocações no fechamento e próxima integração. O instalador 213415 já passou na conferência de duas instalações reais e startup completo. Os ensaios de 20 minutos de replay CEF e ponte nativa alpha terminaram e os recibos foram integrados. O instalador 153453 continua sendo a entrega anterior; não contém todas as fontes novas.

A homologação física de ASIO/SDI/controladores/PTZ, a matriz WAN com duas operadoras/VPS, NDI HDR licenciado e Windows limpo precisam dos recursos indicados. OMT HDR manual tem prova SDK local. Recuperação não reconstrói drivers/serviços dinâmicos nem conteúdo nunca gravado.

O receptor alpha de navegador foi abortado; não o recomendar para vídeo/internet. A ponte nativa está separada, em beta. Logs por botão/BAT são locais para envio manual; nada foi enviado ou publicado automaticamente.

## Conferência posterior ao instalador 213415

Estado em 2026-10-09T22:41:31.392Z. A entrega instalável continua sendo 213415, já verificada; as alterações seguintes pertencem às fontes e ensaios da próxima versão. A série Native e seus snapshots foram verificados por árvore. Isso não publica o fork no upstream OBS.

- SDI HDR: implementação, compilação/link e seis guards negativos passaram em raiz isolada. O plugin não inicializou por falta de iterator/driver nesta máquina; capabilities de uma placa e sinal físico permanecem inconclusivos. SDR rotulado HDR, alpha/FillKey incompatíveis e dispositivo ausente foram recusados sem ativar saída. A mensagem agora distingue driver ausente e versão sem contrato; sua repetição no novo EXE está em andamento.
- Replay: reproduzidos drift visual A/B, salto após seek e falha de cue depois de EOF. Seek/relógio e restart off-air receberam correções compiladas. Opt-in de apresentação sem fila apenas para arquivos privados do Replay está em ensaio. Cursor igual não foi aceito como prova de quadros iguais: a matriz visual ainda registrou dois quadros de diferença. Não espelhar JS ainda sem allowlist final nem declarar sincronismo concluído.
- Estabilidade: três instalações TEMP com os mesmos 159 binários de 213415 reproduziram saldo de duas alocações: Native direto, launcher e Native+API. Fechamentos cooperativos em 727/761/709 ms, sem crashes/objetos restantes/double-destroy; exit0 capturado nos filhos diretos, launcher separado confirmado encerrado por PID/caminho. Isso não atribui o saldo ao launcher. Tamanhos, origem e crescimento seguem em investigação por instrumentação QA exclusiva.
- Fontes: exportação Native verifica a série completa em índice separado e compara a árvore ao HEAD antes de escrever snapshots. O builder exige ZIP e destino explícitos, preservando releases existentes. Logs brutos de QA não são publicados no Git.

Subagentes ativos: replay/áudio/VFR; regressão SRT e guards SDI; rastreamento isolado das alocações. Nenhuma sessão, gravação ou instalação do operador foi ativada/alterada.
