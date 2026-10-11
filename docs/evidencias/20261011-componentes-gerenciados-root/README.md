# Componentes internos gerenciados — 11/10

Pedido direto do dono: compilar os componentes no FreeMix e bloquear atualizações independentes do OBS/plugins. Em seguida autorizou o Root a implementar diretamente, sem depender de delegação.

## Resultado qualificado em software

- OBS: `IsUpdaterDisabled()` já retorna `true`; checagem manual, periódica e reparo upstream são governados pelo fork.
- Catálogo de destinos RTMP: o novo Native39 força `ENABLE_SERVICE_UPDATES=OFF`, inclusive sobre cache/flag de configuração em ON. Continua disponível o catálogo incluído na entrega.
- DistroAV 6.2.1: entrada de atualização retorna `false`; startup não a chama. Controles de checagem/instalação/download independentes ficam desabilitados, sem handlers de instaladores. NDI seleciona apenas a biblioteca aprovada em `runtime/ndi-v6`, com tamanho/SHA e recusa de links/junções/hardlinks. Variáveis de ambiente não selecionam uma instalação externa. Falha orienta reparar o FreeMix.
- SceneSwitcher 1.36.1: identificação estável da compilação FreeMix, sem `GITDIR-NOTFOUND`/`HEAD-HASH-NOTFOUND`. Migração grava automaticamente uma cópia imutável/atômica do JSON original antes de carregar as configurações. Não confundir esse antigo aviso de backup com um downloader. Falha de backup continua visível; não é escondida como sucesso.
- Diagnóstico do cliente: `Verificar Complementos` confere apenas arquivos locais; não consulta releases no GitHub nem anuncia atualizações de plugins avulsos. O canal de atualização do FreeMix continua separado.

## Provas

[Recibo público](PUBLIC-RECEIPT.json): duas aberturas e dois fechamentos cooperativos no Native39, automação Start/Stop real, fonte NDI registrada com ambiente externo inválido, backup anterior exato e não regravado após reiniciar, versão de migração salva, zero alocações residuais registradas nos dois logs e 2085 arquivos Native conferidos após fechar. Ambos PIDs de QA foram confirmados ausentes pelo CIM.

[Backup: 14 casos C++/Qt reais](backup-14-tests.txt); [NDI: 8 casos C++/Qt reais](ndi-pinning-8-tests.txt), incluindo conteúdo alterado, ausência, ambiente externo, junção e hardlink; [diagnóstico: 7 execuções reais](diagnostic-7-tests.json), com zero chamadas a `fetch`, alteração/ausência de arquivo, hash ausente, caminho inválido e proibição de redefinir hashes.

ALL_BUILD do Native39 e exportação/reconstrução local dos 39 patches, três submódulos e snapshots passaram. Dois componentes foram compilados usando imports/Qt já existentes; não foram obtidos SDKs nem aceitas licenças novas. A receita offline foi executada também a partir dos arquivos ZIP oficiais e dos patches distribuídos. Fontes modificadas reconstruídas conferem seus hashes de texto normalizado. Não se afirma identidade binária entre diretórios/toolchains diferentes.

## Distribuição e limites

Os componentes permanecem bibliotecas internas: compilá-los sob controle do FreeMix não exige juntar todas as funções num único executável. Os subplugins oficiais do SceneSwitcher foram preservados; não afirmar que cada DLL de terceiros foi reescrita ou totalmente homologada.

Fontes/patches/licenças: `licenses/freemix-sceneswitcher-managed`, `licenses/freemix-distroav-managed`; receita: `scripts/build/compilar-componentes-gerenciados.ps1`. Os hashes em `componentes.json` apontam para os novos componentes qualificados destinados à próxima entrega, não para a mesa antiga. Artefatos locais aprovados para empacotamento: `D:/FreeMix-QA-PluginGovernance-20261011-2305/delivery-inputs/APPROVED-INPUTS.json` e freeze `qa-finalizacao/native-build-frozen-7b77e32-configured.json` no workspace pai.

Nenhuma DLL/configuração/processo do operador foi substituído; nenhuma atualização foi armada. Ainda não há um novo instalador completo selado com estes bytes. Estes testes não provam streaming sob carga, áudio real, câmera física, WAN, codecs ou todos os comportamentos de SDKs fechados. Macros explicitamente configuradas para executar programas não são o updater automático de um plugin.

O primeiro QA falhou por fixture do teste no campo incorreto da coleção, não por uma atualização executada. O Native fechou cooperativamente, zero leaks; original preservado no workspace próprio. R2 corrigiu o campo `modules` e passou em Native38. R3 passou no Native39 com a seleção NDI governada. Logs completos permanecem locais, fora desta evidência pública.
