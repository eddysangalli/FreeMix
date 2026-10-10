# Draft isolado: criação e configuração de entradas

Status: **DRAFT ONLY / contrato JavaScript PASS / Native não compilado nem executado**.

Nenhuma fonte do produto, índice Git, mesa do operador, instalador, pacote selado ou ticker foi alterado. As cópias `before/` preservam os bytes de partida; `base-pins.json` identifica SHA256 e tamanho. Os três arquivos `draft/` são candidatos a revisão/aplicação pelo root.

## Fluxo proposto

`mesa.html` compartilha `creatingInput` entre clique e Enter e previne submissão do Enter. Desabilita campos/botões durante as requisições e restaura o estado disabled anterior no finally. Validação de nome/tipo acontece antes de bloquear. Escape/Cancelar não fecha uma criação em andamento.

Depois de criar uma entrada que depende das propriedades de plugin, a página envia **uma chamada** vendor `finish_input_panel` com URL registrada do próprio painel, nome da fonte e editor. A versão antiga sem esse request recusa o comando: a entrada e o formulário continuam disponíveis, com erro orientando a usar a engrenagem. Não existe fallback que feche um painel e silenciosamente perca a abertura do editor.

O novo handler valida painel, editor, fonte e estado de encerramento antes de qualquer fechamento. Mantém a fonte por referência RAII, fecha o painel pelo lifecycle cooperativo existente e aguarda sua destruição antes de abrir propriedades/filtros. O timer de 25 ms tem limite de 160 ticks; cancela durante shutdown/remoção da fonte e registra aviso genérico sem nomes/URLs. `success:true, queued:true` significa **aceito para execução**, não editor visualmente confirmado. Recusa de fechamento ou timeout posterior permanece no log; não cria/apaga fonte, não inicia saída.

Em janela JavaScript criada por um navegador externo, conserva a alternativa de abrir propriedades pela API existente e depois `window.close`. Painéis CEF usam o novo vendor porque `plugins/obs-browser/panel/browser-panel-client.cpp:378–387` substitui `window.close` por console.log. Não foi encontrado `fechar_dialog` nas fontes atuais de painel/API; não foi inventada uma rota HTTP para ele. O request `close_panel` já existente e sua fila protegida de destruição permanecem intactos.

Propriedades/filtros continuam com pai **OBSBasic**, preservando `main=qobject_cast<OBSBasic *>(parent)`, callbacks, modal/config e lifetime existentes. O helper ajusta somente o transient parent de QWindow para o painel solicitante pertencente ao main, quando esse requester ainda existe, e chama raise/activateWindow. Não usa AlwaysOnTop, não move ou minimiza a mesa, não troca o QObject parent.

Depois de criar Call, abre `/calls` antes de fechar o formulário. Os links vêm do estado real do engine (`calls-producao.mjs:58–59`, consumido por `painel/remoto/calls.js:29`), incluindo retornos preparados FMX. Não inicia retorno, câmera virtual, talkback ou rede. O popup legado de links continua fora do escopo deste patch para entradas preexistentes; unificação completa desse acesso é trabalho posterior, não conclusão deste draft.

## Erros e preservação

Não há rollback destrutivo. Uma falha de CreateInput preserva a cena criada e informa que sua fonte não foi confirmada. Uma falha no lote preserva entradas anteriores. Uma falha de handoff/console após criação informa que a entrada já foi criada e lista os nomes; o operador confere antes de repetir. Não há RemoveInput/RemoveScene no fluxo. Reenquadramento conserva o tryReq anterior.

## Evidências

`node --check prepare.mjs`, `node --check test.mjs` e `node test.mjs` passaram. Os scripts inline completos da cópia mesa.html também foram analisados pelo parser V8.

`result.json`: 11 verificações, executando os helpers e handlers JavaScript extraídos da própria cópia com DOM/transporte sintéticos; guard clique/Enter, disable/restore, erro parcial, handoff recusado, Calls sucesso/falha, lote, navegador externo, fechamento CEF, contrato Native estrutural e aplicação exata dos três patches em TEMP própria. SHA256 de três fontes originais permanece igual aos pins.

Dois FAILs do harness foram preservados: extração de return fora de callback e normalização CRLF de git diff/apply. Ambos foram corrigidos somente na QA. Os patches preservam CRLF; usar `git -c core.autocrlf=false apply --check` primeiro contra uma cópia/pins vigentes. Não usar prepare.mjs para sobrescrever este freeze; uma base diferente exige outra rodada/diretório.

## Integração e gates do root

Revisar os três patches; comparar os três pins antes de aplicar. Aplicar Native e mesa em conjunto, registrar versão/capability de request se desejado e compilar exclusivamente pelo root. Não aplicar somente mesa no operador: Native antigo falha de forma preservadora, mas não realiza o handoff.

Faltam compilação Qt/C++, CEF real para fechar painel de origem e abrir uma única propriedade/filtro à frente, clique/Enter repetidos reais, fechamento com outra janela CEF ativa e cancelamento durante shutdown/remoção da fonte. O timer e transient owner precisam desses ensaios. JavaScript mock e asserts estruturais não são prova de z-order, ausência de crash/leak nem homologação de dispositivo. Nenhum programa Native foi iniciado nesta frente.
