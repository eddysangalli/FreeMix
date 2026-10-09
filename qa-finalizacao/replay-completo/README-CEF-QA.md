# Ensaio Replay no CEF embutido do Native

Escopo: `replay.html`/`replay.js` reais em BrowserSource do OBS/FreeMix, DiskReplay real, duas cenas sintéticas gravadas por SourceRecord/x264, mídia H.264/AAC e MSE reproduzida pelo CEF da instalação. Serve os mesmos assets e comandos de Replay em servidor QA loopback efêmero; não testa o servidor HTTP de produção/autenticação, que possui recibos separados. Não usa Edge, Playwright, transporte alpha-web ou captura de hardware.

O bootstrap deriva exclusivamente a preparação de perfil vazio do harness LocalVocal: cria uma nova raiz TEMP, copia arquivos em vez de editar hardlinks, confere SHA256 do Native `1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744`, preserva as três DLLs corrigidas, e carrega NDI 6.3.2 por variável apenas do processo filho. Os campos user.ini e cenas nulas impedem dispositivos padrão. `SetRecordDirectory` é explícito antes de REC, conferido depois, e o diretório da sessão deve permanecer dentro da raiz TEMP. O ambiente seleciona x264 apenas no processo Node de QA.

`make-cef-bootstrap.py` gera `cef-bootstrap.mjs`; `test-cef-native.mjs` opera apenas seu PID/exe identificado e porta autenticada privada. `cef-instrument.js` é inserido somente na resposta HTML de QA. Ele usa funções/controles públicos da página real para três seeks, IN/OUT, salvamento e checkbox de áudio opt-in. AudioContext/analyser mede a frequência sintética 440 Hz, com ganho final zero; BrowserSource é reroute_audio e todas as pistas/monitoramento desativados. Nenhum som externo é produzido.

O código local oficial em `freemix-app/plugins/obs-browser/obs-browser-plugin.cpp` inicializa CEF no Windows com CefMainArgs vazio e não configura remote_debugging_port. `browser-app.cpp` permite autoplay por flag nativa do plugin. O teste usa callbacks HTTP da própria página para JS/erros/métricas e GetSourceScreenshot via OBSws, sem exigir CDP e sem mudar o plugin.

## Execução

```powershell
python qa-finalizacao/replay-completo/make-cef-bootstrap.py
node qa-finalizacao/replay-completo/test-cef-native.mjs
```

A prova solicita 20 minutos após iniciar vídeo e medir áudio. Coleta a cada dois segundos cursor, readyState, pausa, frames/drop e intervalos MSE. Timeline cresce por REC real. A UI salva IN 10 s/OUT 13 s nos dois ângulos, busca novamente 1 s e segue reproduzindo. FFprobe confirma duração dos lances originais. Encerra REC e chama shutdown_idle no seu Native, registra exit/cancelamento e só força cleanup se o seu processo não sair. Screenshots são adquiridas a cada minuto; logs/report completos ficam em `cef-native/`.

## Tentativa inicial preservada

`cef-native-initial-isolation-failure/` preserva FAIL de isolamento: um perfil vazio herdou o diretório padrão D:/Users/eddyr/Videos/replay. O ensaio foi interrompido assim que observado, sem continuar os 20 minutos. Somente a sessão UUID criada por esse PID, conferida no estado privado/log, foi movida para a QA; nenhum arquivo desconhecido foi removido. O Native fechou cooperativamente em 1020 ms, exit 0. O harness foi corrigido e a prova principal começou em clone novo com diretório explicitamente privado, confirmado novamente após REC por `record-directory-after-start.json`.

Limites: projeto sintético 640×360/30 fps com dois ângulos, ensaio local, sem homologação de quatro câmeras FullHD/4K, microfones, genlock, operação remota ou uso prolongado por horas. Ganho de análise zero mede decodificação e opt-in, não qualidade de caixas/driver físico. Não configura nenhum dispositivo real. PASS exige conclusão real dos 20 minutos e encerramento; um screenshot ou teste curto não substitui esse recibo.

## Resultado observado em 09/10/2026

O CEF 127.0.6533.120 do obs-browser 2.26.9 reproduziu a prévia durante 1199,9994 s medidos após a análise inicial de áudio, com 599 amostras. Foram 35.051 quadros e zero drops após a última busca; nenhuma pausa recorrente nas amostras posteriores às buscas. Houve dois eventos waiting breves no início (11,3 e 20,2 s) e um no seek (34,2 s). Eles não são ocultados como ausência absoluta de buffering. A memória agregada de nove processos ficou de 3926,97 a 3930,96 MiB privados (máximo3935,77 MiB); working set de1351,70 a1314,62 MiB. Cache observado em24MP4/19,5MB.

Três seeks reais: 10 s em548,3 ms, 13 s em185,8 ms e 1 s em392 ms. IN10/OUT13 gerou dois clips originais de3 s. REC e Programa QA foram preservados. Histórico cresceu7,588→1210,588 s. Foram155 pedidos de proxy, preparação total mediana317,2 ms/P95 347,9 ms/máximo478,9 ms. Áudio do elemento CEF inicialmente mudo, checkbox opt-in alterou muted=false e AudioContext mediu445,3 Hz, ganho final zero. Conferência independente por FFmpeg em5 s perto de715,82 s do AAC original mediu440 Hz, RMS0,12485 e zero janelas silenciosas de100 ms.

Native fechou normalmente em1016 ms, exit0, nenhuma limpeza forçada. Log confirma NDI6.3.2 carregado e SceneSwitcher parado antes da destruição do frontend. Não houve exception JS, erro MSE ou crash. O console registrou navigator.vibrate bloqueado porque o teste automatizado não gera gesto físico; isso não é apresentado como console inteiramente limpo. O contador de encerramento libobs reportou uma alocação não liberada, sem dono identificado nesta frente; não há alegação de ausência universal de leaks.

O coletor original marcou FAIL no limiar exato `wall>=1200000`, por diferença de0,6 ms no timer CEF. `resultado-cef-native.json` permanece intacto. O coordenador aprovou tolerância explícita≤um quadro (34 ms); `review-cef-evidence.mjs` verifica os mesmos dados brutos e todos os critérios que vinham depois desse assert. `resultado-cef-native-reviewed.json` registra PASS da análise revisada, hashes dos dados originais e correção do limiar. Não é uma nova execução. `summary.json` consolida métricas; `cef-panel.png` é a última captura periódica real, feita às18:45:14 durante o ensaio.
