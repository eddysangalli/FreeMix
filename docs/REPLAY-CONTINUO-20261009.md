# Replay: histórico contínuo local — implementação e provas

Implementado em 09/10/2026. Esta entrega acrescenta reprodução de vídeo/áudio do histórico, atualização automática da timeline durante REC, busca e IN/OUT no ponto reproduzido. Não altera o contrato existente de A/B/C/D, áudio por câmera, sincronização ou autoplay ao entrar no Programa. O transporte alpha-web rejeitado pelo usuário não faz parte desta entrega.

## Arquivos para integração

- `obs-vmix/ferramentas/replay-preview.mjs`: cache privado de proxies H.264/AAC em blocos de até oito segundos.
- `obs-vmix/ferramentas/replay-disco.mjs`: ações `history-preview` e `history-pin`, capacidade `historyPlaybackSupported`, `previewFile(token)` com lease e `dispose()`.
- `obs-vmix/painel/remoto/replay.html` e `replay.js`: vídeo MSE, reprodução/pausa, áudio local opt-in, prefetch, atualização da timeline e limpeza quando sessão/ponto expiram.
- O coordenador integra a rota autenticada GET/HEAD `/api/replay-preview/<32hex>` usando `midia-preview-http.mjs`. A rota precisa manter a proteção local/autenticação do servidor e liberar o lease em todos os caminhos. No encerramento da API, chamar `await replay.dispose()` antes de terminar o processo.

## Como funciona

FFmpeg lê somente a janela solicitada dos TS originais e gera um proxy de 640×360 mantendo proporção, timestamps e FPS, sem recodificar toda a sessão. Áudio AAC estéreo 48 kHz, quando existe na câmera escolhida. Os lances salvos continuam usando a qualidade original, sem depender do proxy.

O navegador mantém uma pipeline MediaSource, anexa novos blocos e antecipa o próximo cinco segundos antes da borda. O histórico se atualiza a cada 2,5 segundos durante REC e seis segundos parado. O áudio da prévia começa silenciado e só é ouvido no computador do monitor quando o operador marca a opção; não muda o Master.

Cache limitado a 128 MiB/24 entradas, um encoder com dois threads e no máximo uma busca pendente. Buscas superadas são descartadas por viewer, sem fila crescente. O proxy fica fora da coleção privada e é servido por token de 32 hex ligado à sessão. Leases impedem apagar mídia em leitura. Marcas IN/OUT fixam até 120 segundos por dois minutos, renovados enquanto a tela está aberta. Retenção não apaga segmentos em conversão nem a seleção fixada.

## Provas executadas

| Recibo | Evidência |
| --- | --- |
| `resultado-real.json` | FFmpeg real, H.264/AAC fragmentado, PTS monotônicos, 30 fps; cache sem recodificar; seek cruzando segmentos 7–15 s; comparação do quadro inicial com fonte, erro médio RGB 2,116/255; áudio PCM RMS 0,08807; cancelamento de buscas antigas, sessão/token inválidos e leases. Preparação observada 196–546 ms por bloco de oito segundos; cache inferior a 1 ms. |
| `resultado-ui.json` | UI real com API HTTP e mídia real no Edge. Vinte segundos contínuos, 628 quadros e zero descartados, atravessando três transições de bloco. Primeiro vídeo pronto em 545 ms; seek em cache em 43 ms. Tom AAC de 440 Hz detectado em 445,3125 Hz no navegador, com ganho de saída zero para preservar o áudio do operador. IN/OUT produziram arquivos reais de aproximadamente três segundos. TS cresce de 2,99 para 6,75 s e timeline acompanha automaticamente; reprodução na borda crescente retoma com blocos novos. Mudança de sessão desmonta a pipeline. Zero erros JS. |
| `resultado-retention-performance.json` | Fonte real 1920×1080 a 30000/1001 com áudio. Proxy de oito segundos preparado em 322 ms; solicitação completa em 385 ms. Retenção preserva seleção, expira pin abandonado, recusa seek expirado e dispose preserva lease até liberação. |
| `resultado-silent.json` | Fonte real sem trilha de áudio reproduz na mesma pipeline MSE; interface identifica ausência de áudio gravado. |
| `resultado-native-recording.json` | Duas câmeras gravadas pelo SourceRecord no motor real isolado. Prévia contínua com H.264/AAC em 356 ms; histórico de 6,32 para 9,82 s e arquivos crescendo enquanto se reproduz. IN/OUT salva dois ângulos originais sem parar REC ou mudar Programa. |
| `resultado-replay-preview-http.json` | Treze verificações de HTTP real: GET/HEAD/Range, respostas 206/416/405, cancelamento e liberação única de leases. Rota integrada à API com autenticação e acesso local. |

Execução: `node qa-finalizacao/replay-completo/test-real.mjs`, `test-ui.mjs`, `test-retention-performance.mjs` e `test-silent.mjs`. Os testes usam raízes QA, portas loopback efêmeras e processos próprios. O browser e o writer FFmpeg são encerrados no finally; nenhuma instância do operador, configuração ou porta de produção foi alterada. Sintaxe dos fontes e scripts verificada com `node --check`.

## Limites e validação restante

- Os testes Edge usam inventário/REC/Programa simulados; `resultado-native-recording.json` verifica adicionalmente a cadeia SourceRecord → disco → prévia → IN/OUT no motor real. O autoplay nativo anterior permanece preservado; isso não homologa dispositivos físicos ou carga prolongada.
- Não houve teste de gravação multicâmera durante horas sob carga máxima, placa física ou genlock. O tempo medido nesta máquina não garante o mesmo desempenho em outro CPU ou com codecs/fontes diferentes.
- Prévia local de resolução reduzida; armazenamento/exportação continuam originais. Navegador/CEF precisa suportar MediaSource H.264/AAC. O fallback por quadro informa quando não suporta; CEF físico da instalação final ainda deve ser conferido pelo coordenador.
- Ao alcançar a gravação em andamento pode haver espera pela janela segura e pelo próximo refresh; isto é navegação no histórico, não um retorno de vídeo ao vivo.
- Pin de seleção é único por instância, voltado ao operador local; múltiplas telas podem substituir a seleção protegida. Pin não é persistido após reinício.
- Encerramento normal remove proxies próprios; morte forçada do processo pode deixar arquivos órfãos e diretórios UUID vazios no cache privado. Não foi feito purge global de pastas do operador.
- Fontes do player e rota foram integrados pelo coordenador. Instalador/payload final ainda precisam ser regenerados após fechar as demais frentes. O operador continua com sua sessão preservada.

Hashes dos fontes e recibos estão em `hashes.json`.
