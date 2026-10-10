# Contratos de operação de saídas

Resultado: 21 contratos PASS no DOM/VM isolado. `outputs-vm.mjs` lê o HTML e executa os scripts reais copiados de saída, contexto e conexão SRT, junto ao rascunho de operação. Os cinco hashes de entrada estão em `result.json`. Nenhum script de produto foi alterado por este harness.

Executar: `node qa-finalizacao/ux-operacao-20261010/test/outputs-vm.mjs`.

Cobertura: abertura/navegação sem escrita; escopo RTMP/SRT; formato preservando nome; padrões somente em vaga clicada explicitamente; saída ativa; salvar/iniciar/parar em sequência; recusa ao configurar sem início posterior; bloqueio de contexto durante operação; captura de destino/configuração antes do await, inclusive mutação tardia e repaint; protocolos após alteração de host; porta, IPv4, Caller/Listener e latência; origem removida preservada e bloqueada; resumo sem chave/query.

O primeiro recibo conserva duas diferenças do modelo DOM posteriormente corrigidas (valor implícito de option e ação de seleção), além do IPv4 numérico inválido aceito pelo rascunho. `result-before-transaction-fix.json` preserva a falha real seguinte: Configure do destino 0 pendente, mudança de contexto e Start do destino 1. O recibo final contém os regressivos das correções do root. Não sobrescrever os recibos preservados.

Limites: DOM próprio finito, sem CSS/layout, CEF, Native, rede, hardware, persistência real ou comandos do operador. Backend, atraso e recusa são fixtures próprias; o contexto usa o setter público e atributos de seleção equivalentes ao painel real. Não executa handlers externos de NDI/OMT/HDR/monitor. PASS funcional de contrato não equivale a aprovação visual ou recebimento de sinal.

`ALLOWLIST.json` congela apenas arquivos QA próprios e hashes de fontes de entrada; não autoriza copiar ou modificar fontes de outros agentes.
