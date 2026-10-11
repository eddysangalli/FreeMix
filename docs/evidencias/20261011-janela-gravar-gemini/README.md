# Evidência de Integração: Diálogo de Gravação (Gravar)

## Status e Resumo
- **Interface**: `/gravar` (`painel/remoto/gravar.html`, `painel/remoto/gravar.js`).
- **Mesa**: `recset: '/gravar'`, dimensões `[700, 540]`, título `'Configuração de Gravação'`.
- **Status da entrega**: **SOURCE integrado** no repositório; **NÃO instalado** no operador; nova distribuição com Native38/painel final e testes CEF ainda pendentes.
- **Validação QA Real DOM (Edge headless)**: Runner R6 com **29/29 PASS** em execução finita (exit 0, encerramento cooperativo, processos de perfil 0).
- **Receipt R6**: [`receipt-test-gravar-dom-r6.json`](receipt-test-gravar-dom-r6.json) (SHA256: `e9fb6a34b110322fbef7866189cf70eb63ff7e992d00e713eb4a1b96e638c89c`).
- **Histórico**: Receipts R4b (`c957eebf...`) e R5 (`72967d23...`) preservados (23/28 PASS). As 5 falhas decorreram de escaping Windows de caminho (`D:\...`) na fixture e sequenciamento de mock HTTP 500 no startup, e não de latência de produto.

## Contratos e Comportamento Verificado
- **Zero POST sob falhas**: Aborto estrito com zero requisições mutantes em falhas HTTP 500 (`/api/json` e `/api/settings`), payload sem preset e stale preset drift.
- **Retenção de rascunho**: Preservação determinística dos valores nos campos do DOM durante erros de validação e pré-flight. (Nota: persistência isolada em `sessionStorage` não foi objeto de asserção direta nos testes).
- **Deadline 8000ms**: `AbortSignal.timeout(8000)` no `POST /api/control` dispara exatamente 1 tentativa, não fecha o diálogo (`closeCount: 0`), não executa retry automático e libera controles (`isBusy: false`).
- **Modo Avançado**: Bloqueio de edição simplificada quando em modo avançado e redirecionamento para o editor legado em `/settings?category=recording&context=recording`.
- **Estrutura visual observada**: Lista lateral com 7 formatos de gravação, 3 campos centrais de parâmetros e bloco informativo de resolução/fps.

## Capturas Visuais (Edge Real DOM)
- [`screenshot-gravar-startup-r6-700x540.png`](screenshot-gravar-startup-r6-700x540.png)
- [`screenshot-gravar-advanced-mode-r6.png`](screenshot-gravar-advanced-mode-r6.png)
- [`screenshot-gravar-active-guard-r6.png`](screenshot-gravar-active-guard-r6.png)

## Limites e Escopo
- Validação estritamente em Real DOM / Mock API sintética local em Edge headless.
- Não constitui homologação de gravação real em disco (I/O), codificação de hardware/GPU, dependências WAN ou runtime nativo CEF.
