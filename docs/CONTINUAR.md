# Continuidade do FreeMix

Atualizado em 2026-10-10T00:06:08.158Z. Trabalho autorizado até terça-feira, 13/10/2026, ativo. Preservar mesa, vMix, Calls, gravações e saídas do operador. Testes somente em TEMP e portas próprias.

## Entrega e fontes

O instalador aprovado continua **0.1.0-local.20261009213415**, escolhido por entregas/INSTALADOR-ATUAL.json e INSTALAR-FREEMIX.cmd. Passou por duas instalações reais, importação, ZIP diagnóstico, desinstalação conservadora e startup. Não contém alterações posteriores.

ABRIR-FREEMIX.cmd permanece associado ao operador e ao atualizador incremental anterior. Não aplicar um pacote completo pelo atualizador incremental nem modificar DLLs do operador aberto. A ponte nativa SRT→NDI alpha está entregue como beta separado. O receptor alpha WebBrowser foi abortado.

Produto FreeMix, branch feat/native-menus-config-screens. Push anterior confirmado: 59058d6. Native atual: **4793d1a40f56ea9b6e887eb49189d937758e3b7f**, 21 patches e 187 snapshots, árvore **7604633e921339aa65f40015dcc3175e26accfc7** reconstruída por aplicação dos patches e verificada. Não há push para o upstream OBS.

Próximo candidato: **0.1.0-local.20261010000500**, Native21 compilado e congelado para QA e ainda sem instalador aprovado. Native20/233334 passou por assinatura/hashes, duas instalações reais, importação, diagnóstico, desinstalação e startup (fechamento766ms, contador0). Não foi escolhido porque a revisão final identificou logs OAuth e superfícies de marca adicionais. Essas correções estão congeladas no Native21 e no coletor (149 verificações PASS). Não modificar nem reutilizar os recibos/ZIP/EXE233334; o novo instalador repetirá somente as verificações afetadas.


## Estado confirmado

| Frente | Evidência | Trabalho seguinte |
|---|---|---|
| Replay | Native19/JS congelados: 30 comparações pós-seek com diferença0; 81 comparações em90s até1quadro, sem correções/pausas periódicas. Seis PCM30/50/100%, NTSC/VFR/EOF e REC passaram. View própria liberada, outputs0, shutdown aceito, exit0/845ms. JS espelhados. | Native20 conserva mesma DLL ffmpeg bcbe9a; MultiGravação em composição contendo replay passou30/50/100%, seek, off-air e EOF; três arquivos TS finalizados/decodificados, outputs0 no retorno de Stop, exit0/655ms e contador0. UI exclui REPLAY C/D, alinhada ao backend. Não transferir FAIL do filtro direto nos players como falha comprovada da gravação de cenas. Sem genlock físico. |
| SRT/SDI | Native19: 11 capturas packed420/444, Fill/Key/alpha/chroma/seeks, áudio Fill e Key silenciosa, PTS/reconexão/stop-start/exit0. Seis guards SDI passaram. DLLs ffmpeg/decklink idênticas no Native20. | WAN, vMix externo e placa/driver SDI/HDR precisam de recursos físicos. |
| Janelas | Nove CEF com API real, DOM/erros e fechamento passaram em1200×850. | Aprovação visual em outras telas/DPI não está implícita. |
| Títulos | Quatro prévias ausentes renderizadas dos próprios HTML;27/27 carregam, fallback0. Edge real em600×600/1920×1080, campos e footer acessíveis, sem overflow/erroJS. PNGs integrados; HTML/catálogo intactos. | Teste foi navegador isolado; não afirmar CEF nessas duas dimensões. |
| Alocações | Ledger/PDB identificaram lista de arquivos ausentes24bytes e ETag RTMP16bytes. Patch2fontes: QA [2,2,2]→[0,0,0], ledger/bytes/erros/unknown0. Updater real: headers repetidos/cache/normal/badJSON/HTTP500/single_file em loopback passou. | Produção Native20 trackerOFF em três raízes/modos passou: contador[0,0,0], crashes0, saídas0, fechamentos611/757/716ms. Advertências de weakref[0,3,3] preservadas. Não chamar sessões curtas de endurance. |
| Distribuição | Preflight20/178fontes/99módulos/6overlays passou; versão de fontes deve corresponder ao pacote. ZIP CLI exige recibo/input/output novos e confere CRC/SHA. Runner instalado usa recibos próprios preservando213415. | Criar/selar/ZIP/EXE0.1.0-local.20261010000500 e executar o plano CandidateNext-TjY7cm com os novos fixtures OAuth em ZIP instalado; startup próprio Native21 deve confirmar marca/versão/fechamento. Só então atualizar INSTALADOR-ATUAL. |

## Donos

- auditoria_pendencias_reais: correções OAuth/diagnóstico congeladas; revisão das pendências concretas em curso.
- installer_exe: marca Native21 congelada; harness novo de startup preparado, aguardando pacote/pins.
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

## Correções seguintes verificadas

Native21 build completa passou em2026-10-10T00:08:50Z, recibo2c7cb041b4a82f75c7900abefa3a6902adbcb011199b0653166c67b5276674e1. EXE53d10913ee0e14aa8c5d58a9bd35cf0af72a9072a3214f92444e688cda983e27. DLLs ffmpeg/decklink/rtmp/frontendAPI idênticas ao Native20. GTZIP Polygon/Path diretos corrigidos,33 casos PASS e perda silenciosa original reproduzida; sem alteração do renderer existente. Código e prova espelhados. Próxima validação local: política de áudio A/B/C/D no Master digital, separada da prova PCM pré-Master já existente.
