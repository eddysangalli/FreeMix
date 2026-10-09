# Regressão SRT e guards SDI — Native 19

Execução local em 09/10/2026, sem hardware, operador, vMix, publicação ou conexão externa. Fontes Native não foram alteradas por esta regressão. Conjunto congelado pelo root em `qa-finalizacao/native-build-frozen-fb98b14`, HEAD `fb98b14c071fa89146f74dc8c26157c2ce9026ee`. A execução sobrepôs o rundir completo num clone TEMP próprio e conferiu os 88 EXEs/DLLs, incluindo:

| Artefato | SHA256 |
| --- | --- |
| FreeMix.exe | 9f2c9f897a68a6c8eef84b74659306396a14f901e9fb9c31765105ef189e1991 |
| obs.dll | aec87137a73cc78aa088f28b08ee49ecbd5caa747e73cc036e574e8a1ed36271 |
| obs-frontend-api.dll | bd76bf520d8bab1445cacdc8898f96e3d247866773da9aa6c658f22496c642a9 |
| decklink.dll | afd47d501df16f76d53c4f9de2ada9c5450873c1b1366ee1a3cd9abbc1e1bfeb |
| obs-ffmpeg.dll | bcbe9a7c867c2ecaa5778e59bfc5504236fee552df88d99589a4f2d6b94d8f09 |

## SRT: PASS, 11 capturas decodificadas

Recibo: `qa-finalizacao/srt-pos-seek-native19-scoped-retry/resultado.json`. Código de saída do ensaio e do Native: zero. Novos crashes: nenhum. Portas WS/API TCP e quatro portas SRT UDP efêmeras, todas em loopback; PID conferido via vendor antes de enviar comandos. Zero saídas ativas no final.

Quatro saídas partiram simultaneamente. A dimensão lógica escolhida foi 320×240; packed envia 640×240. O receptor foi FFmpeg/SRT com decodificação por FFprobe/FFmpeg, não vMix.

| Caminho | Formato recebido | RGBA estático | Arquivo após chroma e seek |
| --- | --- | --- | --- |
| packed420 | H.264 High, yuv420p | 90 frames/3 s | 180 frames/6 s |
| packed444 | H.264 High 4:4:4 Predictive, yuvj444p | 90 frames/3 s | 180 frames/6 s |
| Fill420 | H.264 High, yuv420p | 90 frames/3 s | 180 frames/6 s |
| Key420 | H.264 High, yuv420p | 90 frames/3 s | 180 frames/6 s |

Na imagem RGBA, packed420, packed444 e Key separado preservaram amostras de máscara exatas 0/128/255. Os três fluxos com cor tinham áudio AAC aproximadamente 440 Hz, RMS 0,088. O Key também transporta frames AAC, mas o PCM decodificado teve pico e RMS exatamente zero: a evidência é silêncio, não ausência de faixa AAC.

Para o arquivo foi gerado um MP4 de oito segundos, 30 fps, com fundo verde opaco, retângulo vermelho antes de quatro segundos e azul depois, AAC estéreo 48 kHz/440 Hz. A transparência foi produzida pelo filtro Native `chroma_key_filter_v2`, não pela página/GC. Foram enviados seeks para 5000 e 1000 ms; após 150 ms o Native informou 5133 e 1100 ms. Nos três fluxos de cor foram decodificados 124 frames vermelhos e 56 azuis. A máscara pós-chroma tinha fundo 0 e interior opaco 255. Fill e packed mantiveram áudio aproximadamente 439,27 Hz/RMS 0,0876–0,0877, e Key permaneceu PCM zero.

Em todas as onze capturas, PTS de vídeo e áudio foram estritamente crescentes. O maior intervalo entre frames foi aproximadamente 33,334 ms no vídeo e 21,334 ms no AAC. Isso comprova a continuidade do transporte em cada captura apesar dos seeks; não demonstra um relógio comum garantido entre dois receptores Fill/Key. O capability `srtSeparateFillKeyFrameLocked` continua falso.

A primeira escuta packed420 foi encerrada após 60 frames. Sem comandos de stop/start no emissor, uma segunda escuta na mesma porta recebeu outros 60 frames, máscara e áudio válidos; tempo até concluir essa segunda captura: 7243 ms, incluindo seus dois segundos de vídeo. Depois houve stop/start explícito, com nova captura de 60 frames válida. Esse reset foi stop/start, não uma API fictícia `reset`.

### Por que o Master deu silêncio

As tentativas `srt-pos-seek-native19` e anteriores mantêm recibos FAIL. A fonte MP4 tinha mute=false, volume=1 e Track1=true, mas isso não garante áudio ativo no Master. No ensaio seguinte, a cena/item estavam escolhidos no PGM e habilitados, enquanto `GetSourceActive` informou `videoActive=false`/`videoShowing=false` antes da configuração do bus. O view de vídeo independente da saída não prova ativação de áudio na mesa. Não foi comprovado um defeito do decoder de áudio/seek por essas tentativas.

