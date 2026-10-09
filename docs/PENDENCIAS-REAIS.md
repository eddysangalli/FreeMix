# Pendências reais e critérios para encerrar

Estado em 09/10/2026. A entrega corrente é identificada em `entregas/ULTIMA-ATUALIZACAO.json` e nos manifests assinados; não atribuir uma versão a uma mesa que permanece aberta com outro executável. Código implementado, ensaio local e homologação em produção são etapas diferentes. Os ZIPs selados continuam imutáveis; este documento esclarece o escopo.

SRT implementado e validado localmente: H.264 4:4:4 com x264 e alpha empacotado no mesmo quadro (Fill à esquerda, Key à direita). Em loopback, dez segundos em 320×180 lógico produziram vídeo High 4:4:4/yuvj444p e alpha 0/128/255 sem erro nas amostras; o receptor precisa dividir e recompor o quadro. A primeira prova do alpha falhou e foi preservada; a correção passou em `qa-portatil/resultado-srt444-keyfix-20261009.json`. Isso não comprova desempenho Full HD, internet, HDR ou compatibilidade automática com todo receptor.

Externo ganhou acesso direto a NDI/OMT/SDI, precisão PA16 e rascunhos por emissor, com provas de interface e readback real. O encerramento com janela CEF e consultas simultâneas passou no cenário dirigido de `resultado-shutdown-20261009.json`; a causa exata do crash original do operador não foi reproduzida nem declarada resolvida por essa prova.

Organização operacional solicitada: Transmitir abre MultiStream; SRT, NDI e OMT ficam em Externo. Perfis externos são preparados como rascunho, sem iniciar envio.

Atualização de estabilidade: corrigidos eventos reentrantes de fechamento e a destruição dos painéis CEF; o teste pelo X com três painéis e fechamento concorrente passou com saída 0 e sem crash novo. Corrigida a fila residual/contexto do muxer em reconexões SRT. O log do vMix desta máquina mostra falha do decoder após receber High 4:4:4 com alpha empacotado. Use 4:2:0 sem alpha nesse receptor; OBS/FFmpeg com recomposição continuam o caminho para o contrato packed. A correção do emissor não adiciona suporte a codecs no receptor.

SRT apresenta primeiro os campos essenciais de conteúdo, áudio, resolução e conexão; detalhes de encoder, FPS, overlays e alpha ficam em Avançado. O guia abre separadamente, sem ocupar o formulário. A prova final da tela simplificada acompanha a entrega; abrir/configurar não inicia saída automaticamente.

## Implementações parciais que ainda exigem desenvolvimento

| Item | Estado real | Trabalho para encerrar | Critério de conclusão |
|---|---|---|---|
| HDR completo | OMT PA16 preserva precisão e alpha de 16 bits, mas a rota atual é SDR BT.709. SDI integrado também está limitado a SDR. | Definir protocolo, formato e receptores HDR suportados; verificar os contratos do SDK/driver; implementar e transportar espaço de cor, curva e metadados exigidos. Se o transporte não os aceitar, usar uma rota compatível ou manter SDR explicitamente. | Receptor HDR identificado interpreta corretamente imagem, níveis e metadados numa captura real. Não basta selecionar um rótulo HDR. |
| GTZIP além dos modelos suportados | Há conversão de formas e animações reconhecidas. Nós não convertidos geram aviso. HTML só sincroniza quando aceita o contrato FreeMix GC v1. | Escolher os arquivos/modelos que precisam funcionar, listar os elementos recusados e implementar esses elementos ou fornecer um modelo FreeMix equivalente; verificar direitos de fontes/imagens. | Cada arquivo-alvo abre, edita e reproduz corretamente em H/V. Compatibilidade com qualquer arquivo proprietário ou HTML arbitrário não é um critério finito. |
| Acabamento da interface | Central com 98 preferências OBS, editor original acessível e responsividade conferida em janelas específicas. Ainda não há aprovação visual de todas as telas/DPI. | Inventariar telas e tamanhos-alvo; comparar com os prints; corrigir espaçamento, navegação e controles ainda inadequados. Campos OBS não migrados já podem ser usados no diálogo original. | Aprovar uma matriz definida de telas e resoluções, sem cortes, rolagem impraticável ou comandos inacessíveis. Aproximação visual não significa identidade universal pixel a pixel. |

## Implementado, mas ainda sem homologação no ambiente real

