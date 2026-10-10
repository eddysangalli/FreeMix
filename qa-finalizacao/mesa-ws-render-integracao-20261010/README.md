# Draft de timeout WS e pintura por frame

Base: `FreeMix/painel/mesa.html`, SHA `6d1d2b76c4dfdb21cb12a03aa6f86dd4bd1927bfdc17e46910e456196bd787c9`. O arquivo do produto permanece intacto. `before-mesa.html` conserva os bytes da base, `draft-mesa.html` contém a proposta e `mesa.patch` usa o destino `painel/mesa.html`. Root deve revisar e integrar por trechos com o patch de operações do outro agente; não substituir um arquivo central já atualizado sem comparar base.

19 contratos PASS em VM/DOM próprio, incluindo sintaxe de todos os scripts inline, bloco A e atalhos byteidênticos, ACK imediato, ACK após timeout, ACK antigo diante de pedido novo, recusa explícita, erro ao enviar, socket antigo, janela oculta, teardown e erro de pintura. Os sete contratos adicionais executam o render real e atualizações de cartões/metadata, verificando identidade de botões, disponibilidade de Fechar e classes finais. `git apply --check` passou contra cópia própria da base. Nada foi aplicado em produto ou compilado; não houve Native, CEF, rede ou comandos do operador.

## Comportamento proposto

- Timeout de 15 segundos por pedido WS, correlacionado pelo ID; resposta, recusa, fechamento ou expiração removem pending e timer. É um limite conservador proposto, não meta de latência de Cut.
- Expiração e interrupção são **resultado incerto**, com orientação para conferir o estado antes de repetir. Isso não cancela a operação no motor. Nenhum pedido é repetido automaticamente; ACK tardio é ignorado e não resolve pedido novo. Reconexão de transporte já existente continua no fechamento normal.
- Envio, estado de eventos e ACK permanecem imediatos. Pinturas disparadas por `onEvent` são agrupadas por frame. PGM/Preview/mute/tally atualizam classes de tile/tt/Audio diretamente nos cartões existentes; preservam GO/Cut/minimizar/Audio e alteram somente o botão Fechar necessário ao estado no ar. Metadata distingue tags (estrutural) de tally (in-place). Inicialização, ações diretas, confirmação/exclusão e demais rotinas de sincronização mantêm seu fluxo síncrono.
- Janela oculta acumula apenas nomes de renderizadores em Set, no máximo quatro neste contrato, e pinta ao voltar. `pagehide` cancela frame, rejeita pendentes, fecha o WS cooperativamente e impede reconnect nesse documento encerrado.
- SceneList, tags, filtro e minimizar continuam usando reconstrução estrutural. Se nomes/quantidade dos cartões não corresponderem ao estado, o atualizador in-place usa o renderer completo. Uma pintura estrutural agendada elimina a atualização redundante de tally naquele frame.
- Erro visual gera aviso genérico e permite pintar os outros controles; não expõe conteúdo do erro.

Preserva integralmente os handlers de entrada com o handoff já integrado, GO/Cut/delete e atalhos. Não modifica `productionAction` ou backend. O teste compara seus blocos reais antes/depois.

## Limites e integração

Mudanças estruturais continuam reconstruindo DOM inteiro. Identidade dos cartões e dos botões foi comprovada no DOM finito para tally/mute, incluindo a propriedade de foco do harness; isso não prova comportamento físico de pointer/foco em CEF. A pintura de mixer ainda pode reconstruir faders. Não corrige trabalho no Native ou filas no backend. Não há prova de desempenho real em CEF. A base examinada e o patch têm hashes, e o teste original de render continua congelado em diretório separado.

O handler `pagehide` encerra este documento; em eventual navegação com BFCache, é necessário recarregar/reinicializar em vez de assumir reconnect automático. O caminho do CEF precisa de smoke real após aplicação. Pedidos caros podem exigir política de timeout diferente se evidenciarem duração legítima acima de 15 s; não aumentar nem repetir comandos silenciosamente.

Preparar: `node qa-finalizacao/mesa-ws-render-integracao-20261010/prepare.mjs`; testar: `node qa-finalizacao/mesa-ws-render-integracao-20261010/test.mjs`. Não reexecutar prepare contra uma base nova sem conservar este freeze. A primeira variante sem in-place está preservada em `v1-frozen/`, allowlist SHA `d1fda89d6ae2c02b9719160c4d6b3d6891f98ff13f2f13f91654a979cfae7248`. Uma falha do harness por stub `renderTabs` ausente foi preservada e corrigida somente no teste. Allowlist final exclui a cópia duplicada `patch-check/` e qualquer arquivo de outro agente.
