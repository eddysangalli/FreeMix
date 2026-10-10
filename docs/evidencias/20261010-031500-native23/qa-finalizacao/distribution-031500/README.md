# QA de distribuição 031500

Esta pasta usa somente o payload selado `0.1.0-local.20261010031500`, Native22 `500ced5ea0928453f9f27dc7d5649531e2671e28`. O candidato original, o apontador da entrega e todos os recibos anteriores permanecem intactos.

`preparation.json` fixa hashes do candidato, manifesto, ferramentas, apontador e prova composta CEF. `installer/` contém cópias byte a byte das três fontes do instalador, para gerar compilados/PayloadInfo exclusivamente nesta pasta. Nenhuma fonte de produto futura entra no ZIP.

O ZIP é produzido pelo `scripts/distribuicao/zip-pacote-verificado.py` existente com entrada `full-payload-verificado-031500.json`: inventário exato, assinatura previamente verificada, CRC e SHA-256 de cada entrada são conferidos. O Setup é gerado com caminhos ZIP/saída explícitos e nunca sobrescreve uma entrega existente. EXE sem Authenticode; payload interno assinado Ed25519.

`prepare-qa.mjs` deriva uma cópia do runner anterior com contagens de substituições verificadas. Só muda localização do runner e importação de ferramentas: inspectPortable/redator vêm do pacote selado. A lógica original de instalação, importação, diagnóstico e desinstalação permanece idêntica. O runner cria shims/recibos novos em TEMP próprio, preserva os 26 artefatos anteriores e verifica que seus hashes continuam iguais após cada fase.

Plano desta rodada: `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-CandidateNext-k3gZkn/plan.json`. Fases: context, verify, distribution, credentials e report. Distribuição instala pelo EXE real duas raízes novas com espaços, portas efêmeras e `--no-shortcuts`, sem abrir o motor, aplicar firewall ou criar autorun. Testa importação opt-in de projeto sintético próprio, hash da prévia, mídia presente/ausente, credenciais independentes, sanitização incluindo OAuth/SRT/cookies/streamkeys/JWT, entrypoint instalado de COLETAR-LOGS, e desinstalação conservadora. Só as entradas HKCU uninstall das próprias raízes são criadas e removidas.

Startup/QR/ticker/recuperação pela API/CEF real usam a prova composta já congelada em `package-native-startup-031500-composite.json`, do mesmo manifesto/pins. É uma validação composta de execuções preservadas: os quatro recibos FAIL continuam FAIL e não se declara uma única execução ininterrupta PASS. O harness de distribuição não inicia Native nem CEF e não substitui essa evidência.

`freeze.mjs` só congela após todas as cinco fases PASS, hashes dos guards intactos, ZIP/Setup coerentes e registro removido de ambas as instalações. Copia provas e shims para esta pasta sem sobrescrever arquivos e emite `report.json`/`ALLOWLIST.json`. Estes arquivos documentam um candidato revisável; selecionar/publicar/alterar INSTALADOR-ATUAL cabe ao coordenador.

Limites: Windows limpo, hardware físico e WAN não homologados; nenhum ativo de referência/licenciado foi adicionado; nenhuma instalação ou processo do operador foi utilizado.
