# Saídas, Mix 2, MultiGravação e Replay — conferência de 08/10/2026

Raiz exclusiva: `C:\Users\eddyr\AppData\Local\Temp\FreeMix-QA-Parallel-Outputs-20261008`, WS 14478, API 18100. Fontes sintéticas AV Red/AV Blue; nenhum preset ou processo do operador foi modificado. Binário compilado pelo agente principal, hash em `outputs-avancados-native-hash.json`.

## Evidência executada

| Recurso | Verificação | Receipt |
|---|---|---|
| Mix 2 horizontal/vertical independente | Preview azul e Programa vermelho, Fade para azul, Programa principal continua vermelho, vídeo real 360×640 | `outputs-avancados-cycle-1.json` a `-3.json` |
| Encoder e FPS por destino | CPU x264 a 15 FPS junto com GPU NVENC e Preview a 30 FPS; dimensões, duração e pixels via FFprobe/FFmpeg | mesmos receipts |
| Parada e encerramento | Flush normal, três processos encerrados por `shutdown_idle qaClose`, logs completos, nenhum novo crash nem Double destroy | `outputs-avancados-cycles-resultado.json` |
| Overlay por destino | Mapeamento pela base/ordem real DSK; saída sem overlay conserva vermelho; saída selecionada recebe overlay | `outputs-avancados-overlay-resultado.json` |
| Escala de gráficos | Retângulo em canto de canvas 1280×720 aparece na coordenada esperada de destino 640×360 | `outputs-avancados-tarja-resultado.json` |
| Saúde das fontes | UUID, dimensões, atividade e flags reais; sinal/congelamento permanecem unknown | receipt da tarja |
| SRT / RIST | Saída nativa recebida por FFmpeg local, vídeo+áudio 640×360 e duração reproduzível | `outputs-avancados-srt-resultado.json`, `-rist-resultado.json` |
| Perfis de saída | Salvar/carregar conteúdo, tamanho, FPS e overlays; sem salvar chave e sem iniciar saída | `outputs-avancados-profiles-resultado.json` |
| ISO por entrada | Pastas e tamanhos próprios, CBR, 15 FPS e seis trilhas na entrada configurada | `outputs-avancados-iso-resultado.json` |
| MP4 seguro | Grava MKV, converte para MP4 no fechamento, preserva MKV de recuperação | receipt ISO |
| Replay importação/ordem | Dois clipes reais importados, ordem alterada preservando UUIDs | receipt ISO |
| Replay seek | Cursor/estado/duração lidos do motor e seek A/B ligados | `outputs-avancados-replay-seek-resultado.json` |
| IN interrompido | Filtro real interrompido; IN conservado; recover-in gera clipe e limpa IN | `outputs-avancados-replay-recovery-resultado.json` |
| API persistente | Primeiro fechamento/reabertura conserva PID API e retorna connected/transportConnected corretos | `outputs-avancados-api-reconnect-resultado.json` |

## Limites

- Os três ciclos de encerramento acima reiniciaram a API própria entre boots. Isso valida o teardown nativo, e não a reconexão da API persistente; a frente de recuperação está tratando essa última condição.
- Com o patch de reconexão atual, um ciclo adicional passou sem reiniciar API. O segundo foi interrompido por falha de inicialização D3D11 (`device_create 887A0004`), antes de carregar o backend; health informou corretamente desconexão. Log preservado em `archived/diagnosticos/qa-outputs-device-create-20261008-144138`. Não foi classificado como sucesso de boot nem como crash da aplicação. A QA que falhou e sua API própria foram encerradas, preservando todas as outras instâncias.
- O Mix 2 usa canvas próprio e enquadramento proporcional fit/fill. Não representa um editor completo com transformações independentes por cena.
- FPS usa divisores do FPS do projeto. Não há arbitrariamente qualquer taxa diferente do projeto.
- Os gráficos de saída preservam proporção e centralizam no destino. Gráficos com composição vertical própria podem ser usados como fontes independentes.
- NDI/OMT mantêm o programa principal e Master na implementação de rede atual. A seleção livre de conteúdo de rede não foi implementada nesta frente.
- SRT/RIST foram testados localmente. Internet, perda, latência prolongada e receptores físicos permanecem testes separados.
- MP4 seguro mantém MKV, portanto usa espaço extra até eventual remoção manual do original. Não anuncia MP4 fragmentado sem validação do plugin.
- Seek e ligação A/B respeitam quantização de quadros. Não são promessa de sincronismo quadro a quadro; a verificação de clipe 15 FPS a 50% tolera um quadro (~133 ms).
- SDI físico e bonding precisam equipamento/receptor e ensaio real. Não há botões que simulem essas capacidades.

