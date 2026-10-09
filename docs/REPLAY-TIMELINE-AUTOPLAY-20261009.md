# Timeline da gravação e entrada automática de Replay

## Problemas confirmados

O controlador compacto tinha uma barra visual sem navegação no histórico. O console completo oferecia seek apenas no lance já carregado. IN/OUT marcavam o momento atual da gravação, sem escolher pontos anteriores. Além disso, `shown()` excluía REPLAY A/B da lista de entradas; a reprodução só era iniciada pelo comando específico Replay No Ar.

## Correção implementada

- Timeline da sessão gravada, com câmera, posição em segundos, prévia de quadro decodificado por FFmpeg e recuo/avanço de um quadro.
- IN/OUT no histórico e geração de um lance com todos os ângulos da sessão, limitado a 0,2–120 segundos, durante REC ou após parar. Uma sessão diferente ou pontos expirados pela retenção são recusados.
- Os botões de marcar no momento atual continuam separados das marcas da timeline.
- REPLAY A/B/C/D aparecem na lista de entradas após carregar lances nos players.
- Mudanças nativas de Programa acionam a reprodução do player carregado. Preview continua pausado. Em uma troca vinculada entre ângulos, o cursor é alinhado sem reiniciar do começo. O comando No Ar evita duplicar o restart do evento nativo; Voltar ao vivo preserva a entrada anterior.

## Evidência

`qa-finalizacao/resultado-replay-history-real.json`: arquivos TS reais, quadros históricos diferentes, recortes de dois ângulos, limites, REC preservado e recorte atravessando segmentos. A diferença RGB média do primeiro quadro em relação ao IN foi 0,279/255. A reprodução neste teste foi simulada.

`qa-finalizacao/resultado-replay-autoplay-native.json`: instância privada em raiz temporária de QA e WebSocket 14499. A/B permaneceram pausados no Preview; cortes normais iniciaram vídeo real; B silenciou A; retorno ao vivo e ausência de restart duplicado passaram. Instância encerrada ao final.

`qa-finalizacao/resultado-replay-history-ui.json`: navegador com API simulada confirmou os pontos escolhidos, passo por quadro, nenhuma operação de REC/Programa ao navegar e inclusão dos quatro players na lista. Captura `qa-finalizacao/replay-history-ui.png`.

## Limites e ativação

A prévia histórica mostra quadros sob demanda, não playback contínuo em tempo real de toda a sessão. A velocidade de busca depende do arquivo, disco, codec e CPU; ainda falta avaliar gravações longas em carga máxima. A timeline atualiza o histórico pelo botão Atualizar histórico. Marcas históricas ainda não fixam segmentos contra expiração: o servidor valida disponibilidade ao salvar.

Em 09/10, a mesa do operador estava gravando Replay e tinha uma Call com transporte verificado e peer conectado. Após o operador informar que encerrou a Call, a ausência de convidados/peers conectados foi confirmada e somente a API desta instalação foi reiniciada. `qa-finalizacao/resultado-replay-servico-aplicado.json` confirmou suporte da timeline/autoplay, mesmo Programa REPLAY B, mesma sessão de REC e arquivo aumentando de 609.681.408 para 615.632.896 bytes. O motor não foi reiniciado.

Em seguida, às 16:47:31, o executável encerrou; o log chegou ao fechamento do profiler e contagem de memória, sem novo arquivo de crash. A mesa incorpora a lista de entradas atualizada na próxima abertura normal por ABRIR-FREEMIX.cmd. O console desativa a timeline quando o serviço ainda não anuncia suporte. O instalador assinado anterior também precisa ser regenerado para incluir esta correção.