A execução PASS desligou todas as tracks globais do MP4 e criou um `freemix_audio_bus` público dedicado, com a fonte MP4 UUID/gain1. Esse bus isolado mantém a fonte ativa por lease e foi selecionado em `audioSourceUuid` das saídas. Não houve abertura de áudio no Master. A seleção direta de UUID do MP4 é recusada pelo contrato atual: `audioSourceUuid` exige bus público independente com tracks globais desligadas. Esse detalhe precisa aparecer claramente na interface de áudio por origem.

A interface existente já oferece esses buses no campo Áudio (`Bus independente · nome`) e tem criação/membros/rotas na tela Áudio. O campo Áudio foi trazido para a parte principal do formulário SRT simplificado, antes de Avançado. Foi acrescentado ali um guia curto: explica Master, bus independente, A/B e silêncio da Key conforme a escolha, com os passos para configurar o bus na tela existente. Não duplica o editor de barramentos, não cria bus ao abrir e não inicia saída. O teste `resultado-srt-audio-guide-ui.json` passou com os dois módulos reais em Edge isolado: seleção/guia visíveis antes de Avançado, seleções reais do formulário, largura600px, zero erros de página e zero chamadas de API.

## SDI: seis guards negativos PASS

Recibo final: `qa-finalizacao/sdi-hdr-guards-native19/resultado.json`, com log Native ao lado. O mesmo conjunto 19 terminou exit0 e sem novos crashes. Foram conferidos: início inativo; rejeição de SDR rotulado HDR; rejeição de HDR+keyer/alpha/FillKey; reconhecimento do UUID de uma fonte HDR; recusa de hardware indisponível antes de ativação; impossibilidade de persistir/iniciar automaticamente uma configuração inválida.

O erro atualizado foi recebido: “Plugin/driver DeckLink não inicializou ou esta versão não expõe o contrato HDR. Verifique Desktop Video/placa e a versão do FreeMix”. `pluginLoaded=false`, `hdrOutputImplemented=false`, `decklinkCapabilitiesActuallyQueried=false`: o suporte físico HDR em runtime é inconclusivo porque o módulo DeckLink não inicializou. Os guards não substituem compilação/contrato/mocks SDK já registrados, nem homologam sinal SDI físico.

## Tentativas preservadas e limites

- `srt-pos-seek-stage4`: FAIL do coletor ENOBUFS (limite RGB32MB), Native exit0/crashes[]. Corrigido120MB.
- `srt-pos-seek-stage4-retry`: FAIL da medição sem histerese, que contou ruído AAC junto à passagem por zero. Medição com bordas250ms/histerese ±0,003 mostrou440,19Hz. A instrumentação final usa essa medição.
- `srt-pos-seek-stage4-retry2`, `retry3`, `srt-pos-seek-native19`: PCM zero no Master sem comprovação de áudio ativo; resolvido no ensaio isolado com bus dedicado, sem atribuição indevida ao seek.
- `srt-pos-seek-native19-scoped`: FAIL por request WS inexistente `GetInputActive`; corrigido para `GetSourceActive`. Native exit0/crashes[].
- `srt-build926-snapshot.json`: snapshot rejeitado, não executado; core mudou durante a integração. O ensaio final usou exclusivamente o conjunto19 congelado e verificado.

Os logs de shutdown continuam reportando uma alocação não liberada, padrão também observado em outras provas locais. Este ensaio não identificou a origem nem provou crescimento; não atribuir automaticamente a upstream.

Não houve retomada do receptor alpha WebBrowser abandonado pelo usuário. Esta prova curta em 320×240 não homologa WAN/ZeroTier, carga em1080p/4K, vMix4:4:4, synchronismo físico entre portas, HDR SRT, latência fim a fim ou SDI físico. A bridge Native SRT→NDI permanece uma ferramenta separada com seu próprio relatório/endurance.

## Reprodução

O harness SRT gera seus próprios WAV/MP4 e usa a imagem RGBA de QA existente. Exige Node, o snapshot de QA com runtime FFmpeg/FFprobe, e define raiz TEMP/portas próprias. Para o conjunto19:

```powershell
$env:SRT_QA_SNAPSHOT='qa-finalizacao/srt-build19final-snapshot.json'
$env:SRT_QA_FOLDER='qa-finalizacao/srt-pos-seek-native19-nova-execucao'
$env:SRT_QA_AUDIO_BUS='1'
node qa-finalizacao/test-srt-post-seek-stage4.mjs
```

O diretório de recibo deve ser novo. Reutilização opcional aceita somente recibo de um Native QA próprio encerrado com exit0, verifica o caminho TEMP e todos os binários antes de abrir outra instância. Não apontar para instalação/porta do operador. Snapshot TEMP e capturas grandes são evidência local, não payload de release.
