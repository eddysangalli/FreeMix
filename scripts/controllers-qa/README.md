# Macros e controladores — validação de software

Esta rodada preserva a API existente e altera sete fontes próprias, listadas em `build/integration-allowlist.json`. Não modifica API central, mesa, Native, coleções/portas do operador, Git mirror ou releases. Os dados de execução Node usam raízes TEMP `FreeMix-QA-Controllers-*`; o navegador é Edge headless com respostas HTTP de fixtures próprias. Nenhum dispositivo MIDI real é solicitado ou enumerado.

## Correções verificadas

- OSC guarda todos os releases recebidos durante um comando pendente, em vez de conservar apenas o último. A parada durante o bind termina a promessa de início sem criar timer órfão. A sessão antiga permanece inválida após rebind.
- Release do cliente, edição/desativação/remoção de controle e troca de produção cancelam também a abertura de talkback ainda pendente. Uma lease confirmada tardiamente é fechada.
- Feedback de barramento não marca como ativa uma entrada ausente. A troca de objeto de porta MIDI com o mesmo ID reaplica o feedback e desliga a rota anterior quando possível.
- Reconexão ao mesmo projeto estabelece uma nova linha de base sem repetir Startup/ProjectOpen ou disparar eventos de alterações ocorridas durante a desconexão. Um projeto diferente ainda emite ProjectOpen. Editar um trigger cancela seu timer anterior.
- Reconectar MIDI remove handlers do MIDIAccess anterior. Pedidos simultâneos compartilham uma solicitação. Frames incompletos/fora de 0–127 não viram ações. Sem SysEx. MIDI requer contexto seguro e permissão; a ausência da API ou a recusa da política tem mensagem explícita. O UUID de sessão tem fallback criptográfico para que a tela em HTTP inseguro consiga apresentar esse diagnóstico.
- Os dois painéis evitam overflow horizontal em 900x650, 1280x720 e 1920x1080 com DPI 100/125/150/200%; controles fluem para uma coluna em viewports menores. Nenhuma alteração em CSS compartilhado.

## Limites e contratos

OSC escuta apenas `127.0.0.1`, requer IDs salvos e aceita mensagens delimitadas OSC 1.0 com texto/inteiros; não aceita bundles, scripts ou comandos remotos arbitrários. Até oito peers, 32 mensagens por segundo/peer; subscription expira após dez segundos sem renovação. Talkback requer `up` ao soltar e `/freemix/hold` a cada 350 ms; o watchdog da lease continua responsabilidade do motor Calls existente.

UDP não garante entrega ou unicidade. O cooldown de 180 ms (50 ms para volume contínuo) rejeita ecos imediatos; o protocolo não possui ID de evento para deduplicar retransmissões tardias. A prova de ausência de duplicação cobre listeners, timers, eventos de estado estável, reconexão e ecos imediatos, sem prometer entrega exatamente uma vez.

WebMIDI é dependente do navegador, contexto, política e permissão, conforme a [especificação primária](https://webaudio.github.io/web-midi-api/). A API possui `SecureContext`; solicitações podem ser recusadas e chamadas repetidas podem devolver instâncias MIDIAccess diferentes. O CEF embarcado não foi executado nesta frente: a leitura de `freemix-app/plugins/obs-browser/browser-client.*` e `panel/browser-panel-client.*` não encontrou contrato explícito de WebMIDI/permissão MIDI. Isso não prova disponibilidade nem indisponibilidade do runtime CEF. A tela verifica a API em execução e recomenda navegador compatível quando indisponível.

ASIO Direct Out e OMT HDR já possuem contratos próprios em `audio-buses-producao.mjs` e `omt-hdr-producao.mjs`. Esta rodada mantém essas ações fora da allowlist das macros/controladores; configure/start/stop/preflight e confirmação manual do receptor permanecem nas telas específicas. Não são fabricadas novas ações nem configurações privadas em automação declarativa. `automacao-operacional.mjs` foi auditado e permanece intacto.

MIDI/LED/fader/StreamDeck/Companion físicos, integração CEF real e motor Native não foram homologados por esta frente. Feedback MIDI usa semantic doubles; o UDP é real. A proteção contra comandos arbitrários e contra múltiplas macros permanece ativa. A expansão das famílias de dispositivos requer fixtures e teste do dispositivo-alvo.

## Evidências

`node scripts/controllers-qa/test-software.mjs` cobre codec/UDP real, múltiplos releases, rebind, estados e feedback, cancelamento de leases pendentes, adaptadores, nota/CC em doubles, os 24 eventos de macro, condições, debounce/cooldown, cancelamento, rollback limitado ao Preview e parada durante o bind. `build/software.json` registra PASS e o serviço OSC já parado.

`node scripts/controllers-qa/test-browser.mjs` cobre os dois painéis em 24 combinações resolução/DPI, teclado, edição em campo, inicialização repetida, instâncias MIDI substituídas, frames inválidos, recusa de permissão e dois guards adicionais: contexto inseguro e API ausente. `build/ui/receipt.json` e PNGs contêm apenas fixtures próprias.

`audit-baseline.mjs` é um probe reproduzível dos três gaps iniciais; após a correção seus três indicadores devem ser `false`. O recibo é diagnóstico, não prova física. `integration-report.mjs` exige os dois recibos PASS, verifica sintaxe e produz a allowlist SHA256 final.
