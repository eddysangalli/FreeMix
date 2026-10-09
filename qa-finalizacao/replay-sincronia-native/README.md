# Replay: quadro, sincronismo e áudio — 09/10/2026

Esta pasta contém ensaios em clones TEMP próprios, com OBS WebSocket autenticado em portas loopback efêmeras. O Programa permaneceu na cena QA, sem comandos ao operador, transmissão ou áudio físico. O candidato 213415 permanece imutável. A integração destes novos fontes e dos cinco patches Native cabe ao coordenador.

## Aceite final em Native

`resultado-holdview-final.json` é PASS da execução completa com view nativa própria ativa desde o início: 30 comparações A/B após seeks e seis induções em 30/50/100% tiveram diferença visual máxima 0; 81 comparações durante 90 s tiveram máximo 1 quadro, sem correção/pausa por polling. Seis capturas de áudio, NTSC, VFR e coordenação por tempo passaram. REC cresceu de 3,121334 s para 141,521334 s, Programa permaneceu QA. A view foi liberada, A/B ficaram active=false/showing=false, todos outputs ficaram inativos, shutdown_idle retornou success=true, exit0 em 845 ms. O teste não utiliza SourceRecord nos players: somente nas duas câmeras reais de REC.

`resultado-pcm-holdview-final.json` analisa o PCM desta mesma execução: 90,24 s a 48 kHz, 1269 pacotes todos muted, tom 132 Hz em 30%, nenhuma janela silenciosa, máximo silêncio 0,02083 ms e gap de timestamp +0,00694 ms. Não é reprodução em hardware ou som do Master. A pausa nas seis correções intencionais durou 152–173 ms; correção inteira 230–377 ms. Bitmaps/dados preservados em `holdview-final-images` e `pcm-holdview-final`.

Falhas do recorder auxiliar de QA foram preservadas em `resultado-stage5-coordinated-media-pass-cleanup-fail.json`, `resultado-stage5-coordinated-stop-first-refusal.json` e `resultado-stage5-coordinated-disable-refusal.json`, com stacks em `stacks-full-stop-first.txt`. Após mudanças repetidas de speed/seek, outputs QA Pair Render continuaram ativos; no ensaio com resposta disponível, o fechamento foi recusado (success=false) e a GUI estava no diálogo dessa recusa. Não foi demonstrado deadlock de SourceRecord nem hang de shutdown aceito, e não foi feito patch desse plugin. Esse comportamento específico ao gravar os próprios players merece investigação separada; não equivale ao fluxo normal de REC das câmeras testado no PASS final.

`resultado-holdview-late-fixture-fail.json` preserva defeito do primeiro harness com view anexada depois das comparações: falhou visualmente, mas encerrou sem outputs ativos em 827 ms. Ele não foi utilizado como prova de render contínuo. O log final informa 1 allocation leak; origem não atribuída nesta QA, registrada separadamente pelo coordenador.

## Alterações de produto

- `obs-vmix/ferramentas/replay-disco.mjs`: correção coordenada limitada aos players privados. Quando há divergência acima de um quadro ou de estado, pausa todos uma vez, confirma a mesma posição calibrada, e retoma juntos. Dentro da tolerância, polling não provoca pause/seek. Registra duração e confirmação por cursor, sem chamá-la de genlock visual.
- `obs-vmix/ferramentas/replay-sincronia.mjs`: alvos com taxa racional, timestamp arredondado para baixo e sincronismo por tempo em taxas mistas/VFR.
- Cadência: amostragem de PTS decodificados no início, meio e fim identifica a fixture VFR mesmo com headers `30/30`. É análise limitada; não certifica todos os timestamps de qualquer arquivo longo. Passo por quadro é rejeitado para VFR; seek por tempo continua disponível.
- EOF: reabre o arquivo privado, confirma reprodução e pausa antes de seek/frame. Evita tratar cursor/duração nulos em ENDED como arquivo inválido.
- Áudio: silencia o player reservado quando seu arquivo foi substituído; silencia os outros antes de habilitar o selecionado. O mock testa a política sem mudar o Programa real. As capturas PCM reais distinguem o áudio das câmeras, mas não equivalem a ensaio físico do Master.
- `obs-vmix/painel/remoto/replay.js`: informa limite medido dos cursores e confirmação pendente; não promete lock físico de câmeras.

Os patches Native, já aplicados/compilados pelo coordenador, corrigem preroll/reancoragem A/V, limpeza e apresentação do quadro selecionado, delta de relógio do sucessor, restart explícito privado depois de EOF, e uso opt-in do modo async unbuffered nos arquivos dos players Replay. Outros arquivos locais não recebem esse opt-in e fontes de rede mantêm false. Ver `native-patch/REVISAO.md`.

## Evidências separadas

