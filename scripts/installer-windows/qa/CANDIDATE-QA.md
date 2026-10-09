# QA do candidato integrado

Executar somente após o coordenador confirmar **candidate ready** e a assinatura do pacote. Não usar staging BUILDING. Estas ferramentas não compilam stub, não criam SFX, não substituem releases, não abrem Native/CEF e não usam instalações do operador.

Entradas obrigatórias para o ensaio completo:

```powershell
$env:FREEMIX_QA_PACKAGE_ROOT = 'CAMINHO ABSOLUTO DO PACOTE COMPLETO VERIFICADO'
$env:FREEMIX_QA_SETUP_EXE = 'CAMINHO ABSOLUTO DO INSTALADOR INTEGRADO SELADO'
$env:FREEMIX_QA_SETUP_SHA256 = 'HASH DO INSTALADOR DO RECIBO candidate-release.json'
node scripts/installer-windows/qa/verify-setup.mjs
node scripts/installer-windows/qa/distribution.mjs
$env:FREEMIX_QA_DISTRIBUTION_RECEIPT = (Resolve-Path 'scripts/installer-windows/build/qa-candidate-distribution.json').Path
node scripts/installer-windows/qa/candidate-credentials.mjs
node scripts/installer-windows/qa/candidate-report.mjs
```

Não há fallback para pacote antigo. `verify-setup.mjs` aceita somente EXE explícito e executa `--verify` em lugar; registra `qa-candidate-setup-verify.json`, sem anexar ZIP/extrair/compilar. `distribution.mjs` exige pacote completo e EXE explícitos: verifica assinatura/hashes do diretório, instala pelo **EXE real** com `--silent --no-shortcuts`, destino TEMP novo com espaços, portas efêmeras distintas e log novo. O recibo JSON deve abrir sem BOM, sem app/firewall/atalhos. A única chave criada pelo instalador é a entrada de desinstalação HKCU da raiz TEMP própria; o ensaio verifica sua remoção ao desinstalar. Não cria autorun ou atalhos globais.

Após instalar, recusa junções e qualquer arquivo com nlink>1 antes de alterar/desinstalar. Confere os hashes assinados de obs-localvocal.dll, advanced-scene-switcher.dll, advanced-scene-switcher-lib.dll e FreeMix.exe; verifica o NDI pinado/licenciado sem carregar o motor e sem variável de ambiente global.

Importação offline opt-in usa exclusivamente módulos da instalação nova e uma pasta UUID.fmx **sintética própria**. A prévia deve identificar mídia presente/ausente, dispositivos/fontes ausentes; apply requer o hash da prévia. Origem, credencial nova e mídia são preservadas; segredos/autostart são removidos. O ZIP de diagnóstico usa fixtures de token/cookie/JWT/SRT/streamkey em logs de inicialização/crash/rede para verificar a sanitização. Esses conteúdos são fixtures; a instalação, componentes, recibos e desinstalador pertencem ao pacote completo real.

O ensaio modifica um arquivo distribuído próprio, cria mídia de usuário e executa dry-run/apply do **desinstalador realmente instalado**, preservando projetos, mídia, configuração e arquivo alterado. Não recria o desinstalador nem ownership com stub local. `uninstall-resume.mjs` só pode retomar um recibo explícito via FREEMIX_QA_DISTRIBUTION_RECEIPT, com marcador de propriedade e sem hardlinks; não faz reparo ou substituição de executável.

Recibos finais distintos: `qa-candidate-setup-verify.json`, `qa-candidate-distribution.json`, `qa-candidate-credentials.json`. O último compara diretamente os dois passwords gerados, sem imprimi-los, e confirma autenticação ativa após importação/desinstalação. `qa-candidate-context.json` cobre somente guards com fixtures próprias. Os harnesses `migration-guards`, `preparation`, `recovery-state`, `startup-api` e `ui-matrix` são fixtures/mocks e seus recibos anteriores não comprovam o candidato integrado. Não executar o `integration-report.mjs` legado para atualizar o relatório congelado da implementação; usar `candidate-report.mjs` nesta rodada.

Limites: sem Authenticode, Windows limpo ou hardware físico comprovado. Nenhum Native/CEF é iniciado aqui; o coordenador fará a abertura completa separadamente.
