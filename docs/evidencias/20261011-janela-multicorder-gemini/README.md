### CONTINUAR: MultiCorder R7 Integrado nos Fontes Canônicos

- **Status:** Integração do MultiCorder R7 concluída com sucesso sobre `HEAD 4282be6ce582d3625425389b2a384e0516dcbe45` após aprovação do runner empírico R7 (26/26 PASS, recibo `6dce860c6ab8dd28d163eb8512eff5bceb57ab912c6f74de3f2ee3e965fda3c5`, encerramento cooperativo CIM `edgeProfileCount: 0` e PINs inalterados).
- **Fontes Canônicos Atualizados:**
  - `painel/remoto/multicorder.html` e `painel/remoto/multicorder.js`: Diálogo de MultiGravação moderno com 4 deadlines de 8s protegidos, isolamento de `stateEpoch`, discriminação entre falha de rede e HTTP 400 e preservação de seleções do operador.
  - `painel/mesa.html`: Engrenagem da MultiGravação vinculada a `/multicorder` no viewport padrão 700×540 px.
  - `ferramentas/servidor-api.mjs`: Rota `/multicorder` adicionada, preservando a rota legada `/iso` para acesso às opções avançadas.
- **Histórico e Diagnóstico:** Artefatos e evidências de falha das etapas R1 e R5 mantidos imutáveis no repositório.
- **Fronteiras e Escopo:** Validação estrita em `MOCK_API_REAL_DOM_ONLY`. Não inclui alteração em binários de distribuição, Setup 600 ou drivers de hardware CEF.
- **Próximo Alvo de Engenharia:** Diálogo de Configurações de Replay (`ReplaySettings` em `/replay?view=settings#replay-config`).
