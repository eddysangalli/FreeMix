# Entradas: abertura com identidade e feedback — draft isolado

Estado: somente proposta de integração. Não aplicado ao produto, ao Native, ao instalador ou ao operador. Testes executados apenas em CPU/VM/DOM próprios; não houve Native/API/browser/desktop. Sem aprovação visual ou de z-order.

## Constatações

1. `FreeMix/painel/mesa.html` fecha o popover antes de Properties/Filters, envia apenas inputName e não apresenta confirmação de janela. Um ACK WS bem-sucedido indica que a API aceitou a chamada; RequestHandler_Ui.cpp não verifica visibilidade. CreatePropertiesWindow/CreateFiltersWindow também podem retornar sem abrir a nova janela se a janela anterior recusar close(). Esse mecanismo existe; sua ocorrência no desktop do operador não foi reproduzida aqui.
2. O Native atual já executa raise/activateWindow e restringe transientParent a uma janela pertencente ao FreeMix. Não há evidência nesta análise para alterar ownership ou aplicar always-on-top. Qt documenta que activateWindow no Windows não assume o foreground de outro aplicativo ativo. Isso explica uma condição possível, sem provar que ela ocorreu neste caso. [Qt QWidget::activateWindow](https://doc.qt.io/qt-6/qwidget.html#activateWindow).
3. “Minimizar entrada” altera somente localStorage/DOM do cartão. Nenhuma minimização de janela Native ou interrupção de mídia ocorre nessa ação. O renderer síncrono reconstrói os cartões; esta análise não mediu latência ou atribuiu o relato de lentidão a ele.
4. Excluir entrada já usa sceneUUID/coleção e recibo operacional confirmado. O backend protege Programa/árvore ativa/keyers. O draft preserva closego, productionAction e controle-producao.mjs. O clique de confirmação recebe um guard adicional para não capturar por nome uma entrada substituída.
5. GetSceneItemList realmente fornece sourceUuid (Obs_ArrayHelper.cpp). O snapshot da mesa descartava esse campo. Fontes repetidas na mesma composição geravam ações e seções duplicadas.

## Draft concreto

Allowlist de produto: `FreeMix/painel/mesa.html`, `FreeMix/painel/remoto/input-menu-ui.js` e novo `FreeMix/painel/remoto/input-editor-feedback.js`. A integração pertence ao Root; obs-vmix permanece intacto. Os sete baselines públicos lidos e seus hashes estão em BASELINE.json.

O botão guarda sourceUUID, sceneUUID da entrada e coleção. Antes de abrir, duas leituras limitadas conferem os itens da cena pelo UUID e a coleção Native; cada await verifica conexão, coleção e associação local de fonte/cena. Uma única RPC Properties/Filters usa inputUuid. Um clique rápido adicional não enfileira nova abertura. Guarda o nome atualizado da mesma fonte para o feedback, apresentado por textContent.

A mesa mostra feedback persistente: identificando, abrindo, pedido recebido, janela observada, ou confirmação incerta. Após ACK, uma consulta única get_interface com show:false/screenshot:false/sourceEditors:true observa somente a mesma fonte e o mesmo tipo de editor. Qt visible/active/focus são atributos observados, nunca prova de posição acima de outro aplicativo. O helper ignora campos Native de PID, caminho, título e screenshots.

Deadline padrão de cinco segundos por chamada. Um timeout antes da mutação é recusa com zero abertura enviada; após dispatch fica incerto e bloqueia outra abertura. Conferir janela envia somente uma leitura. Liberar controle é abandono local explícito: não cancela nem repete a abertura antiga, e não pode ocorrer enquanto o pedido/leitura atual está em curso. Conexão estrangeira nunca recebe pedido por uma intenção antiga. Timeout não significa cancelamento de RPC no motor.

Recolher/Expandir cartão descreve a ação local e mostra feedback. Excluir entrada explica a remoção do projeto. Seus botões capturam sceneUUID/coleção; dados obsoletos são recusados. O formato legado mesa.minimized por nome continua para manter compatibilidade; não se afirma migração de preferências entre coleções. O menu deduplica a mesma identidade de fonte e mantém os nós/atributos dos botões e os handlers já existentes. Fontes distintas não são agrupadas apenas por nome quando há UUIDs.

## Prova e limites

`test.mjs` executa os três drafts reais: helper, handlers da mesa extraídos e menu em DOM finito. São 34 checks: ACK versus Qt, UUID/kind/identity/visible/minimized, capability ausente/closing, fonte renomeada/removida, conexão/coleção trocada entre awaits, homônimos distintos, duplo clique, timeout/erro da primeira escrita, ACK tardio, consulta manual sem segunda abertura, recolhimento sem RPC, recusa local obsoleta/lock de exclusão, nós/atributos preservados e syntax.

Gemini source-only: resultado SUCCESS, conversa 238fbde2-ed16-4ed0-88ae-30ae0bbc39ac, 55.861 s, uma interação, somente brief público isolado. Não foi aceito como prova o seu exemplo hipotético de recusa retornar um status especial: o handler Native atual responde ACK normal. Também não foi implementada a migração por UUID de mesa.minimized sugerida pelo modelo, pois é outro contrato de persistência. A revisão independente e os testes reais do draft prevalecem.

A prova anterior Native25 em native25-http-iab-editor-frozen-safe-review2-20261010/report.json observou uma Properties própria por UUID, visible/activeWindow/focusWithin verdadeiros e zOrderVerified falso. É prova histórica Qt de outro Native, não aprovação do desktop atual ou deste draft. O recibo input-menu-root-integration-20261010 confirma 44 contratos da integração anterior; eles não substituem os novos checks.

Ainda falta: Root revisar e aplicar os dois hunks + copiar o novo helper, incluir o helper no closure/pacote, executar uma raiz Native própria da versão escolhida, confirmar visualmente Properties/Filters numa fonte e composição, dialog-close recusado/CEF-close, teclado/contraste/posicionamento do aviso, latência e exclusão Programa/keyer/off-air. Nenhuma etapa desktop foi prometida como concluída. A consulta Native não equivale a criação recente da janela e pode observar uma janela já aberta da mesma fonte. O preflight não constitui transação atômica contra uma troca de coleção feita por outro cliente no intervalo entre a leitura e a abertura; não se propõe inventar garantia sem contrato Native novo.

Comando CPU de revisão, sem runtime:
`"C:/Program Files/nodejs/node.exe" qa-finalizacao/input-editor-feedback-offside-20261010/test.mjs`

Integração guarded: conferir BASELINE.json e PRODUCT.json antes de aplicar input-editor-feedback.patch; copiar o helper novo pelo hash de PRODUCT.json. Não sobrescrever mesa de outra revisão inteira. Não há mudanças de Native/Core/API ou promessa de correção física do foco.
