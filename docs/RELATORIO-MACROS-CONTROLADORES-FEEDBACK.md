# Macros e feedback de controladores — 2026-10-08

Implementação pronta para integração na entrega local. Nenhuma configuração do operador, API 8088 ou motor nativo foi alterada nesta frente. Não requer recompilação C++.

## Comportamento implementado

- Feedback MIDI por `MIDIOutput.send`: Note On ou Control Change, canal/número configuráveis, valores ligado/desligado ou volume confirmado. As rotas duplicadas são rejeitadas. Sem SysEx. O envio depende de conexão MIDI explícita na interface; mudanças repetidas são deduplicadas e perda de foco/conexão fecha o feedback.
- OSC 1.0 UDP somente em `127.0.0.1`, porta configurável e inicialização manual. Comandos usam IDs de controles já salvos; não aceitam ações arbitrárias, scripts ou bundles. Feedback inclui disponibilidade, estado ativo, volume e última confirmação, além de Program/Preview/gravação/transmissão. Limites: 8 clientes, 32 comandos/segundo por cliente e filas limitadas.
- Pressionar/soltar talkback pelo OSC preserva a licença privada. Soltar durante uma abertura pendente fecha a licença assim que a abertura conclui. Parar OSC invalida comandos da geração antiga e fecha as licenças. Assinaturas expiram após 10 segundos; comandos de manutenção devem renovar a assinatura e o hold privado.
- Novos eventos de macro: Preview, gravação e transmissão individuais, overlay, tally, estados de mídia, mute e início/fim de talkback. Todos derivam de mudanças no estado confirmado; desconexão cancela timers.
- Novas ações declarativas: iniciar/parar gravação/transmissão explicitamente, T-bar, seek/configuração de mídia, preparar variante existente horizontal/vertical no Preview, variante/desvínculo de GC e ligar/desligar efeitos/legendas locais existentes. Efeitos não aceitam caminhos de shader/scripts nem redefinem parâmetros personalizados ao apenas alternar enabled.
- Gravação/transmissão continuam excluídas da captura automática de ações: devem ser incluídas explicitamente pelo usuário na macro. Limites anteriores de passos, duração, profundidade, debounce, cooldown e proteção contra repetição permanecem.

## Integração da raiz

Incluir `ferramentas/controller-osc.mjs` e `painel/remoto/midi-feedback.js` no pacote. Carregar `midi-feedback.js` antes de `atalhos-engine.js` na mesa; a página Atalhos já o carrega. A API deve permitir `controller_osc_configure`, `controller_osc_start` e `controller_osc_stop` somente localmente. Configuração e feedback MIDI ficam no namespace por produção `freemix-controllers/<hash>.json`, schema 2; OSC não inicia automaticamente ao restaurar.

## Contrato OSC

| Endereço | Argumentos |
| --- | --- |
| `/freemix/read` | `[id?]` — responde estado atual mesmo sem mudança |
| `/freemix/subscribe` | `[0 ou 1]` — renovar antes de 10 s |
| `/freemix/fire` | `[id, "down" ou "up", valor 0..127 opcional]` |
| `/freemix/hold` | `[]` — manutenção do talkback privado (intervalo de 350 ms) |
| `/freemix/feedback` | `[id, enabled, available, active, volume, lastSuccess]`; desconhecido = -1 |
| `/freemix/state` | `[connected, recording, streaming, program, preview]` |

Mensagens aceitam somente strings e int32. Referências oficiais: [OSC 1.0](https://opensoundcontrol.stanford.edu/spec-1_0.html) e [Web MIDI](https://www.w3.org/TR/webmidi/).

## Evidências

- `qa-portatil/controllers-feedback-real.json`: **11 verificações aprovadas**. UDP real localhost despacha controles salvos e retorna feedback; ações do motor e licença Calls são doubles semânticos. MIDI usa objeto MIDIOutput simulado, validando os bytes exatos, deduplicação e fechamento de foco/conexão. Inclui validação de eventos e ações declarativas.
- `qa-portatil/macros-effects-contract.json`: **4 verificações aprovadas**, identidades públicas, parâmetros limitados e proteção do microfone privado.
- `qa-portatil/controllers-feedback-ui.json`: **3 verificações aprovadas**. Browser salvou porta OSC, iniciou/parou o servidor e salvou uma macro com gatilho RecordingStop desativado. Arquivos confirmam readback. Prova adicional de resposta OSC read repetida.
- `qa-portatil/controllers-feedback-ui.jpg` e `controllers-macros-ui.jpg`: capturas da interface. Console do browser sem erros na prova concluída. Servidor de fixture temporário expira sozinho; não executou comando nativo.

## Limites restantes

Controlador MIDI físico, mapeamento específico de LEDs de cada fabricante e feedback dentro do CEF dependem de Web MIDI/permissão disponível e ensaio no dispositivo. OSC permanece local, não é acesso remoto/WAN. Os novos eventos foram exercitados com estado sintético autoritativo; esta rodada não iniciou gravação/transmissão real do operador. Efeitos e legendas dependem de filtros/modelos instalados, com validação final pelo EffectsEngine; a prova de filtros reais pertence à frente de áudio/efeitos. Não há garantia de compatibilidade automática com todo protocolo proprietário de superfície de controle.
