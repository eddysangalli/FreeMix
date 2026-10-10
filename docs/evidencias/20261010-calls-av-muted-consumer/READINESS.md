# Preparação: um consumidor remoto adicional, sempre muted

Sem execução browser, Native, API, áudio, mic ou servidor. Default do helper OFF;
somente este probe QA passa enabled:true. Uma sessão20s, clique manual do Root,
loopback efêmero autenticado; nenhum VDO/STUN/TURN/rede externa. Nenhum produto alterado.

Baseline é o ensaio page-origin realmente executado pelo Root e inconclusivo:
local PCM nonzero145920/peak.35, receptor zeros, pacotes recebidos sem samples
decoded/jitterBufferEmitted. Os pins do AL26, receipt e report ficam intactos.
Não foi comprovado defeito de timestamp. Mantemos inclusive PageOrigin e local-tap
para comparar UMA variável, sem integrar os wrappers como solução de produto.

A única intervenção funcional adiciona o MESMO track remoto recebido ao stream
do elemento video existente e muted. Callback áudio/vídeo em qualquer ordem; uma
referência e um stream. Nada muda clock, PCM, AudioData/VideoFrame, sender,
encoder, Gain0, worklet, detector, ROI ou thresholds. O helper não chama play,
stop, clone, unmute ou muda volume. Close remove só o track anexado por ele.

Observabilidade finita: até32 snapshots do elemento (muted/paused/readyState/
networkState/currentTime, contagem de tracks, identidade exata e counters), até8
faults. Snapshots nos callbacks, nos ticks RTP existentes e antes/depois do close.
Todas as amostras devem continuar muted; track anexado uma vez e removido no fim.
Não mudar Gain0 ou desmutar caso não se obtenha demanda do renderer.

Runner mantém a aceitação AV ORIGINAL byteexata, registra seu resultado separado
do diagnóstico; coleta de diagnóstico não significa PASS de AV. Se decoderstats
subirem mas PCM continuar zero, caminho mute/volume ainda pode afetar resultado.
Se nada subir, não prova encoder culpado: muted pode não criar demanda efetiva.
Origem/encoding e RX/playout seguem hipóteses até a observação real.

O review oficial/source fica em ../calls-av-playout-source-review/ANALYSIS.md;
commit Chromium pinado, versão efetiva IAB desconhecida, não extrapolar para CEF.
Esta proposta não testa PCM Native/N1, mic diretor, hardware ou WAN. Esses contratos
continuam pendentes e experimental/defaultOFF.

Guardas: revisão FULL do Root de probe/runner/launch/PREPARATION/AL + autorização
exclusiva antes da CLI root-command. Marker específico, AL+PREP exactos, noLinks,
Node600/helpers pinados; checagem de todos os arquivos/provas das duas origens
antes de listen e depois de close. Receipt/report flagwx impede repetir mesma raiz.
Timeout180s aguardando clique,45s depois start; nenhuma repetição automática.

Modelos: oito do helper original e onze integração/VM/sintaxe, somente Node;
comparação reversível do probe comprova que somente os hunks declarados diferem.
Não afirmar visual/áudio/Chromium por esses modelos. Root fará screenshot terminal
após uma futura execução; esta preparação não captura imagem nem dispara áudio.
