# Evidência e Handoff: Integração da Janela de Saídas Externas (NDI, OMT, Câmera Virtual e Telas)

- **Data:** 11 de Outubro de 2026
- **Módulo:** Interface de Saídas de Rede e Periféricos Externos (`externo.html`, `externo.js`)
- **Autor da Revisão:** Agente Gemini (Codex Orchestration)
- **Escopo do Teste:** `MOCK_API_REAL_DOM_ONLY`
- **Git HEAD Base:** `ca2f333` (Clean)

---

## 1. Resumo Executivo da Integração

A nova janela compacta de Saídas Externas (vMix style, envelope 700×540px) substitui a abertura direta do editor completo pelo atalho da Mesa, preservando o editor legado através do botão interno "Avançado":

1. **Integração na Mesa Principal (`painel/mesa.html`):**
   - `panelPages['ext']` mapeado para `/externo` (anteriormente `/saidas?context=external`).
   - `panelSizes['ext']` definido com precisão para `[700, 540]` (geometria compacta em vez do padrão 1200×850).
   - Título formal da janela configurado como `'Saídas externas'` em `launchPanel`.
   - O botão "Avançado" dentro da janela externa preserva o acesso ao editor completo via `/saidas?context=external&transport=...`.

2. **Roteamento Estático no Servidor HTTP (`ferramentas/servidor-api.mjs`):**
   - Adição da rota estática `'/externo': 'externo'` no objeto `routes` (carrega `painel/externo.html`), antes da rota `'/transmitir'`.

3. **Arquivos Frontend de Produção Copiados:**
   - `externo.html` (SHA-256: `b82f5a1e70ed99b7499ef933cbc39d9a64981df60d0e3e211c957c29b1c7dc0e`)
   - `externo.js` a partir de `DRAFT-externo.js` (SHA-256: `210e079714e51ddc3714ad3fdfa8ca9e64bb46c7ce22bfb409a7a909eb0e8925`)
   - `vmix-dialogo.css` inalterado (SHA-256: `f3d08180366f933049c4a16b2e136e04c25a6691371d2d1f6e0d97c9da85084c`).

---

## 2. Validação Empírica (Edge Real DOM / CDP)

O runner local (`run-test-externo-dom-r1.mjs`) foi executado em processo isolado do Edge (`700x540`) sobre API sintética declarada:
- **Recibo Formal:** `receipt-test-externo-dom-r1.json` (SHA-256: `87b08141d5c5aef7323dd3bcd9c642d406c5f57743512877fd09c0ca970d299d`).
- **Resultado:** **26/26 Asserções PASS (0 FAIL)**.
- **Processo Edge:** PID 7328 com encerramento cooperativo (`exitObserved = true`), sem deleção de perfis.
- **Pontos Chave Aprovados:**
  - Startup silencioso com zero mutações POST (`postMutatingCount = 0`).
  - Persistência e restauração de rascunhos em `sessionStorage` para NDI e OMT.
  - Ativação de canal Alfa, modo Fill+Key e precisão PA16 (16 bits).
  - Toggle de câmera virtual (`settings_virtual`) e projetores de tela cheia (`settings_projector`).
  - Bloqueio defensivo contra concorrência durante requisições lentas (`busy` trava tabs numéricas e linhas de status).
  - Tabela "Ver Status" interativa e rodapé perfeitamente contido dentro de 540px (`bottom = 540px`).

---

## 3. Limitações e Fronteiras Técnicas Estritas

> [!WARNING]
> - O escopo qualificado é estritamente `MOCK_API_REAL_DOM_ONLY`.
> - Não atesta funcionamento de drivers NDI reais, bibliotecas nativas OMT, hardware de captura, transporte de rede WAN nem áudio de operador.
> - Nenhuma camada nativa C++, instalador ou binário do motor OBS foi modificado.