| Evidência | Resultado e limite |
| --- | --- |
| `resultado-native.json` + `resumo-evidencias.json` | Original: 16/16 imagens pausadas e áudio independente passaram. Drift de67 ms falhou. |
| `resultado-final-debug-2.json` | Original em render ativo: cursores próximos divergiam até23 quadros no bitmap. Não basta ler o cursor. |
| `original-cadence-counter-audit.json` | Todos os960 quadros de cada clip original decodificados;956 pares comparáveis após offset −4 com diferença 0. A irregularidade visual não vinha da cadência desses arquivos. |
| `resultado-native-stage2-fail.json`, stage3 e stage5 | Falhas intermediárias preservadas: residual visual de2 quadros; não foram elevadas a PASS aumentando tolerância. |
| `resultado-stage5-coordinated-source-record-audio-fail.json` | Bitmaps dentro de1 quadro, mas medição por zero-cross em export AAC não confirmou o tom esperado. Falha preservada. |
| `resultado-stage5-coordinated-media-pass-close-fail.json` | 30 comparações com seeks/induções em 30/50/100% e81 comparações durante 90 s, todas≤1 quadro. Durante90s sem indução: zero correções coordenadas, zero pauses/seeks por polling. Seis capturas PCM reais passaram. O harness marcou FAIL no fechamento, mas ignorou a resposta de shutdown e havia filtros QA: não prova hang Native aceito. |
| `resultado-pcm-continuity.json` | Análise da mesma execução90s:91,022s PCM48 kHz,1280 pacotes, todosmuted; maior intervalo de silêncio0,02083ms, nenhuma janela de1s abaixo de RMS0,04; maior gap de timestamp+0,00695ms. Tom132 Hz em30%, coerente com desaceleração normal de pitch. Não é reexecução nem som do Master. |
| `resultado-eof.json` | Fonte realmente hidden (`active=false`, `showing=false`), seek1000ms apresentou o quadro esperado, passo+1 apresentou o próximo e resume avançou; REC continuou. Shutdown aceito, exit0/947 ms. |
| `resultado-audio-seek-transition-window-fail.json` | Janela1s que atravessava a troca440→880 Hz incluiu mistura868 Hz e falhou no limiar. Preservada. |
| `resultado-audio-seek.json` | Nova execução com janela estabilizada começando≥500 ms depois do comando:440 Hz antes e880 Hz depois, quadro223 após seek7000; shutdown aceito, zero outputs ativos, exit0/774 ms. Este critério não mede interrupção exata durante o seek. |
| `resultado-audio-policy.json` | Mock da política de exclusividade, troca de A/B e silenciamento de arquivo adulterado; não é mixer físico. |
| `rates/resultado.json` | FFprobe real diferencia NTSC30000/1001 de VFR33/67 ms; passos CFR usam taxa racional; VFR rejeita passo e taxas mistas usam tempo. |

A pausa coordenada das seis induções da execução90s durou77–157 ms; correção inteira153–381 ms. Pode produzir interrupção curta quando uma divergência real exige correção. Não houve esse loop durante os90s de reprodução normal. O áudio desacelera com o vídeo: A 440→132/220/440 Hz e B 880→264/440/880 Hz em 30/50/100%, respectivamente; não implementa time-stretch com pitch preservado.

## Reprodução e preservação

Use `bootstrap.mjs` com `FREEMIX_QA_NATIVE_RUNDIR` apontando ao snapshot autorizado, pins explícitos de EXE/obs/frontend e módulo FFmpeg. Nunca use raiz do operador ou altere RecordDirectory fora do clone. Os scripts Native criam clone e verificam executável antes de comandos. Fixtures/media e dependências estão em QA; não são executáveis portáveis de produto.

Snapshot autorizado: `qa-finalizacao/native-build-frozen-fb98b14` (2085 hashes no recibo do coordenador). EXE SHA256 `9f2c9f897a68a6c8eef84b74659306396a14f901e9fb9c31765105ef189e1991`; obs.dll `aec87137a73cc78aa088f28b08ee49ecbd5caa747e73cc036e574e8a1ed36271`; frontend `bd76bf520d8bab1445cacdc8898f96e3d247866773da9aa6c658f22496c642a9`; obs-ffmpeg Stage5 `bcbe9a7c867c2ecaa5778e59bfc5504236fee552df88d99589a4f2d6b94d8f09`.

`qa-pcm-probe.cpp` é instrumentação privada de QA, não recurso a instalar. Captura callback público após resample libobs/preMaster, float32 planar primeiro canal a 48 kHz, buffer pré-alocado limitado a 180 s, sem I/O no callback. Todos os players ficaram muted. `pcm-90s` preserva os dados e a DLLv1 da prova anterior; `coordinated-90s-images` preserva seus bitmaps. A DLLv2 remove leitura concorrente dos contadores durante start. A DLLv3 acrescenta hold/release de uma view nativa contendo somente a cena QA Playback Pair; a view é criada/removida na thread UI e não leva áudio ao hardware. O plugin não inicia sem a variável de ambiente de QA e não acessa microfones. DLLv3 SHA256 `ee2f810d1cb79564c60667b3feaced6af9ae988ece7ecff44d05d5a3e1534870`.

Para fechar clones, terminar capturas, desabilitar/remover filtros de render QA, parar REC, listar outputs ativos e exigir `shutdown_idle.success===true`. Uma solicitação recusada por outputs ativos não é evidência de hang. Scripts novos preservam resposta, outputs e exitcode.

## Limites que permanecem

Sem prova de câmeras físicas, placa SDI, drift de clocks independentes por horas ou genlock. Evidência visual é de bitmaps A/B no mesmo tick GPU para duas câmeras sintéticas e CFR30 fps; C/D validam NTSC/VFR e coordenação por tempo, não longa execução de quatro câmeras físicas. A cadência VFR é amostrada. A política exclusiva tem teste de requests e PCM individual muted; hardware/Master permanece gate separado. Audio durante seek pode ter descontinuidade curta; a janela de estabilização é explícita. O receptor alpha-web abortado não participa destes ensaios nem volta a ser solução entregue.