Um crash anterior, antes da correção de lifecycle, foi preservado pelo agente principal em `archived/diagnosticos/crash-qa-outputs-20261008-135116`. Os últimos três ciclos não criaram novo relatório de crash.

## Complemento final — crop, Stinger e descarte das saídas

- `outputs-avancados-short-resultado.json`: posição horizontal real do recorte, vermelho à esquerda e azul à direita, medida no MKV; Stinger OBS configurado copiado para o Mix 2 com vídeo amarelo real entre vermelho e azul, sem trocar o Programa principal. Após três stops, `GetOutputList` respondeu e não encontrou outputs `freemix_destino_*` retidos.
- `outputs-avancados-stinger-audio-resultado.json`: fixture com áudio RMS 0,089; Master do arquivo ficou RMS 0 antes e durante o Stinger. A mídia privada é silenciada/mixers 0, preservando o bus escolhido. O áudio próprio do Stinger não é somado à saída independente nesta implementação.
- O Mix 2 possui posição X/Y, zoom e escolha de uma transição realmente configurada na lista OBS. A transição é criada como cópia privada; não modifica timing/settings da transição principal. O Stinger foi validado com vídeo sem alpha e tom sintéticos; track matte/alpha/carga longa não foram homologados. Merge não foi implementado como alias.
- Corrigido incremento duplo de referência em `OnOutputStop`; cleanup passou a usar geração, destruindo output antes de liberar view/encoders. Leitura `get_destinations` é serializada na UI; o mutex dos destinos é liberado antes de parar o worker. O hang SRT anterior não tinha stack preservada e não foi reproduzido; o teste integrado novo de Calls confirmou vídeo/áudio e stop sem outputs retidos em `bonding-nativo-real.json`.
- A QA nativa PID 86032 encerrou normalmente e sua API PID 33984 foi encerrada com identidade e desconexão verificadas. Log final `2026-10-08 15-28-21.txt` tem footer e `Number of memory leaks: 14`; não é evidência de ausência universal de leaks.
- O launcher do ensaio usou inicialmente ferramentas QA antigas e não confirmou readiness; o WS nativo identificado respondeu e os testes passaram. Depois de sincronizar os módulos atuais somente nessa QA e reiniciar sua API, o launcher reconheceu o motor existente e o controle conectado. Esse reaproveitamento não substitui uma prova de novo boot da entrega final.


## Mixes 2/3/4, Stinger privado e Merge — 2026-10-08T19:25:07.613Z

Implementação: três mixes com Preview/Programa/Take próprios, resolução/enquadramento/crop e transição própria; cada destino associa mixId. O som do Stinger é capturado somente da mídia privada do clone e somado ao Master/A/B escolhido naquele destino, com buffer limitado de 80 ms e opção de desligar. Nenhum PCM é escrito de volta no Master. Persistência mantém freemix-destinos.json.mix2.json compatível com o Mix2 anterior.

Evidência: outputs-avancados-mixes-resultado.json passou 10 verificações de identidade, vídeo/áudio, isolamento e liberação. Quatro arquivos reais foram gravados juntos: Mix2 horizontal com Stinger, Mix3 vertical com Fade, Mix4 e Programa principal. Análise espectral confirmou BusA440+Stinger880 no destino0, BusB660 no destino1 e Master220 sem880. O ensaio apontou uma falha geométrica no Merge que foi corrigida e conferida separadamente em outputs-avancados-merge-resultado.json (4 verificações), no binário 48e50ab4936c6b3dbf3e92ebd72ad4dd4954e30c38c099b8da726c85ca633825.

Merge real usa Move Transition 3.2.1 instalado: fontes compartilhadas são interpoladas via cópias privadas de referências, sem alterar seus itens originais. Os frames outputs-avancados-merge-before/during/after.png registram posição inicial, intermediária e final; a análise de todos os frames confirmou movimento progressivo. Plugin ausente é rejeitado explicitamente, sem renomear Fade. Proveniência e licença: outputs-avancados-move-provenance.json e move-transition-provenance/LICENSE.txt/source.zip.

Limites: quatro destinos extras, três mixes independentes; Merge depende do plugin Move incluído. Não declara equivalência integral com todos os comportamentos do vMix, qualidade WAN, hardware físico, NDI/OMT de mix independente nem ausência de vazamentos. Somente raízes/portas QA privadas utilizadas, sem saída externa.


## Codecs e protocolos originais — 2026-10-08T20:06:42.900Z

