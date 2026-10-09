# Saúde adaptativa dos caminhos

Implementação de 08/10/2026 em `ferramentas/bonding-producao.mjs` e `painel/remoto/rede.html/js`, opt-in por `adaptive:true`. O padrão permanece `adaptive:false`, modo duplicação e pesos manuais. Configuração continua exigindo transporte parado; não inicia em boot/recovery.

A telemetria anterior registrava erros de envio UDP, recebimentos por peer no receptor e NACK global. Ela não permitia atribuir perda de mídia ou capacidade disponível a uma interface. Foi adicionado feedback **real de saúde**: PING/PONG por caminho, autenticado AES-256-GCM, com RTT medido pelo relógio monotônico do emissor. Não se trata de capacidade de banda nem confirmação de qualidade/escuta de uma transmissão externa.

## Política e protocolo

- Probes a cada400ms por caminho; timeout configurável1000–15000ms, padrão2500ms.
- Caminho inicia `probing`, sem receber mídia até duas respostas válidas. Ausência de resposta por timeout retira o caminho (`offline`) e zera seu peso efetivo; a sondagem continua. Duas respostas válidas permitem reentrada. Não existem start/stop automáticos de saída externa.
- Na agregação, o peso efetivo usa RTT médio suavizado e o melhor RTT saudável: arredondamento de `pesoManual × melhorRTT / RTT`, limitado de1 até o peso manual. Na duplicação, mídia é duplicada somente entre os caminhos saudáveis. Pesos não são apresentados como Mbps.
- Se todos ficam offline, a mídia não é enviada cegamente por uma rota suposta; probes continuam e `healthBlockedWire` registra envelopes bloqueados. O cache de retransmissão segue limitado pela janela existente. O contador inclui mídia/paridade/retries bloqueados, não deve ser interpretado como porcentagem de perda de mídia.
- Envelope versão2 acrescenta flags4 (request) e5 (reply), com payload24bytes, sessão/contador próprios e vínculo à sessão de mídia. Domínios HKDF distintos para health request/reply impedem reutilizar a mesma chave/nonce nas duas direções. Os domínios de mídia, NACK e paridade existentes permanecem separados e inalterados.
- O emissor confere endpoint exato, sessão, contador pendente, idade, assinatura e payload esperado. Respostas repetidas/adulteradas são rejeitadas. O receptor aceita somente requests autenticados, com janela antireplay128, até8 sessões e limite64 requests/s. Pending probes são descartados por timeout; contador esgotado exige nova sessão, sem wrap de nonce.

Novos diagnósticos por caminho: `healthStatus`, `lastAck` monotônico, `rttMs`, `effectiveWeight`, `goodReplies`, `healthSent`, `healthReplies`, `healthTimeouts`, `healthRejected`, `mediaLossMeasured:false`, `capacityMbps:null`. Contadores de probes não entram no contador de mídia recebido/FEC do receptor.

O receptor precisa desta versão para responder probes. Emissor adaptativo com receptor antigo fica sem resposta/offline; não finge saúde nem retorna silenciosamente ao modo manual. Receptor atualizado também aceita emissores manuais anteriores sem exigir probes. UI apresenta opt-in e timeout, política de reentrada e limite de interpretação das medidas.

## Evidência curta

`testar-bonding-adaptativo.mjs` e `resultado-bonding-adaptativo.json`: **8 PASS** em uma execução, fixtures da política e UDP loopback com portas efêmeras:

1. Padrão manual/duplicação e validação de timeout.
2. Pesos RTT limitados, retirada/reentrada com duas respostas e ausência de estimativa fictícia de Mbps/perda de mídia.
3. Dois caminhos locais recebem respostas autenticadas reais e RTT positivo.
4. 24 pacotes MPEG-TS idênticos no receptor, com seis perdas sintéticas recuperadas por XOR FEC; nenhum pacote ausente.
5. Probe adulterado/replay rejeitados; resposta não decifra com a chave do request.
6. Blackhole de um relay retira esse caminho por timeout;16 pacotes seguintes continuam pela rota saudável.
7. Relay restaurado reentra após respostas autenticadas e volta a participar da distribuição.
8. Todos os relays bloqueados retiram ambas as rotas, bloqueiam mídia e mantêm cache de probes limitado.

AES-256-GCM/FEC/NACK não foram substituídos. O teste usou mídia sintética e sockets temporários, encerrados no `finally`; não tocou operador, API8088, interfaces físicas, WAN ou serviços externos. Syntax check do módulo e JS passou. A fixture prova política/protocolo e a execução local prova feedback/entrega nesse cenário; **não homologa throughput agregado WAN, quedas de provedores, perdas direcionais ou estabilidade prolongada**. Retirada por perda de mídia percentual e estimação de capacidade continuam sem telemetria suficiente e não foram implementadas/falsificadas.
