# Replay: proposta de correção de apresentação

Status: cinco patches aplicados e compilados pelo coordenador; ensaios reais de apresentação e PCM registrados no README desta QA. Nenhuma leitura de cursor substitui a comparação visual. O candidato213415 permanece imutável; estes patches pertencem a uma integração posterior.

Aplicar em ordem:

1. `replay-seek-presentation.patch` — SHA256 `80ef3254ef26bbceb0f4d20c2d4a0e637e39a3ddbc679d12737cbbd8a8f6d70b`.
2. `replay-seek-reactivate.patch` — SHA256 `15e1333ea2dd4cedc35781dc52e564f05a840442676e440455fd272bd1b187c0`.
3. `replay-seek-clock-delta.patch` — SHA256 `cfdc0f65197ba107505166b898bbb34caba1ac67e3ba9c0e9dcba5401384984c`: mantém seek_next_ts até calcular o delta do sucessor; evita dois frames imediatos.
4. `replay-restart-offair.patch` — SHA256 `c5361138fc6900fcf4aa48fecc550abafb18eaf68d09fe23bab6cbf812fec170`: restart explícito permitido quando showing ou quando close_when_inactive=false. Mantém guard de fonte normal fechada/inativa.
5. `replay-unbuffered-optin.patch` — SHA256 `0ae874d3628762beb46e69e31df16184d69b040ec8222ca39e68652542fada5d`: API pública obs_source_set_async_unbuffered opt-in apenas em arquivo local com freemix_replay_unbuffered=true; default/rede false.

Allowlist: `freemix-app/shared/media-playback/media-playback/media.c`, `freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c`. Nenhum muxer SRT, SDI/OMT ou libobs alterado.

## Revisão dos efeitos

- Playback local sem seek: decode/codec permanece; GetCurrentTime passa a refletir o PTS submetido da imagem, deixando de antecipar quadro/pacote do decoder. Isso é confirmação de submissão, e não genlock ou timestamp medido no cabo.
- Seek pausado: preroll já existente seleciona o primeiro frame em/depois do timestamp. O novo relógio comum A/V é reancorado, a imagem anterior e buffers async são descartados, e o frame selecionado é mostrado sem consumir o frame pronto. `obs_source_show_preloaded_video` é necessário após limpar async_active; também reinicia timing e buffer de áudio, impedindo áudio da posição antiga.
- Seek em reprodução: mesma seleção/preroll, frame imediato e próximo callback regular seguem o novo relógio. Não adiciona pausas repetidas por polling.
- Resume local: não soma a posição absoluta ao timestamp da apresentação. O caminho streaming continua usando a soma upstream. Rotas full_decode/cache não usam esses timestamps de apresentação.
- EOF: guard de preroll/EOF preservado. OBS WebSocket expõe ENDED com cursor/duração nulos; o JS reabre o arquivo privado por restart, confirma estado e pausa antes de selecionar o ponto. O ensaio hidden real confirmou bitmap do seek e passo+1, resume e fechamento normal.
- Descontinuidade de áudio: buffer antigo é limpo no seek; pode haver uma interrupção curta nesse comando intencional. Precisamos medir ausência de áudio antigo, retomada do novo trecho e continuidade durante reprodução normal.

## Provas preservadas

`resumo-evidencias.json`: original16/16 imagens pausadas e áudio440/881Hz PASS; drift67ms FAIL. `resultado-final-debug-2.json`: vinte amostras com views `videoShowing=true`, PGMQA intacto e REC crescendo; divergência visual até23quadros versus cursores0–34ms. Fechamento821ms exit0.

NTSC31→1034ms, VFR3000ms e mixedrates2ms passaram no mesmo Native antigo. Cadência VFR passa agora por amostragem limitada dos PTS no início/meio/fim; não é prova de todos os timestamps de um arquivo arbitrário.

## QA compilada

Em ambiente filho, configurar `FREEMIX_QA_OBS_FFMPEG` como caminho da nova DLL e `FREEMIX_QA_OBS_FFMPEG_SHA256` como seu hash esperado; executar `node qa-finalizacao/replay-sincronia-native/test-native-patch.mjs`.

O bootstrap copia somente à raiz TEMP própria, usando FREEMIX_QA_NATIVE_RUNDIR opcional e pins explícitos. Snapshot fb98b14 EXE `9f2c9f897a68a6c8eef84b74659306396a14f901e9fb9c31765105ef189e1991`; Stage5 obs-ffmpeg `bcbe9a7c867c2ecaa5778e59bfc5504236fee552df88d99589a4f2d6b94d8f09`, LocalVocal/SceneSwitcher corrigidos e NDI6.3.2. Sem hardware, transmissão, som audível, mudanças do Programa ou instâncias do operador. Critério CFR: cursores≤1quadro e contadores A/B em screenshot GPU simultâneo≤1quadro; estados confirmados e REC contínuo. VFR: rejeição de passo por quadro, seek por tempo e bitmap selecionado. README separa passes de mídia, EOF/áudio, falhas intermediárias e problema do antigo harness de fechamento.

Apenas o opt-in unbuffered não bastou: falha de2quadros preservada em resultado-native-stage5-deadband1-fail.json. A coordenação limitada no JS foi necessária para estabelecer a mesma fase de apresentação. Durante90s normais houve zero pausa/seek de correção; seis induções exigiram pause77–157ms e correção153–381ms. Não promete lock físico nem invisibilidade da correção.
