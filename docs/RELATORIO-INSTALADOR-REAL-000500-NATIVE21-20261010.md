# Instalador000500 / Native21 — QA real

Resultado PASS de `verify → distribution → credentials → report → check` para `0.1.0-local.20261010000500`. A seleção de entrega permanece sob revisão do coordenador; esta frente não iniciou Native/CEF nem promoveu ou publicou o pacote.

## Identidade

| Artefato verificado | SHA256 |
|---|---|
| Setup real | `cd7529d9d9ebf2806b40252691d73c7f28d5dcf49aeeddcbf85ea2cd5c624798` |
| Manifesto do pacote | `6fbf37845536e8b3a6478ec15274f5ce9f7bf14051e10703f2c197550f417619` |
| FreeMix.exe instalado, sem execução | `53d10913ee0e14aa8c5d58a9bd35cf0af72a9072a3214f92444e688cda983e27` |

Plano marcado próprio: `FreeMix-QA-CandidateNext-TjY7cm/plan.json`, com context anterior PASS não repetido. Duas instalações em TEMP `FreeMix-QA-Distribution-AZD28q`, nos caminhos `Installed Studio with spaces` e `Opt-in Studio with spaces`, com portas independentes. Setup em modo silencioso, sem atalhos, lançamento ou aplicação de firewall. A mesa, as instâncias do operador e os pacotes233334/213415 não foram alterados.

## Resultados

Verificação real do EXE: 38,0 segundos PASS, sem instalar. Distribuição integrada: 409,6 segundos, 15 checks PASS. Conferência de 9574 arquivos na primeira instalação, sem hardlinks ou junções; Native, LocalVocal, Scene Switcher e NDI correspondentes ao manifesto, sem carregar o motor.

As duas instalações geraram credenciais WebSocket autenticadas e diferentes, preservadas durante importação/desinstalação, com portas separadas. Destino não vazio foi recusado e preservado. A importação opt-in de fixtures próprias identificou mídia empacotada/ausente e dispositivos/fontes ausentes; a confirmação por hash da prévia rejeitou importação desatualizada. UUIDs e mídia foram preservados e secrets/autostart removidos, sem modificar o projeto de origem. Lock de abertura foi testado sem iniciar serviço.

O DiagnosticCollector do módulo realmente instalado e a CLI do Node empacotado realmente instalado produziram ZIPs de diagnóstico. Ambos removeram fixtures sintéticas de token/cookie/SRT/stream key/JWT e os valores `code/state` de um callback HTTP relativo. Ambos preservaram o valor de `state` comum em um registro JSON de produto. Os dois novos checks OAuth passaram; os valores de fixtures não foram registrados nos recibos nem copiados para a allowlist. Esses checks usam o módulo do pacote instalado, sem substituir pelo redator da árvore fonte.

Os ZIPs continham resumo de crash/inicialização/rede/dependências; os ZIPs e logs brutos ficaram somente na raiz temporária, fora da evidência promovida. O diagnóstico utiliza dados sintéticos próprios; a prova é de sanitização dos formatos exercitados, não garantia contra qualquer formato arbitrário de dado privado.

Ambos os desinstaladores reais removeram somente as entradas HKCU das próprias instalações. O dry-run preservou todos os arquivos; o apply conservador da primeira instalação removeu 9433 arquivos imutáveis correspondentes, preservou um arquivo de produto alterado pelo fixture, os projetos/configuração/mídia e o arquivo de usuário sintético. Credenciais, relatório agregado e check final passaram.

## Preservação e evidência

Os 26 JSON/logs/PNG de baseline213415 em `scripts/installer-windows/build` e suas cópias preservadas permaneceram iguais por SHA256 antes/depois de todas as fases. Os 13 arquivos da allowlist real233334 também foram conferidos e permaneceram intactos. Não houve repetição ou substituição de recibo antigo.

`qa-finalizacao/installer-real-000500-native21-final/` contém dez JSONs sanitizados e `evidence-copy.json`, com hashes dos originais/cópias, identidade, os 26 baselines e a verificação da allowlist233334. Não contém logs/crash/ZIP brutos, local.js/configs, credenciais ou capturas da mesa. `qa-finalizacao/export-installer-native21-receipts.mjs` é próprio desta rodada e não altera o exportador233334 congelado.

Allowlist congelada: `qa-finalizacao/installer-real-000500-native21-allowlist-20261010.json`. O harness de distribuição permaneceu com o hash congelado `0de72ef3a38d3029e45472b16c672348639b602b2c23a1b591c68c92ee89ede3`; nenhuma fonte do plano ou do produto foi modificada durante a execução.

## Limites

Não comprova Authenticode, Windows limpo, update in-place, abertura Native/CEF, reprodução/saída física, hardware ou WAN. A prova de startup é separada e pertence ao coordenador. Nenhum motor ou mesa foi aberto por esta frente, nenhum processo/registro do operador foi alterado e nada foi publicado.
