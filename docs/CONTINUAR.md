# Continuidade do FreeMix

Atualizado em 2026-10-09T23:31:54.566Z. Trabalho autorizado até terça-feira, 13/10/2026, ativo. Preservar mesa, vMix, Calls, gravações e saídas do operador. Testes somente em TEMP e portas próprias.

## Entrega e fontes

O instalador aprovado continua **0.1.0-local.20261009213415**, escolhido por entregas/INSTALADOR-ATUAL.json e INSTALAR-FREEMIX.cmd. Passou por duas instalações reais, importação, ZIP diagnóstico, desinstalação conservadora e startup. Não contém alterações posteriores.

ABRIR-FREEMIX.cmd permanece associado ao operador e ao atualizador incremental anterior. Não aplicar um pacote completo pelo atualizador incremental nem modificar DLLs do operador aberto. A ponte nativa SRT→NDI alpha está entregue como beta separado. O receptor alpha WebBrowser foi abortado.

Produto FreeMix, branch feat/native-menus-config-screens. Push anterior confirmado: 56dbfc7. Native atual: **6cbf07641c501cb6b319c6bf7000b805fdce625c**, 20 patches e 178 snapshots, árvore **ec1b13a92f404f49527cdd88e91ccdf4275e050a** verificada. Não há push para o upstream OBS.

Próximo candidato: **0.1.0-local.20261009233334**, ainda sem instalador aprovado. A reserva de fontes 223334 foi substituída; nunca teve EXE aprovado. Usar exclusivamente **qa-finalizacao/native-build-frozen-6cbf076-configured**, recibo SHA **290f0417f4cfe361c682b899ea59665947dec819190222801c91aba6871a1b57**. Build completa, configure explícito e identificação -g6cbf076 passaram. A primeira freeze20 sem configure conservava a identificação19 e foi invalidada para candidato; não usar.

## Estado confirmado

| Frente | Evidência | Trabalho seguinte |
|---|---|---|
| Replay | Native19/JS congelados: 30 comparações pós-seek com diferença0; 81 comparações em90s até1quadro, sem correções/pausas periódicas. Seis PCM30/50/100%, NTSC/VFR/EOF e REC passaram. View própria liberada, outputs0, shutdown aceito, exit0/845ms. JS espelhados. | Native20 conserva mesma DLL ffmpeg bcbe9a; MultiGravação em composição contendo replay passou30/50/100%, seek, off-air e EOF; três arquivos TS finalizados/decodificados, outputs0 no retorno de Stop, exit0/655ms e contador0. UI exclui REPLAY C/D, alinhada ao backend. Não transferir FAIL do filtro direto nos players como falha comprovada da gravação de cenas. Sem genlock físico. |
| SRT/SDI | Native19: 11 capturas packed420/444, Fill/Key/alpha/chroma/seeks, áudio Fill e Key silenciosa, PTS/reconexão/stop-start/exit0. Seis guards SDI passaram. DLLs ffmpeg/decklink idênticas no Native20. | WAN, vMix externo e placa/driver SDI/HDR precisam de recursos físicos. |
| Janelas | Nove CEF com API real, DOM/erros e fechamento passaram em1200×850. | Aprovação visual em outras telas/DPI não está implícita. |
| Títulos | Quatro prévias ausentes renderizadas dos próprios HTML;27/27 carregam, fallback0. Edge real em600×600/1920×1080, campos e footer acessíveis, sem overflow/erroJS. PNGs integrados; HTML/catálogo intactos. | Teste foi navegador isolado; não afirmar CEF nessas duas dimensões. |
| Alocações | Ledger/PDB identificaram lista de arquivos ausentes24bytes e ETag RTMP16bytes. Patch2fontes: QA [2,2,2]→[0,0,0], ledger/bytes/erros/unknown0. Updater real: headers repetidos/cache/normal/badJSON/HTTP500/single_file em loopback passou. | Produção Native20 trackerOFF em três raízes/modos passou: contador[0,0,0], crashes0, saídas0, fechamentos611/757/716ms. Advertências de weakref[0,3,3] preservadas. Não chamar sessões curtas de endurance. |
| Distribuição | Preflight20/178fontes/99módulos/6overlays passou; versão de fontes deve corresponder ao pacote. ZIP CLI exige recibo/input/output novos e confere CRC/SHA. Runner instalado usa recibos próprios preservando213415. | Criar/selar/ZIP/EXE233334 e repetir duas instalações/importação/diagnóstico/desinstalação/startup antes de atualizar INSTALADOR-ATUAL. |

## Donos

- auditoria_pendencias_reais: prova adicional SourceRecord em composição com replay e filtro UI C/D concluída, allowlist congelada e espelhada.
- installer_exe: três modos produção20 trackerOFF concluídos em TEMP própria; allowlist espelhada sem tracker/PDB/log bruto.
- transportes_rede_conclusao: runner do próximo instalador pronto; aguardando pacote/EXE/pins para execução real.
- Root: espelhos, Git, docs/fontes/licenças e candidato novo. Não sobrescrever entregas/recibos antigos nem selar antes das provas aplicáveis.

## Recursos externos

ASIO/Direct Out, SDI/Fill+Key/HDR, MIDI/StreamDeck/XKeys/PTZ e monitores exigem equipamentos. Bonding WAN exige VPS e duas conexões reais. Feed HTTPS/TURN precisa de domínio/DNS/servidor. NDI envio HDR precisa de Advanced SDK/licença. Windows limpo e Calls externas precisam de ambientes/convidados. Logs são ZIP local/manual; nenhum upload automático ou serviço publicado.

Ver PENDENCIAS-REAIS.md e PLANO-CONCLUSAO-20261013.md para critérios e estimativas de ensaio após disponibilidade. Não declarar compatibilidade universal nem homologação física/WAN por testes locais.

## Referências

- ENTREGA-ATUAL.md / INSTALACAO.md: instalador aprovado e uso.
- RELATORIO-CEF-NOVE-JANELAS-NATIVE19-20261009.md e RELATORIO-INPUT-TITLE-RESPONSIVO-PREVIAS-20261009.md.
- qa-finalizacao/replay-sincronia-native/README.md e resumo-stage5-final.json: Replay PASS e FAILs preservados.
- qa-finalizacao/shutdown-allocation-remediation-qa/report.json: origens e correções.
- FONTES.md / BUILD-FROM-SOURCE.md: reconstrução/exportação verificada.
- historico/CONTINUAR-20261009-224131.md: cronologia antiga, não estado atual.
