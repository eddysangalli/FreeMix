# Entrega atual do FreeMix

O instalador selecionado é **0.1.0-local.20261010060000, Native24/a047860**. As correções posteriores estão em desenvolvimento e não estão incluídas nesse instalador.

Para instalar, execute **INSTALAR-FREEMIX.cmd** da raiz e escolha uma pasta nova/vazia. Depois use o atalho FreeMix Studio. Para diagnóstico, use **COLETAR-LOGS.cmd** ou o botão Diagnósticos: gera ZIP local sanitizado para envio manual por e-mail/WhatsApp. Não há upload automático.

Setup: **FreeMix-Studio-Setup-0.1.0-local.20261010060000.exe**. Seleção e hash: [INSTALADOR-ATUAL.json](../entregas/INSTALADOR-ATUAL.json). SHA256:3a53cc01ea2998d785e4914c219084e6868ad4bf7b33fff31f074685878993bd.

Prova: [relatório instalado](evidencias/20261010-setup060000/qa-finalizacao/setup-060000-qa/report.json). Foram conferidos9582 arquivos do pacote e2085 do runtime Native, dois fechamentos cooperativos, diagnóstico e desinstalação conservadora em raiz própria. Assinatura interna Ed25519; sem Authenticode.

As correções posteriores de operação/desempenho, FTBv2 e retorno contínuo ainda não fazem parte desse pacote. Não usar a versão selecionada como evidência dessas implementações. Consulte [situação](ATUALIZACAO-20261010.md) e [pendências](PENDENCIAS-REAIS.md).

035000 é a seleção anterior preservada.050500 foi candidato não selecionado e seu FAIL original permanece registrado. Nenhuma instalação do operador foi substituída automaticamente.
Histórico anterior completo: [registro preservado](historico/20261010-preNative25/ENTREGA-ATUAL.md).
