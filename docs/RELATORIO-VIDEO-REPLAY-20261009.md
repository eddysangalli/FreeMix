# Vídeo e Replay — rodada posterior a 20261009033140

Estado: implementação e ensaio direcionado aprovados em QA própria. Operador e pacotes selados preservados. Fontes congeladas após a prova.

## Implementação

- NDI Fill+Key: wrapper por instância sobre SDK oficial, mantendo o output DistroAV original quando não solicitado. Duas identidades, mesma captura/timecode e áudio apenas no Fill. Headers oficiais com copyright e licença MIT preservados em `frontend/widgets/vendor/freemix-ndi`; runtime já licenciado/pinado da entrega anterior.
- OMT PA16 SDR: render da fonte em GS_RGBA16F, staging half-float e conversão BT.709 YUV16 + alpha16. Não expande um buffer BGRA8. Fontes que já chegaram quantizadas continuam com seus limites. A rota não promete HDR: o SDK instalado/atual só declara BT601/709 e a seleção HDR é recusada pelo motor.
- SDI: configuração por perfil `freemix-sdi.json`, leitura posterior, device/mode/keyer validados nas propriedades do output DeckLink original. View própria e áudio UUID/M/A/B, sem auto-start. Keyer externo é fornecido pela placa compatível; hardware ausente causa erro antes da criação do output. Esta rota permanece SDR.
- Replay: quatro players A/B/C/D com transporte, seek, quadro e áudio exclusivo do Programa. Calibração automática em até dez segundos de áudio comum, +/- dois segundos, recusando silêncio e correspondência ambígua. Ajusta offsets em quadros e confirma cursores nativos; não cria genlock físico nem resolve drift ilimitado de relógios de captura.
- Recuperação explícita de arquivo: FFmpeg descarta pacotes corrompidos e reencoda até120 segundos em uma nova cópia MKV. A cópia é decodificada integralmente antes de integrar a lista; original preservado e perda possível declarada. Arquivos sem dados decodificáveis são recusados.

## Evidência já disponível

`replay-quatro-logica.json`: PASS4 para quatro IDs/targets, correlação de atraso186.5ms fora da grade e silêncio recusado. Sintaxe dos módulos JS modificados aprovada.

`replay-calibracao-estado.json`: PASS3 para respeitar a âncora explicitamente solicitada, converter100ms em3quadros e reverter metadados caso o motor recuse alinhamento. Esta revisão foi ensaiada com PCM real da fixture e erro de seek controlado, sem reabrir o motor.

`video-replay-integrado.json` consolida os recibos:

- `ndi-fillkey-receiver.json`: PASS5, dois receivers do SDK oficial decodificaram Fill/Key, mesmas timecodes, alpha0/128/255, RGB premultiplicado e nenhuma faixa de áudio no Key.
- `omt-pa16-receiver.json`: PASS3, 105 quadros PA16 com flags HighBitDepth/Alpha e alpha49152, valor que não corresponde a expansão BGRA8 por257. A fonte era composição de duas camadas alpha128; render/staging GS_RGBA16F mantiveram a precisão adicional.
- `video-replay-nativo.json`: quatro players carregados no motor, áudio comum identificou offsets3/6/9 quadros, os quatro cursores confirmaram1000/1100/1200/1300ms, takeD preservou áudio exclusivo, TS truncado virou cópia MKV integralmente decodificada, original intacto. Dispositivo SDI inexistente foi recusado antes de iniciar output.
- `video-replay-qa-fechada.json`: outputs inativos, shutdown_idle/qaClose e término normal do PID45508 confirmados, sem remoção forçada durante este ensaio aprovado.

EXE testado: `7e84b16e44080f7cb2e635110f8703ee14abfa7db81cc271f2aac591b0b9b72e`; obs-ffmpeg: `2376ee21a90e67742f40e81257bba0b994ab45cf205ef9f413af441311b0bc05`.

A primeira preparação encontrou crash real em GetOutputList após SetVideoSettings: outputs RAW inativos conservavam ponteiro video_t anterior. Crash/log/identidade estão preservados em `video-replay-reset-crash`; raiz corrigiu libobs separadamente. A prova acima configurou320x180 offline antes de abrir e não atribui a si validação do patch libobs. Também foi corrigida variável de áudio não declarada no probe JS; repetição limitou-se ao bloco Replay.

QA usada exclusivamente em `FreeMix-QA-Video-Replay-20261009`, WS14520/API18220, agora fechada normalmente. Não atribuir provas anteriores a esta implementação.

## Referências primárias

- [NDI SDK frame types](https://docs.ndi.video/all/developing-with-ndi/sdk/frame-types): estruturas BGRA/BGRX, alpha, timecode e PA16.
- [NDI SDK distribuição](https://docs.ndi.video/all/developing-with-ndi/sdk/software-distribution): contrato específico/termos já acompanhando runtime do produto.
- [OMT libomt oficial](https://github.com/openmediatransport/libomt): PA16/P216 e limites de espaço de cor no header atual.
- Fontes OBS locais `plugins/decklink/decklink-output.cpp` e `libobs/graphics/graphics.h`: dispositivos/modos/keyer e render/staging reais.

## Limites restantes

HDR completo requer contrato/codec/metadata compatível; não é implementado por escrever um rótulo HDR. SDI/HDR físico, keyer/genlock da placa e câmeras independentes requerem hardware. A calibração exige áudio comum gravado e suficiente sobreposição; não sincroniza conteúdo sem referência comum. Recuperação não restaura pacotes perdidos nem índices impossíveis de reconstruir.
