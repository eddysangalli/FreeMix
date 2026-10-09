# QA do próximo instalador — recibos isolados

Preparação **PASS**, candidato novo **ainda não testado**. Nenhuma instalação, EXE Setup, Native ou hardware foi executado nesta preparação.

Os harnesses existentes gravam em `scripts/installer-windows/build/qa-candidate-*.json`; executá-los diretamente sobrescreveria a prova do pacote `0.1.0-local.20261009213415`. O runner `qa-finalizacao/installer-next-candidate-runner.mjs` prepara cinco cópias QA em raiz TEMP própria, criada e marcada pelo `candidate-context.mjs` existente. Nenhum arquivo de produto, Setup.cs, Uninstall.cs, builder ou harness original foi alterado.

As cópias conservam a lógica de instalação, importação, coletor, credenciais e desinstalação. Somente os imports relativos foram convertidos em URLs absolutas para os módulos originais, e os caminhos de recibos foram redirecionados à pasta `receipts` própria. No relatório, a lista de fontes continua apontando para os harnesses originais e a leitura de recibos aponta para a pasta própria. Alguns textos de console herdados citam o nome antigo; o recibo autoritativo aparece no JSON do runner.

## Preparação executada

Plano próprio:

`C:\Users\eddyr\AppData\Local\Temp\FreeMix-QA-CandidateNext-jao2QX\plan.json`

Foi preservada uma cópia por hash de 26 JSON/logs/imagens anteriores de `scripts/installer-windows/build`. O runner confere os originais antes/depois de cada fase; não protege os stubs e `PayloadInfo.cs` gerados pelo builder, que o coordenador precisa compilar para o próximo ZIP. Confere também os hashes dos harnesses originais e shims preparados, impede links/junções e restringe plano, shims e recibos à raiz própria marcada. Uma fase já tentada ou um recibo existente não é repetido: para nova rodada, prepare outro plano.

Teste do `test-candidate-context.mjs` original, executado pela cópia: **PASS**. Apenas fixtures próprias; cobre caminho absoluto obrigatório, marcador TEMP, hash errado, hardlinks, junções e alvo estrangeiro. O runner também passou cinco recusas: plano ausente, opção desconhecida, recibo já existente, candidato implícito e versão antiga213415. Nenhum Setup foi executado. Baseline dos 26 artefatos permanece intacto.

## Execução após o coordenador entregar e autorizar o candidato novo

Não há fallback para a release anterior. Todas as fases do candidato exigem diretório de pacote, EXE Setup, hash SHA256 e versão explícitos. A versão antiga213415 é recusada; a versão do manifesto/diretório deve corresponder ao pedido, o hash do EXE deve corresponder ao pin e todas as fases devem usar o mesmo conjunto. O harness de distribuição original valida assinatura/hashes do pacote completo e usa módulos da instalação real.

```powershell
$plan = 'C:\Users\eddyr\AppData\Local\Temp\FreeMix-QA-CandidateNext-jao2QX\plan.json'
$pkg = 'CAMINHO ABSOLUTO DO NOVO PACOTE ASSINADO'
$exe = 'CAMINHO ABSOLUTO DO NOVO EXE SETUP'
$sha = 'SHA256 FORNECIDO PELO COORDENADOR'
$version = 'VERSAO NOVA FORNECIDA PELO COORDENADOR'
$candidateArgs = @("--plan=$plan", "--package-root=$pkg", "--setup-exe=$exe", "--setup-sha256=$sha", "--version=$version")
node qa-finalizacao/installer-next-candidate-runner.mjs run --phase=verify @candidateArgs
node qa-finalizacao/installer-next-candidate-runner.mjs run --phase=distribution @candidateArgs
node qa-finalizacao/installer-next-candidate-runner.mjs run --phase=credentials @candidateArgs
node qa-finalizacao/installer-next-candidate-runner.mjs run --phase=report @candidateArgs
node qa-finalizacao/installer-next-candidate-runner.mjs check "--plan=$plan"
```

`context` já passou neste plano, portanto não o repita. Se os harnesses originais mudarem depois desta preparação, a conferência de fontes recusa o plano; prepare um novo com `node qa-finalizacao/installer-next-candidate-runner.mjs prepare`, execute `context` e use os dados retornados.

`distribution` conserva os ensaios originais: duas instalações reais em TEMP com espaços/portas novas, no-shortcuts/no-launch/no-firewall; recusa de destino não vazio; importação opt-in com fixtures e mídia próprias; sanitização de secrets no coletor/ZIP; credenciais distintas; dry-run e apply dos desinstaladores reais, preservando dados/arquivo alterado e removendo somente as entradas HKCU dessas raízes próprias. Não inicia Native/CEF. Resultado dessas operações permanecerá **pendente** até a execução autorizada do novo EXE.

O builder original continua reservado ao coordenador, usando `--zip=... --output=...` explícitos. Este runner não compila nem cria payload/instalador. Os resultados futuros são registrados em nomes novos dentro da raiz própria; podem ser copiados para QA versionada após revisão/allowlist, sem substituir os recibos213415.

## Arquivos de prova e limites

`qa-finalizacao/installer-next-prepared/` contém snapshot do plano, cinco shims exatos e os dois recibos de context. `qa-finalizacao/installer-next-runner-guards.json` contém as cinco recusas. Plano snapshot não é um plano executável naquele diretório; o plano autoritativo permanece na raiz TEMP marcada.

Não comprova novo candidato, Authenticode, Windows limpo, abertura Native/CEF, hardware, update in-place ou WAN. Não cria migração nova nem altera a implementação do instalador. O candidato213415 e seus resultados permanecem congelados.
