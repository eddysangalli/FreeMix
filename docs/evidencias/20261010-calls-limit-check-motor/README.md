# Calls — três ajustes UI isolados

Somente drafts de `painel/remoto/calls.html` e `calls.js`, contra os dez pins do roteiro anterior, mais pins de `controle.js` e `servidor-api.mjs` lidos para confirmar o contrato. Não aplicados ao produto. Nenhuma alteração API/core/Native/Gate.

- Exibe `videoReturnLimit`, modo padrão/experimental e capacidade reportados. Campos ausentes aparecem como desconhecidos. Não oferece opt-in nem habilita captura contínua; não atribui homologação A/V à aceitação de comando.
- **Conferir motor** usa GET `/api/json` sem parâmetros Function, sem POST e sem retry. Essa rota autenticada já existe e retorna `clean()`; é o snapshot publicado, não uma nova leitura SDK. Fetch e JSON têm prazo conjunto de 5 s. Só aceita estado conectado/recentemente atualizado (até 2,5 s), no mesmo projeto; uma versão WS mais recente prevalece. Reconciliam-se somente rascunhos awaitEcho/echoTimeout com UUID e quatro valores coincidentes. Uma edição dirty mais nova permanece. O texto distingue estado atual de ACK original e de recepção.
- O resumo de áudio customizado indica **+ outros convidados** quando a conversa está ligada. Mixer/roteamento permanecem os mesmos.

## Evidência e integração proposta

`patches/*.patch` tem caminhos finais `painel/remoto/…`; Root deve conferir SOURCE-PINS e os dois hashes baseline antes de aplicar. `prepare.mjs` produz apenas cópias offside/patches. `test.mjs`: 23 casos VM PASS, incluindo scope/UUID/edição/WS mais recente/timeout JSON/pagehide/GET sem mutação. O harness expõe duas variáveis apenas na string VM; não altera bytes do draft em disco.

`capture-fixtures.mjs`: Edge headless sobre arquivos próprios, sem servidor/API/Native. `controle.js` é substituído por estado sintético explícito e fetch que recusa mutações. Calls draft é embutido byte exato. Três PNGs finais revistos: padrão/custom em 1280×900, experimental em 600×900, capacidades ausentes em 1280×900. O texto quebra linhas e o cartão mostra outros convidados; mobile exige rolagem vertical para talkback. Isso não homologa CEF/motor/WAN. Perfis do navegador são privados e excluídos da allowlist.

O botão consulta todos os retornos; não interfere no microfone, nos destinatários ou em preparar/reconectar/parar. Não tenta resolver confirmação divergente repetindo a mutação. O snapshot consultado prevalece sobre a cópia WS antiga até receber uma versão mais nova, mudar projeto/conexão ou exceder 2,5 s; então o render periódico retoma o estado normal.

`Docs/OPERAR-CALLS-E-SAIDAS.md` é a versão curta do roteiro para Root copiar para Docs, se aprovada. Fonte anterior/receipts/Gate FAIL permanecem intactos. Sem dados reais/credenciais/links de convidados no export.