C++/UI/OutputEngine agora descobrem H.264, HEVC/H.265 e AV1 pelos encoders carregados e filtram tipos internos/depreciados. Cada saída persiste protocol (auto/RTMP/RTMPS/SRT/RIST/HLS) e enhancedRtmp. O início confere codec versus backend/mux e serviço reais; RTMP HEVC/AV1 exige confirmação do destino Enhanced RTMP. Não pressupõe capacidade do servidor remoto. Gravação de teste usa MKV, compatível com esses codecs.

Serviço público freemix_hls usa server/key, protocolo HLS e backend original ffmpeg_hls_muxer; publica via HTTP PUT. Define codecs suportados pelo backend real (H264/HEVC conforme build), AAC e repeat_headers; pode ser usado também por SetStreamServiceSettings da mesa principal. Nenhum encoder/protocolo é renomeado para imitar outro.

QA outputs-avancados-codecs-hls-resultado.json: 11 verificações PASS em raiz/portas isoladas. NVENC HEVC e AV1 produziram MKV640x360/15FPS com AAC, duração superior a5s e decode efetivo. HLS original recebeu PUT de playlist e segmentos H264/AAC no endpoint127.0.0.1:59262. Rejeições SRT/AV1, HLS/AV1 e RTMP/AV1 sem confirmação ocorreram antes de conectar. GetOutputList apósparada não manteve destinos. Binário: 074dfe583c989abab98ce74e35c49113fddda0d8fe2c08be84e2aadc188e8529.

Capacidades runtime verificadas: RTMP h264/hevc/av1; SRT/RIST h264/hevc; HLS h264/hevc. A DLL SRT instalada é maiscapaz que a declaração da fonte inicialmente inspecionada; a descoberta usa a DLL carregada. Primeira fixture tentou negar SRT/HEVC incorretamente e foi corrigida paraAV1; outputs-avancados-codecs-hls-runtime-capabilities.json preserva esse resultado.

Limites: prova de HEVC/AV1 em MKV e HLS H264 em loopback. Não declara recepção Enhanced RTMP por plataformas externas nem prova HLS HEVC por receptor externo. Inicialização do encoder ainda podefalhar por dispositivo ocupado/driver; erro nativo éretornado. As saídas extras usam AAC160kbps. Projeto segue8bit/NV12; HDR/10bit não foiadicionado.

Fontes primárias: https://github.com/obsproject/obs-studio/blob/master/plugins/obs-ffmpeg/obs-ffmpeg-hls-mux.c e https://github.com/obsproject/obs-studio/blob/master/plugins/obs-outputs/rtmp-stream.c; conferidas junto à fonte local e capabilities runtime.


## MultiGravação ISO — codecs reais (2026-10-08T20:16:46.266Z)

replay-disco.mjs consulta os encoders do motor nativo ao configurar e novamente ao começar; aceita H.264, HEVC/H.265 e AV1 realmente carregados. Opções por entrada herdam as globais antes da validação. AV1 com TS é recusado antes de criar filtros; MKV e MP4 seguro são permitidos. A confirmação de gravação exige pacote de vídeo com o codec escolhido, além da existência do arquivo.

A tela iso-avancado.js identifica o codec na lista dos encoders e explica a restrição de TS. Para NVENC sem bitrate usa CQP/QP; com bitrate usa CBR. Scale_type Bicubic explícito faz a resolução escolhida valer para o encoder GPU. A primeira prova detectou escala desligada e está preservada em outputs-avancados-iso-codecs-before-gpu-scale-fix.json. MP4 seguro mantém o MKV original e remuxa HEVC com tag hvc1.

outputs-avancados-iso-codecs-resultado.json: 9 PASS. Source Record/NVENC escreveu HEVC e AV1 por entrada na mesma sessão, com AAC,640x360/15FPS. MKV e MP4 mantiveram o codec; os MP4 foram decodificados por FFmpeg. HEVC recebeu hvc1. Validações negativas de AV1+TS global e per-input herdado passaram. QA própria PID77736 foi salva e fechada normalmente; API própria86972 encerrada após confirmar motor fechado. Não requer compilação C++; foi usado o mesmo Build1 do recibo codecs/HLS.

Limites: qualidade numérica depende das propriedades de cada encoder; não se afirma equivalência visual CRF/QP entre fabricantes. Teste exercitou NVENC com bitrate; outros encoders carregados são candidatos e podem falhar na inicialização do hardware. HDR/10bit não foi acrescentado. Replay mantém o preset TS que já usava; a nova seleção de codec pertence à MultiGravação ISO.
