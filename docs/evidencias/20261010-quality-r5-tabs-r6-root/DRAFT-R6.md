# R6 — um formulário de qualidade por vez

Derivação UI separada da R5 backend congelada. Apenas HTML e helper novo `efeitos-abas.js`. Quatro abas: Qualidade (padrão), Legendas, Efeitos criativos e PTZ. Um painel visível; IDs e todo conteúdo dos quatro painéis são preservados byte a byte. As explicações existentes de disponibilidade/limites permanecem dentro do respectivo painel.

ARIA tablist/tab/tabpanel, controls/labelledby/selected, tabindex móvel, setas com wrap, Home/End e foco visível. Hash conhecido permite ligação direta; hash inválido/malformado seleciona Qualidade. CSS hidden explícito evita que o grid revele painéis ocultos. Trocar aba só apresenta os controles existentes; não aplica, não coloca no ar, não dispara evento de comando, não reseta seleção e não modifica o gate. Os scripts originais continuam na mesma ordem após o helper, com estado mantido mesmo no painel oculto.

8 testes do helper DOM real em VM + syntax. Sem servidor, navegador, Native/API, capturas novas ou alegação de aprovação visual. Root precisa inspecionar a tela renderizada após integrar/servir em seu QA autorizado. A ausência de screenshot nesta revisão é deliberada para preservar exclusividade de runtime Root; a prova aqui é de comportamento/estrutura.

Aplicar sobre `efeitos.html` R5/R4/R3 SHA450429d47d3fa47dcea661cd8364eb99886887a61f47bc425ae9c292aac75092. R5 10 produtos + esta substituição HTML + novo helper resultam em **11 product files**. Novo fechamento `painel/remoto/efeitos-abas.js`. Não reescrever freezes anteriores nem executar preparações como instalador.
