# Menu da entrada: apresentação isolada e evidência

Prévia: http://127.0.0.1:57905/draft?sources=multi. Baseline: /baseline?sources=multi. Dados e nomes próprios; nenhum Native, conta, saída ou gravação. Root capturou pelo IAB; este agente abriu os bytes14/15/17/18 (16 preservada junto15 como FAIL informado pelo Root). Não foi usada GUI externa/PInvoke/Playwright.

O baseline14 mostra15 ações lineares, incluindo propriedades/filtros de cada fonte. O draft mantém todos os botões originais e seus data-a/data-v, agrupando nós. Uma fonte mantém Configurar no básico; múltiplas fontes ficam em Fontes desta entrada com nome completo e tipo resumido, sem abreviar identificadores. Editar título continua básico quando existe. Camadas e Minimizar/Expandir continuam básicos. Filtros e a ação Calls pertencem à fonte correspondente; o texto não presume que qualquer Browser seja uma chamada. Áudio adicional, velocidade, renomear, cor e projetor ficam em Mais opções da entrada. Fechar permanece separado; a ausência original no Programa e o backend de UUID/scope/tally/keyers não mudam. GO/Cut/Preview não são interceptados.

## Capturas e falha preservada

-14: lista original real, renderMenu extraído do source pinado.
-15/16: FAIL visual da prévia; o popover apareceu como faixa24px. O harness incorporava body grid do layout completo da mesa mas colocou o menu como segundo filho relativo, dentro do track24px. Overflowvisible do baseline mascarava a faixa; overflowauto do draft revelou o problema. Correção exclusivamente do harness: body block/altura automática/min-height. Não foi necessário alterar engine/produto para essa falha.
-17: collapsed com controles básicos e títulos dos grupos visíveis.
-18: Fontes aberto, nomes/ações legíveis, limite de altura com rolagem. Capturas de dados próprios, sem prova de z-order/Native.

O helper usa placePop existente depois de agrupar os nós e no toggle de details; a primeira chamada original calculava tamanho antes do agrupamento. Três testes adicionais comprovam encaminhamento e ausência de reposicionamento de outro popup. A prévia usa posição relativa e não possui placePop;17/18 representam a disposição, e a chamada de posicionamento é coberta por VM, não por uma captura instalada do popover fixo.

## Testes e integração

44 contratos PASS: sete casos (fonte única, múltiplas, vazia, Programa, composição no ar, nomes especiais integrais, tipo desconhecido), identidade única de todos os botões, atributos de ação/destino intactos, details fechado por padrão, idempotência, texto escapado, estados minimizar/velocidade, ausência da ação destrutiva no Programa, estilo/foco escopado e três contratos placePop. Modelo DOM/VM finito, sem inferir funcionamento Native ou acessibilidade completa. node --check do helper PASS.

Integração para Root: dois arquivos novos FreeMix/painel/remoto/input-menu-ui.js e .css; mesa-includes.patch acrescenta somente CSS no head e helper após scripts existentes. PATCH-GUARD.json fixa mesa a436f64e0e558cbcfe13af30c789f9a3a97151ce9075c71aca6b660ed4266a5c. Remover os dois includes recupera bytes originais exatos. Não aplicar draft/mesa.html inteiro sobre outra revisão; Root pode integrar os dois hunks com guard.

## Auditoria read-only de Input/Delete/minimize e janelas

Canonical já inclui FreeMixRaiseInputDialog em frontend/widgets/OBSBasic_MainControls.cpp92/116/134: proprietário QObject principal, transientParent apenas para requester pertencente ao FreeMix, raise/activate. Não se declara Properties/Filters ainda atrás sem prova visual. O recibo native23-input-handoff-retry1/report.json prova fechamento CEF e fila do editor, e conserva visualConfirmation=false/queuedOnly=true. get_interface em FreeMixMultistream.cpp1534–1553 informa panels/nativeSettingsOpen, porém não visibilidade/atividade/transientParent dos editores de fontes; ACK continua aceitação, não confirmação de foco.

CreateInteractionWindow em OBSBasic_MainControls.cpp75 só Init/show; não passa pelo helper. A mesa atual não oferece OpenInputInteractDialog neste menu; é uma assimetria de API Native, sem reprodução de falha e sem prioridade equivalente ao fluxo Properties/Filters. Nenhuma correção Native proposta/aplicada nesta frente.

Delete: mesa.html1120–1121 mantém alvoUUID/coleção confirmados; controle-producao.mjs104–120 consulta Programa/árvore ativa/keyers. Native12 e post-root-iab existentes já provam guarda Programa/keyer, exclusão off-air e Cut. Não repetidos. Minimizar mesa.html1457–1459 é estado/localStorage/renderTiles local; post-root-iab registra interação do Root, sem medir z-order/latência neste relatório.

Próxima QA instalada: abrir menu numa entrada real simples e numa composição3fontes, confirmar grupo/scroll/foco/nomes completos, abrir Configurar/Filtros por caminho original e conferir visualmente a janela própria. Programa/keyer/coleção/exclusão continuam com guards já aceitos; não remover ou redesenhar estes contratos. Não há autorização/alegação de hardware, source media ou aprovação geral.
