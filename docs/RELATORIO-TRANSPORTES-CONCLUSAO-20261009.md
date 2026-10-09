# Vídeo, saídas e rede — rodada de conclusão 09/10/2026

## Entregue em fonte e validado localmente

- **SRT Fill/Key:** Key agora transporta AAC silencioso; Fill e packed mantêm o áudio escolhido. Evita duplicar áudio quando o receptor combina duas entradas. Não transforma duas conexões em genlock.
- **NDI/OMT Fill+Key:** corrigida conversão de RGB premultiplicado do render para RGB direto no Fill. O SDK NDI exige RGB direto em BGRA/BGRX; usar RGB já multiplicado pelo alpha escurecia as áreas parcialmente transparentes. A máscara conserva o alpha original. OMT com alpha numa única fonte continua premultiplicado e sinalizado; somente o Fill opaco da dupla é convertido.
- **SDI/HDR:** discovery declara `hdrSupported:false` e `unsupported_in_integrated_sdr_path`. A falta é de contrato/caminho integrado, além de equipamento; não apenas de conectar uma placa.
- **Kit Linux:** corrigidas aspas do teste de portas e removido bloco duplicado no instalador. O script passou em `bash -n`. Nenhum serviço foi instalado/publicado.
- **Bonding existente:** repetida prova UDP local com perda, retirada/reentrada de caminho e AES/FEC. Isso continua sendo FMXB próprio, sem interoperabilidade automática com srtla.

