# API e tela SRT HDR — QA focada própria

VM/helper/backend: resultado inicial10 PASS/5 FAIL preservado. Root corrigiu os cinco achados: preservar fonte/encoder indisponível, bloquear nova ação após falha da consulta e recusar IPv4 numérico inválido. A revisão passou8 casos (cinco regressões e novos contratos GET, descartar edição e leitura do OutputEngine). Nenhum arquivo do produto foi alterado por esta frente.

O teste inicial de Production.run e SessionRecovery.journal usou os métodos reais com Native/refresh/execute simulados e filesystem TEMP próprio. Comprovou uma gravação JSONL na consulta antiga. Root substituiu a consulta por GET /api/srt-hdr fora da fila de mutação/journal. Não adaptamos a lógica do produto ou um servidor falso para o ensaio HTTP.

## HTTP e Native reais

Reutilizamos a instalação TEMP própria já encerrada e validamos a árvore completa2.085 arquivos Native24/a047860. Não reinstalamos pacote e não executamos novamente a matriz quatro envios/decodificação. Copiamos259 módulos/páginas estáticos atuais do FreeMix apenas para a TEMP, com hashes de origem/destino; configs, credenciais, local.js, pacotes e operador ficaram preservados. Os seis pins da revisão foram exigidos antes de iniciar.

Fonte sintética PQ própria,1024×240/30fps, preparada na cena própria de Programa; encoder obs_nvenc_hevc_tex, áudio Master explicitamente da fonte ativa nessa cena. Nenhuma fonte de hardware/operador foi usada.

GET da página e de estado três vezes manteve exatamente os hashes dos quatro perfis SRT HDR e do journal (1.387 bytes). Inicialmente todos os slots tinham activefalse/pendingfalse, sem REC/stream. Sender inválido4, origem externa e método POST no GET foram recusados.

Preflight/configure pelo HTTP ocorreram somente no sender2 (HDR3), sem início. Start respondeu starting/activefalse/pendingtrue; uma consulta Native posterior confirmou live e bytes>10000. Os outros três slots permaneceram sem recursos. Configure durante envio foi recusado. Stop respondeu stopping/activefalse/pendingtrue e a prova esperou pendingfalse/activefalse. A aceitação de start/stop não foi rotulada como transmissão/parada concluída.

O listener foi interrompido pela parada explícita; sua saída terminal não é prova de decode/exit0. A mídia Native24 já foi comprovada separadamente em srt-hdr-native24-real-20261010 (allowlistce5c315a…). Esta frente comprova integração HTTP e estados, não qualidade/performance adicionais.

## Prévia e limites

A prévia real da página foi disponibilizada ao Root via URL própria registrada em preview-ready.json, com todos os envios parados. Default HDR1 pode mostrar configuração antiga própria indisponível; selecionar HDR3 faz apenas GET e mostra a origem nova configurada. A liberação da prévia só fecha os processos próprios cooperativamente; não envia comandos ao operador.

DOM/VM não prova layout/CEF nem acabamento visual. A conferência IAB do Root é separada. Nenhuma publicação, alteração Git, build comum, Setup novo, WAN, UHD, QSV/AMF ou homologação de monitor/receptor físico nesta entrega. Logs crus/configs/credenciais/mídia permanecem na TEMP e não entram na allowlist. As hashes e contagens de fechamento constam no recibo HTTP final, depois da liberação do Root.

Os scripts/resultados iniciais preservam a falha e seus pins; não sobrescrever ou rerodar para apagar história. A revisão usa fontes reais com novos pins. Os módulos/páginas de produto são responsabilidade do Root; a allowlist desta frente contém somente QA/metadados.

## Fechamento e revisão final limitada

O Root conferiu a tela IAB real no sender2 parado e salvou root-hdr-native24.jpg, também inspecionada nesta frente. Native/API próprios fecharam cooperativamente, sem forcekill ou crash; todas as contagens de alocações não liberadas foram zero. O recibo registra as advertências Meter separadamente, sem atribuí-las a um problema de mídia ou medir performance.

Depois da conferência, um teste VM adicional comprovou que áudio independente salvo indisponível não bloqueava visualmente Configure/Start. Backend e Native já recusavam esse áudio; não houve envio inválido. result-audio-unavailable.json preserva o FAIL. Root corrigiu a validação visual e a limpeza das opções antigas ao trocar explicitamente o sender. Somente esses dois casos foram repetidos em test-final-ui.mjs: ambos PASS, sem writes ou dispatch Native. Sintaxe e pins finais estão separados.

O JPEG e o ensaio HTTP usaram a UI anterior (a79c2057…), enquanto a revisão VM final usou642b6a54…. API/helper/Native não mudaram. Não repetimos a prova Native/mídia nem declaramos conferência CEF dos dois ajustes finais. freeze.mjs é o preparo anterior preservado; freeze-final.mjs produz a allowlist final com essa distinção explícita.
