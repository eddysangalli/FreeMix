# Replay — áudio por câmera e grade de quadros

Implementado em 08/10/2026, em `replay-disco.mjs`, `replay-sincronia.mjs` e `remoto/replay.{html,js}`. O mesmo controlador continua atendendo ISO; opções novas de câmera/passo pertencem ao Replay. A entrega exige também a DLL `obs-ffmpeg.dll` compilada com a alteração estreita em `shared/media-playback/media.{c,h}`.

## Funcionamento

- Áudio gravado por câmera: entrada, Master, Bus A ou Bus B. A seleção fica no projeto e exige REC parado. O início da sessão substitui configurações antigas do filtro Source Record, inclusive `different_audio` e `audio_track`.
- Reprodução: volume (-60 a +12 dB) e silêncio por câmera, silêncio geral. Só o Player no Programa é desmutado; o anterior é mutado antes do novo. Preparar um lance ou voltar ao vivo deixa o player fora do ar silencioso. Só fontes privadas `Replay Player A/B`, de tipo e arquivo confirmados, são alteradas; áudio do input original é preservado. Players não enviam áudio ao monitor ou aos outros cinco tracks.
- Passo ±1 quadro, também vinculado entre A/B. Ambos pausam e o motor confirma a posição na grade do FPS racional do arquivo. Offsets inteiros por câmera preservam o momento comum; offset positivo busca um quadro mais adiante naquela câmera. Taxas incompatíveis e VFR diagnosticado são recusados para vínculo/passo.
- Em reprodução, correção periódica usa uma tolerância de um quadro. Isso é correção de cursores de decodificadores, não genlock físico. O atraso das câmeras e dos arquivos precisa de calibração visual.
- Native: o cursor pausado usa o PTS do último quadro enviado ao callback, protegido por mutex. Buffer de áudio/próximo quadro preparado não adianta o valor. Reset invalida esse registro; reprodução e áudio sem vídeo conservam a leitura anterior do clock. O JS também espera o RESTART do decoder antes de pausar: a indicação PLAYING anterior podia mascarar um reset que posteriormente anulava a pausa.

## Contrato da API existente `/api/replay`

`frame {player:'A'|'B',delta:inteiro -300..300}`; `camera-options {cam,options:{recordAudio:'input'|'master'|'bus-a'|'bus-b',gainDb,muted,offsetFrames}}`; `audio {enabled:boolean}`. A rota já encaminha ações ao controlador. Estado inclui `cameraOptions`, `audioEnabled`, metadados de FPS/áudio/offset nos Players e diagnóstico `sync`/`frame`. Nenhuma mudança na API central foi necessária.

## Evidências executadas

Raiz exclusiva `FreeMix-QA-Recovery-20261008`, WS14479/API18104. Operador e DLL principal preservados; QA fechada ao final.

- `qa-portatil/resultado-replay-quadros-logica.json`: 6 verificações — NTSC racional, offsets, rejeição de taxas/VFR inválidos, passo vinculado, sequência de mute e persistência.
- `qa-portatil/resultado-replay-quadros-nativo.json`: 4 — Player A quadro28 e B quadro30 com offset2; PNGs comparados aos frames FFmpeg. Ambos RGB228; quadro seguinte RGB236, distinguindo erro de um quadro. Passo a50% confirma29/31; áudio A/B exclusivo e ganhoB -6dB; silêncio geral/volta ao vivo.
- `qa-portatil/resultado-replay-audio-captura.json`: 2 — filtro antigo de Master é substituído; duas gravações TS têm áudio próprio440/880Hz, PCM decodificado com energia real. Frequência medida pelo período mediano, ignorando silêncio inicial de abertura.
- `qa-portatil/resultado-replay-quadros-interface.json`: 3 — botões/edição enviam contratos corretos; slider usa FPS racional. É ensaio de UI com API controlada, não audição humana.
- `qa-portatil/resultado-replay-quadros-dll.json`: DLL privada SHA256 `3e3811a6d805ce7d1dda45e3656b492e5bef113be378d17bf2610451500c45ed`; substituição rompeu hardlink sem modificar DLL da instalação principal.
- `qa-portatil/resultado-replay-quadros-encerrada.json`: encerramento da QA somente.

## Limites

Continuam dois Players A/B. Não há genlock automático, detecção de timecode externo, garantia de sincronismo de dispositivos físicos, escuta humana, prova longa de retenção ou recuperação universal de mídia corrompida. Native foi comprovado com fixture CFR30; NTSC racional foi comprovado no cálculo. A tentativa adicional de regressão de loop/áudio-only não completou o assert de seek3900 e não é contabilizada como PASS; não atribuir homologação desses casos a esta rodada. Desvio enquanto reproduzindo é corrigido periodicamente e não garante cada frame de saída renderizado simultaneamente.

## Recovery dos novos efeitos offline

`recuperacao-producao.mjs` desliga o filtro `transcription_filter_audio_filter` no clone e desativa tradução cloud/local, legenda para stream, WebVTT e arquivo automático. O caminho do modelo Whisper externo é coletado/remapeado como dependência; modelo de tracker e shader têm referências explícitas inventariadas. O original é preservado. Fixture `resultado-recovery-efeitos-offline.json`: 2 PASS. Isso preserva arquivos; não reinstala plugins/modelos nem confirma inferência/driver em outra máquina.
