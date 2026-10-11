# Evidência e Handoff: Melhorias de UI do Diálogo de Chamadas (Talkback & Busy Guard)

- **Data:** 11 de Outubro de 2026
- **Módulo:** Interface de Usuário de Chamadas (`calls.html`, `calls.js`)
- **Autor da Revisão:** Agente Gemini (Codex Orchestration)
- **Escopo Formal do Teste:** `MOCK_API_REAL_DOM_ONLY`
- **Commit Base:** `1775a550c0aac5210ae266acdc6db21132179c81`

---

## 1. Resumo Executivo das Melhorias

Duas melhorias pontuais e não intrusivas foram implementadas na camada frontend, mantendo fidelidade estrita ao layout compacto padrão vMix (envelope de 700×540px) e sem alterar contratos da API REST `/api/control`, da camada Core nem do motor nativo OBS:

1. **Talkback no Corpo Principal com Ocultação Condicional de Alvos:**
   - O controle `Talkback para` (modos `all` [Todos os convidados] e `selected` [Somente os marcados]), o container de seleção `#targets` e o status textual `#talk-status` foram transpostos para a janela principal (fora de `#advanced`).
   - Quando em modo padrão global (`all`), a linha `#targets` permanece colapsada (`hidden = true`), ocupando zero espaço vertical e preservando o limite de 540px.
   - Ao alternar para `selected`, `#targets` expande seus checkboxes. A alternância entre abas de chamadas preserva a seleção sem disparar retargeting automático indesejado.

2. **Busy Context Guard em Ações Assíncronas:**
   - Os seletores de abas numéricas (`#nums button`) e as linhas da tabela do gerenciador (`#rows tr`) passam a ignorar eventos de clique enquanto `busy === true` (durante o envio e processamento de mutações assíncronas como `call_create`, `call_return_route`, `call_reconnect`).
   - Previne descompasso de visão do operador e confirmações com alvos trocados.

---

## 2. Evidência Empírica Local (Edge Headless / Real DOM)

O runner autocontido de validação (`run-test-calls-dom-r4.mjs`) foi executado em ambiente isolado via Chrome DevTools Protocol (CDP) no Microsoft Edge (`700x540`), servindo uma API sintética declarada em porta efêmera loopback.

- **Recibo de Teste:** `receipt-test-calls-dom-r4.json`
- **Hash SHA256 do Recibo:** `1fdefd62e64900834a5353586dc6180922caaf14195baf6e48d0987c774be1a1`
- **Resultado:** **25/25 Asserções PASS (0 FAIL)**
- **Processo Edge:** `exitObserved = true` com teardown limpo sem deleção forçada de arquivos.

### 2.1. Portões de Teste Aprovados (Gates)
- **Gate 0 (0 Convidados / Startup Silencioso):** 0 requisições `POST /api/control` no startup; tab 1 livre (`+`) e demais inibidas; Talkback em `all` com `#targets` oculto; status exibe inibição (`Nenhuma chamada criada.`).
- **Gate 1 (2 Convidados / Talkback):** Criação e identificação de 2 chamadas; expansão de `#targets` ao mudar para `selected`; desmarcação refletida via event bubbling (`bubbles: true`); troca de abas sem retargeting automático; talkback ativado por pointerdown, ping a 350ms comprovado e parada automática por evento de `blur`.
- **Gate 2 (Rascunhos Concorrentes / Escala 8 Convidados):** Retenção simultânea de rascunhos de rotas entre abas distintas sinalizados como `não aplicado` no gerenciador; preenchimento dos 8 slots sem quebra estrutural do rodapé (`bottom <= 540px`).
- **Gate 3 (SlowACK & Busy Guard):** Injeção de 1200ms de latência no `POST /api/control`; bloqueio estrito de cliques em abas e linhas enquanto `busy === true`; liberação normal e reatividade imediata após o ACK.

---

## 3. Limitações e Fronteiras Técnicas

> [!WARNING]
> **Isolamento de Escopo:**
> - Os testes aprovados validam exclusivamente a integridade do DOM real, fluxo de renderização e reatividade de eventos da interface frontend.
> - Não constituem aprovação de hardware físico de microfone (WASAPI), mixagem nativa de áudio OBS nem transporte WebRTC sob conexões WAN reais.
> - O arquivo `OperatorSetup600` e a camada nativa C++ permanecem imutáveis nesta entrega.