Fonte primária para o contrato NDI: [Frame Types, BGRA/BGRX](https://docs.ndi.video/all/developing-with-ndi/sdk/frame-types), RGB não premultiplicado. Usamos SDK/runtime próprios, sem extrair bibliotecas dos produtos dos amigos.

## Recibos e identidade

Build Native principal testada: `09ae2e0f2c72df7e4245df2cb616ba3ede281fe28eb9dc2a6cde0e9b91df105e`.

| Prova | Recibo | Resultado / limite |
|---|---|---|
| SRT packed, Fill e Key | `qa-finalizacao/resultado-srt-key-silent-conclusao-retry-20261009.json` | 90 quadros H.264 4:2:0 em cada saída; Fill/packed RMS 0,088; Key RMS/peak zero; máscara 0/128/255 e MAE zero; encerramento exit0, sem novo crash. |
| NDI FillKey oficial | `qa-finalizacao/resultado-native-ndi-fillkey-conclusao-final-20261009.json` | 116 timestamps comuns; Fill RGB azul255 com alpha128/255 original; Key corresponde à máscara; áudio somente Fill. |
| NDI FillKey com reconexão | `qa-finalizacao/resultado-native-ndi-fillkey-reconnect-20261009.json` | Stop/restart com receptores mantidos:172 timestamps comuns, RGB/máscara corretos,199 frames de áudio no Fill e zero no Key; encerrou exit0. |
| NDI áudio sustentado | `qa-finalizacao/resultado-native-ndi-fillkey-sustained-20261009.json` | Recepção concorrente:179 timestamps comuns e284.672 amostras PCM; RMS0,0625 e440,09Hz, áudio com PTS monotônicos depois de stop/restart, Key sem áudio, exit0. |
| OMT FillKey com reconexão | `qa-finalizacao/resultado-native-omt-fillkey-conclusao-20261009.json` | 191 timestamps comuns; stop/restart com receptores mantidos; RGB/máscara corretos; Key sem áudio. Presença de áudio comprovada, não homologação de continuidade prolongada de áudio. |
| OMT áudio sustentado | `qa-finalizacao/resultado-native-omt-fillkey-sustained-conclusao-20261009.json` | Recepção concorrente Fill/Key:187 timestamps comuns e297.984 amostras PCM; RMS0,0625 e440,08Hz, PTS de áudio monotônicos inclusive após stop/restart, Key sem áudio. A fixture serial anterior subamostrava áudio porque bloqueava esperando vídeo do Key. |
| Bonding UDP | `qa-finalizacao/resultado-bonding-adaptativo-conclusao-20261009.json` | 8 checks; 6 perdas por XOR recuperadas; blackhole retira rota; reentrada autenticada. `wanVerified:false`. |
| Contratos de argumentos/formato | `qa-finalizacao/resultado-output-contracts-20261009.json` | 14 checks. Não é teste físico. |
| Kit servidor | `qa-finalizacao/resultado-server-kit-syntax-20261009.json` | Parse Bash das duas cópias PASS. Não é execução em VPS/Linux. |

Falhas iniciais das fixtures foram preservadas: timeout de 20s menor que uma primeira partida de aproximadamente35s, e WebSocket disponível antes de o Native terminar de carregar. A fixture final espera prontidão por até90s e confere PID antes de alterar cenas. Não houve alteração da configuração do operador.

## Receptor nativo alpha separado

`obs-vmix/ferramentas/native-alpha-bridge/main.cpp` implementa decode FFmpeg no próprio processo, recebendo Fill à esquerda e máscara à direita, recompondo BGRA com alpha e entregando uma fonte NDI com áudio estéreo48k. Não usa HTML, navegador ou redesenho de GC. Serve para qualquer vídeo cuja saída tenha alpha real, inclusive após chroma aplicado na origem.

É ferramenta separada, **sem promoção automática ao produto/instalador** e sem alterar vMix, cenas ou saídas da mesa. O teste do vMix real continua necessário.

Compilação isolada: `scripts/build/build-alpha-bridge.ps1`; destino obrigatório em TEMP com prefixo `FreeMix-QA-`. Artefato testado: `%TEMP%/FreeMix-QA-NativeAlpha-Build/FreeMix-Alpha-Bridge.exe`; SHA-256 `aeccbb1be74a3c291b21302b0eaec5f9f9c67deb4ecc93437905365f36ed762b`.

Teste real SDK/SRT: `qa-finalizacao/resultado-native-alpha-bridge-20261009.json`:

- 640×360:215 quadros, PTS monotônicos, passo33,333ms, alpha0/128/255 sem erro, movimento e áudio440Hz.
- 1920×1080 durante30s de envio:875 quadros recebidos, aproximadamente29,13s entre PTS inicial/final, 1.400.832 amostras de áudio/canal, nenhum quadro descartado por atraso. Não foram recebidos todos os900 quadros da fixture; início/fim de um envio finito ainda não são captura exata de arquivo.
- Stop/reconnect de SRT com reinício dos PTS:254 quadros; PTS de saída mantidos monotônicos e áudio presente. O quadro anterior é apagado para transparente na perda detectada.
- A/V inicial difere21,333ms, compatível com priming AAC nessa fixture. Não mede latência ponta a ponta.
- Máximo11,864ms para **conversão de pixels + recomposição + envio NDI** na rodada1080p; isso não inclui custo inteiro do decoder nem prova carga total do operador.

Limites: packed somente nessa ferramenta; sem OMT na ponte, sem receptor de dois SRT pareados, sem HDR, sem métricas WAN, sem ensaio físico vMix/câmera/chroma e sem sessões longas. Decodificação é CPU nesta versão. Reconexão mantém o nome da fonte, mas não garante ausência de intervalo de mídia.

Se o coordenador decidir distribuir a ferramenta separadamente, copie o EXE para `runtime/FreeMix-Alpha-Bridge.exe` junto à fonte/licenças/dependências correspondentes. O wrapper `alpha-bridge-nativo.mjs` resolve FFmpeg/MSVC em `bin/64bit` somente no processo e valida o runtime NDI oficial pinado, sem mudar PATH global.

Uso explícito futuro, após inclusão do binário:

```text
runtime/node.exe ferramentas/alpha-bridge-nativo.mjs --port 18460 --name "FreeMix SRT Alpha"
```

Em Externo/SRT, fonte transparente desejada, x264/H.264, 4:2:0, cor+máscara lado a lado; Caller para o IP/porta desse receptor. 1920×1080 lógico transporta3840×1080. No vMix, adicionar a fonte NDI pelo nome. Recepção padrão só localhost; para outra máquina, `--host 0.0.0.0` é ação explícita e depende de rota/firewall. Não abrir portas automaticamente.

## Pendências realmente externas / não concluídas

- Recepção OBS/vMix em outra máquina e sessão com chroma/vídeo real.
- SDI físico, keyer/driver/múltiplas placas e HDR fim a fim não homologados. O caminho integrado atual permanece SDR.
- OMT HDR opaco foi implementado em rota P216 independente e recebeu PQ/HLG com níveis reais10bit, áudio e reconexão no SDK oficial. A transferência é manual no receptor; alpha HDR e metadados automáticos não são suportados. NDI HDR ainda exige Advanced SDK licenciado e implementação; SRT/SDI HDR seguem pendentes. Veja [contratos, provas e limites](HDR-CONTRATOS-TRANSPORTES-20261009.md).
- Bonding WAN depende de receptor acessível e duas operadoras reais. HTTPS/TURN dependem de domínio/DNS/servidor/portas. Nenhum destino foi fornecido para publicação nesta rodada.
- Ponte nativa separada precisa aceite do operador em vMix antes de ser chamada estável; a antiga ponte WebBrowser continua abortada.

## Allowlist de integração

Fontes Native exclusivamente desta frente:

```text
freemix-app/frontend/widgets/FreeMixMultistream.cpp
freemix-app/frontend/widgets/FreeMixFillKey.hpp
freemix-app/frontend/widgets/FreeMixNdiOutput.hpp
freemix-app/frontend/widgets/FreeMixOmtOutput.hpp
freemix-app/frontend/widgets/FreeMixVideoTransports.hpp
freemix-app/frontend/widgets/FreeMixOmtHdrOutput.hpp
```

Ferramenta separada/kit:

```text
obs-vmix/ferramentas/native-alpha-bridge/main.cpp
obs-vmix/ferramentas/alpha-bridge-nativo.mjs
scripts/build/build-alpha-bridge.ps1
servidor/instalar-servidor.sh
obs-vmix/docs/servidor/instalar-servidor.sh
docs/RELATORIO-TRANSPORTES-CONCLUSAO-20261009.md
docs/HDR-CONTRATOS-TRANSPORTES-20261009.md
obs-vmix/ferramentas/saidas-hdr.mjs
obs-vmix/ferramentas/saidas-producao.mjs
obs-vmix/ferramentas/saidas-srt.mjs
obs-vmix/ferramentas/ndi-producao.mjs
obs-vmix/ferramentas/omt-producao.mjs
obs-vmix/ferramentas/omt-hdr-producao.mjs
obs-vmix/painel/remoto/saidas-external-ui.js
obs-vmix/painel/remoto/saidas-omt-hdr-ui.js
obs-vmix/painel/remoto/saidas.html
```

QA: `test-native-alpha-bridge.py`, `capture-ndi-fillkey*.py`, `capture-omt-fillkey-straight.py`, `test-native-ndi*.mjs`, `test-native-omt-fillkey-conclusion.mjs`, `test-srt-key-silent-conclusion.mjs`, `preparar-qa-transport-conclusion.mjs`, `test-output-contracts-20261009.mjs`, `test-bonding-adaptativo-conclusao-20261009.mjs`, `test-server-kit-syntax.mjs`, `test-hdr-output-contracts-20261009.mjs`, `gerar-fixture-hdr.py`, `capture-omt-hdr.py`, `test-native-omt-hdr-20261009.mjs`, `check-omt-hdr-header.ps1`, `test-omt-hdr-ui-20261009.mjs` e respectivos recibos em `qa-finalizacao/`. Nenhum arquivo central da API, configuração do operador, release selada ou Git mirror foi alterado por esta frente.
