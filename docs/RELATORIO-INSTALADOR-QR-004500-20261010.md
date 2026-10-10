# 04500: distribuição e QR instalado; candidato rejeitado

O candidato `0.1.0-local.20261010004500` permanece **REJEITADO POR RECUPERAÇÃO**. A prova limitada desta frente passou em instalação/distribuição/credenciais/desinstalação e contrato QR no Node instalado. Esses resultados não aprovam o candidato como um todo.

## Identidade e isolamento

Setup SHA256 `fa291358e2d629a91cf287ac5b3a1c98d7c7d8e738a00c866268ddafcb3de7bd`; manifesto `91b399bd2323fdc529181cd731488734beb22bc9901dc4bd4540dcae832dddba`; FreeMix.exe instalado, sem execução por esta frente, `53d10913ee0e14aa8c5d58a9bd35cf0af72a9072a3214f92444e688cda983e27` (Native21).

Plano `FreeMix-QA-CandidateNext-8Lbb8x`, context anterior não repetido. Todas as instalações usaram raízes TEMP marcadas, portas independentes, sem atalhos, lançamento ou aplicação de firewall. Não houve Native/CEF/mesa/Git/publicação nesta frente; os módulos QR foram importados exclusivamente da instalação, não das três fontes que já avançaram para ticker.

## Distribuição real

`verify → distribution → credentials → report → check`: todos PASS. Verificação do EXE em 35,2 segundos; distribuição em 383,1 segundos, com 15 checks e duas instalações próprias em `FreeMix-QA-Distribution-h28Nv0`. Primeira instalação: 9576 arquivos independentes, sem hardlinks/junções. Componentes e credenciais correspondem ao manifesto e são independentes entre instalações.

Importação opt-in de projeto sintético preservou UUID/mídia, identificou dependências ausentes, confirmou a prévia por hash e removeu secrets/autostart. Os dois ZIPs do DiagnosticCollector/CLI realmente instalados removeram fixtures de token/cookie/SRT/key/JWT e OAuth relativo `code/state`, mantendo estado comum de produto. Dry-run e desinstaladores reais passaram; 9435 arquivos imutáveis correspondentes removidos, um arquivo modificado e projeto/configuração/mídia preservados; entradas HKCU próprias removidas.

Os 26 baselines213415 e os metadados233334/000500 foram preservados por hash. Nenhum recibo anterior foi substituído.

## Contrato QR instalado e retry de harness

A instalação exclusiva `FreeMix-QA-QrInstalled-TvrsGe` conferiu os seis módulos instalados contra a freeze QR `957910e4ce8d25dd5e45174d1b3a41f7d109371242c7cfb2ae93c43dbe6afc65` e o manifesto assinado. O contrato falhou em uma assertiva QA incorreta que classificava URLs em comentários/licenças como pedidos de rede. O FAIL e seu script original foram preservados, e o uninstaller/HKCU próprios foram limpos.

Foi corrigida somente a assertiva QA: o runtime deve ser exatamente o empacotado, sem dependência externa, e a execução usa APIs de rede bloqueadas/contadas. O retry `FreeMix-QA-QrInstalled-UjB5pf` passou com Node instalado v24.21.0: 30 checks de parser, encoder, render, converter e GC. Nenhuma das cinco fases anteriores foi repetida e o produto não foi alterado.

Cobertura: equivalência QR direto/Layer.Composition; UTF-8 São Paulo e limite de 512 bytes; rejeição de vazio/controle/surrogates/dimensões/opções fora do contrato; mínimo de pixels por módulo; GTZIP próprio com `document.xml` e CRC, sem JSZip/node_modules/rede; prévia sem escrita/hash de confirmação; conversão com manifest/QR editável; hashes de todos os arquivos gerados; `gt-qr.js` offline e `QR-LICENSE.txt` exato, com os avisos MIT. SHA da licença gerada: `8ed754b590178224fd5a4a7f6363f98893588c398745564de0aad37a2c247507`.

O runtime SVG real instalado foi executado com um adaptador DOM finito no Node: ECC M/quiet-zone4, atualização inválida limpa o QR anterior e atualização válida recupera. GC instalado salvou campos válidos, recusou edição inválida sem alterar memória/disco e recusou prepare inválido antes de qualquer requisição Native. Contadores de APIs de rede e requisições Native: zero. Ambas as instalações exclusivas QR foram desinstaladas, com registro próprio removido.

Isso não é prova de CEF, decodificação independente, activation race, escaneabilidade após transformações ou GTZIP universal. A prova de CEF pertence ao coordenador e permanece separada.

## Falha total autoritativa

O coordenador confirmou que `recovery_backup` com `includeMedia` falha porque o scanner trata `require('./utils')` interno do bundle QR como dependência externa. A aprovação de distribuição/contrato Node não cobre esse scanner. Candidato não selecionado nem publicado. Somente referências por caminho/hash, sem duplicar provas de outra frente:

- `qa-finalizacao/package-native-startup-045000-qr-fail-allowlist.json`: `44c1bab3a09727b47e3dbd27b5a84a535200d8925442d8218e560611911973df`.
- `qa-finalizacao/native21-qr045000-retry3/failure-report.json`: `3bfd525d243b14791f6afafe72fbbbdfc952714b0cda27986e7a4e53a0eed3f1`.
- `qa-finalizacao/package-native-startup-045000-qr-retry3.json`: `35aef03628139df50cb988cb7b9d0fa50e540aaa1a9baedbcb3eb26a03cef382`.

## Entrega de evidência

Recibos sanitizados em `qa-finalizacao/installer-real-004500-qr-final/`: dez JSONs de fases, metadata/candidate-total-status, FAIL de harness preservado, retry/contrato PASS e hashes de proveniência. Logs/crash/ZIP brutos, configs/local.js e credenciais foram excluídos. Allowlist congelada `qa-finalizacao/installer-real-004500-qr-allowlist-20261010.json`.

Limites adicionais: não cobre Authenticode, Windows limpo, atualização in-place, hardware ou WAN. A correção do scanner e o ajuste de primeiro carregamento Native pertencem a versões posteriores explicitamente autorizadas; nenhum ensaio dessas versões foi inferido ou iniciado por esta rodada.
