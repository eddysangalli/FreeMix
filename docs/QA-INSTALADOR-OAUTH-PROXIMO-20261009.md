# Próxima rodada: OAuth no módulo instalado

Depois de fechar e congelar os recibos reais233334, foram acrescentadas somente quatro linhas ao harness `scripts/installer-windows/qa/distribution.mjs`. A remoção dessas quatro linhas recompõe exatamente o SHA256 anterior; instalação, importação, credenciais e desinstalação não foram modificadas.

O novo fixture grava uma requisição HTTP com callback relativo e parâmetros `code/state` em um log próprio. Também grava um objeto com `state` comum de produto. Duas novas assertivas exigem que os valores sintéticos OAuth desapareçam e o estado comum permaneça: uma sobre o ZIP produzido pelo DiagnosticCollector realmente instalado, outra sobre o ZIP da CLI realmente instalada com o Node empacotado. Os valores de fixtures não são impressos nos resultados. Nenhum redator fonte é substituído pelo harness.

Sintaxe Node PASS. Novo plano próprio `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-CandidateNext-TjY7cm/plan.json`: preparação e context PASS, 26 baselines preservados, nenhum candidato ou instalador novo executado. Não repetir context nesse plano. O plano antigo permanece com sua rodada233334 e seus recibos congelados; o hash de fonte alterado impede sua reutilização.

`qa-finalizacao/installer-oauth-next-prepared/` contém diff, hashes anterior/posterior, prova de que apenas quatro linhas foram acrescentadas, context e resumo de execução. A execução real desta regressão permanece pendente do próximo pacote/Setup/version/SHA explicitamente fornecidos pelo coordenador. Esta preparação não comprova que o redator de um novo candidato passou.