| Item | O que já existe | O que falta fazer | Critério de conclusão |
|---|---|---|---|
| Calls pela internet | N-1, retorno, conferência, talkback fora do Master e importação TURN para o publicador de retorno. | Preparar uma sessão com dois convidados em redes diferentes, incluindo celular com internet móvel e fone; confirmar relay quando necessário, audição humana e reconexão. Corrigir somente as falhas reproduzidas nessa rodada. | Convidados recebem retorno sem a própria voz; talkback chega ao destino escolhido e não aparece no Master/gravação; retorno volta após interrupção. A configuração TURN do retorno não substitui automaticamente a configuração dos convidados VDO.Ninja. |
| Bonding WAN | Emissor/receptor UDP, criptografia, FEC/NACK e medição/alocação por caminho passaram em ensaio local dirigido. | VPS receptor e duas conexões reais; conferir roteamento por interface, bloquear uma delas, variar perda/jitter e observar mídia entregue. Definir bitrate e atraso aceitáveis antes do teste. | MPEG-TS decodificável no receptor, recuperação dentro do orçamento e continuidade sob a falha prevista. Pesos locais e velocidade nominal da placa não comprovam ganho de banda WAN. |
| NDI/OMT e SDI | Runtime NDI incluído, envios independentes, Fill+Key e PA16 testados por receptores locais; SDI valida dispositivo/modo/keyer e recusa hardware ausente. | Duas máquinas para NDI/OMT; placa, driver e receptor compatíveis para SDI/Key; conferir áudio, alpha, nomes, reconexão e modos. | Receptor externo mostra conteúdo e áudio corretos; Key e Fill coincidem; desconexão/retorno não trava o motor. SDI não pode ser homologado sem placa. |
| ASIO, Direct Out e controladores | Rotas e integrações próprias existem, com provas locais e simuladas descritas nos relatórios. | Interface ASIO, saídas físicas e dispositivos MIDI/OSC/Companion/StreamDeck/XKeys; medir áudio por saída e confirmar feedback. | Rota correta, ausência de vazamento/eco e retorno de estado no dispositivo. Um simulador não comprova driver ou equipamento real. |
| Codecs e destinos | Integração com encoders que o OBS realmente disponibiliza; HEVC/AV1 e saídas adicionais têm provas locais no escopo dos relatórios. | Conferir GPU/driver e encoder disponível na máquina de destino; validar ingestão no serviço escolhido, incluindo os perfis HEVC/AV1/Enhanced RTMP/HLS exigidos. | Destino recebe e decodifica o perfil selecionado. Não se pode disponibilizar um encoder de hardware que a GPU não suporta nem presumir que todo servidor aceita o mesmo codec. |
| Replay multicâmera | Quatro players, offsets, áudio exclusivo, calibração com referência comum e reparo limitado de arquivos foram ensaiados. | Capturas reais, teste de drift, carga de disco/GPU e duração operacional definida. | Sincronismo fica dentro da tolerância acordada durante o ensaio, com áudio correto. Câmeras sem referência comum exigem outra estratégia de sincronização. |
| Efeitos, tracking e legendas | Plano texturizado com transformação XYZ; FaceTracker/VISCA TCP e plugins de blur/máscaras/legendas offline integrados. | PTZ real, fala portuguesa, movimento e carga representativa; avaliar enquadramento, latência e qualidade da transcrição. | Resultado utilizável no material-alvo, sem perda de controle ou carga incompatível. Ajustar modelo/configuração ou código conforme o problema observado. |
| Instalador e estabilidade | Pacotes e assinaturas conferidos; launcher inicia motor/API juntos; geração local de diagnóstico disponível. | Windows limpo, instalação/atualização/rollback, UAC/firewall, dispositivos e um ensaio de duração definida com carga real. | Abre, atualiza e restaura sem perder projeto; telas funcionam; nenhum crash novo durante o cenário definido. Não é necessário repetir testes indefinidamente. |

## Infraestrutura, licença ou limites que não se resolvem apenas com código

| Item | Necessário para fechar |
|---|---|
| Feed HTTPS, TURN e receptor público | Um VPS Linux com processos próprios/UDP, domínio e DNS, acesso administrativo e portas disponíveis. Instalar Node/Caddy/coturn, executar o kit, importar ICE e conferir de fora da rede. Hospedagem comum de páginas ou Google Drive não substitui TURN/receptor UDP. O kit existe; nenhum serviço público foi instalado. |
| Recuperação de dependências externas | Para cada projeto, incluir mídia e fontes redistribuíveis e fornecer instaladores/licenças/drivers necessários na máquina de destino. A recuperação já preserva estado e captura conteúdo remoto estático autorizado. Aplicações dinâmicas precisam de exportação/snapshot específico do próprio serviço; não há reconstrução genérica de um servidor a partir de uma página. |
| StreamFX | Licença/distribuição permitida e versão compatível, se esse produto específico for exigido. As alternativas próprias implementadas não representam todas as funções do StreamFX. |
| Genlock e conteúdo perdido | Genlock físico exige cadeia de captura/relógio adequada. Pacotes/quadros que nunca foram gravados não podem ser restaurados por software. Esses são limites, não botões que faltam implementar. |

## Ordem prática para concluir

1. Definir os arquivos GTZIP e telas que serão aceitos; isso transforma promessas abertas em uma lista implementável.
2. Preparar VPS/domínio e executar uma única rodada externa de Calls/bonding/atualização.
3. Executar a matriz com hardware disponível: vídeo, áudio, controladores e PTZ.
4. Testar codecs nos destinos e Windows limpo, seguido de ensaio com duração e carga previamente definidas.
5. Implementar HDR quando protocolo/receptor suportados estiverem definidos; corrigir e repetir apenas os casos que falharem.

Evidências: `CONTINUAR.md`, `docs/evidencias-ultima-rodada/` e os relatórios da rodada. A geração de ZIP de logs já está pronta; envio automático para painel/Drive foi substituído, a pedido do operador, por encaminhamento manual via e-mail/WhatsApp.
