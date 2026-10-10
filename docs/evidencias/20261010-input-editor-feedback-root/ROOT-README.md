# Configuração de entradas com identidade e confirmação

Root integrou três fontes: mesa.html, input-menu-ui.js e novo input-editor-feedback.js. Configurar/Filtros usam sourceUUID e conferem composição/coleção/conexão antes e depois das leituras. A interface informa pedido recebido e observação da janela separadamente; duplo clique não abre duas vezes e timeout não repete a abertura. A consulta manual é somente leitura.

O menu elimina repetição da mesma fonte, descreve Configurar/Filtros, renomeia a ação local para Recolher cartão e a remoção para Excluir entrada. Confirmação de exclusão mantém UUID/coleção e proteções Programa/keyers anteriores. Native, Core e API não foram alterados.

Root repetiu34 contratos no helper/handlers reais e DOM próprio, conferiu23pins do draft/7baselines, sintaxe de scripts e closure132. O helper é copiado junto ao painel e carrega antes do menu. Gemini source-only foi acompanhado pelo agente; revisão Root é independente. Nenhum Native/API/browser/desktop executado nesta integração.

Prova pendente: janela Properties/Filters real, aceitação versus close recusado, interação em CEF, latência/persistência e apresentação visual. Visibilidade Qt não confirma z-order Windows. O preflight não é transação atômica contra outra conexão trocar coleção antes do dispatch. Setup600 permanece selecionado; não existe novo instalador aprovado.
