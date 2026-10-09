# Distribuição de mídia por caminhos e FEC

Implementado em `obs-vmix/ferramentas/bonding-producao.mjs` e no painel `remoto/rede.js/html`. O modo padrão continua duplicação, compatível com configurações existentes. O modo opcional `aggregate` envia cada datagrama de mídia uma única vez usando round robin ponderado (peso inteiro 1–100 por interface). Retransmissões também escolhem um caminho; contadores distinguem mídia, paridade e retry.

`fecGroup` aceita 0 (desativado) ou 2–16. Uma paridade XOR guarda os comprimentos individuais, permitindo recuperar exatamente uma perda por grupo, inclusive pacotes TS de tamanhos diferentes. A paridade é autenticada com AES-GCM e uma chave HKDF de domínio separado da mídia; sequência igual não reutiliza chave/nonce. Grupos e histórico ficam limitados pela janela e pelo buffer temporal. Grupos sobrepostos, formatos inválidos, replay e adulteração são recusados. O NACK autenticado existente permanece disponível para perdas que excedam uma por grupo, inclusive perdas no fim de um grupo conhecidas pela paridade.

Provas locais curtas:

- `qa-portatil/bonding-aggregate-real.json`: seis checks; dois caminhos com pesos 2:1, 48 pacotes variáveis distribuídos sem duplicação, 12 perdas deliberadas reconstruídas byte a byte por FEC sem NACK, autenticação e memória limitada.
- `qa-portatil/bonding-aggregate-nack-real.json`: oito checks; MPEG-TS real igual byte a byte após perdas, NACK autenticado, cache limitado e rejeição de replay/adulteração no modo agregado.
- `qa-portatil/bonding-fec-nack-real.json`: oito checks; duas perdas por grupo acima da capacidade XOR recuperadas por NACK, MPEG-TS igual byte a byte, guards de autenticação preservados.
- `qa-portatil/bonding-aggregate-ui.json`: três checks; navegador salvou agregado/FEC4/peso2 por NetworkEngine real e uma instância nova leu a configuração persistida. Nenhuma mídia iniciou ao salvar. Captura `bonding-aggregate-ui.jpg`.

API/configuração: `mode: 'duplicate' | 'aggregate'`, `fecGroup: 0 | 2..16`, `paths[].weight: 1..100`. Leitura informa `mode`, `bandwidthAggregated`, `wanThroughputVerified:false`, `fecGroup`; emissor/receptor têm contadores de FEC, perdas, bytes e caminho. Export do receptor leva estes campos; ambos os lados precisam da versão atual para FEC.

Limites: a distribuição de tráfego é real e comprovada em localhost. Não foi medido ganho de velocidade em WAN, rádio/4G, failover físico ou endurance. XOR recupera uma perda por grupo se a paridade chegar antes do limite de jitter; perda de paridade, perdas maiores e indisponibilidade prolongada dependem de NACK e tempo disponível. Os pesos são configurados manualmente, sem estimativa adaptativa de capacidade. FEC acrescenta 1/grupo de tráfego de paridade, além de headers e retransmissões. Preservados operador, API 8088 e configurações da instalação principal.
