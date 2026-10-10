# Guardas de plugins e SDK NVIDIA — draft isolado

Status: pronto para revisão de fonte. Nenhum arquivo canônico, pacote, SDK licenciado ou processo foi alterado. Nenhuma compilação Native, DLL/driver, GPU/áudio ou carregamento de fonte foi executado. Os 22 casos são contratos de fonte e modelos VM com corpos reais traduzidos; não homologam o executável nem Win32/BCrypt.

## Mudança finita

Cinco alvos modificados em cópias: `frontend/widgets/OBSBasic.cpp`, `plugins/nv-filters/{nv-filters.c,nvafx-load.h,nvvfx-load.h,CMakeLists.txt}`. Dois arquivos novos: `plugins/nv-filters/FreeMixNvSdkPolicy.{c,h}`. `PREP.json` contém SHA de cada base/draft/patch. O preparador só escreve nesta pasta própria.

`AddExtraModulePaths` passa a registrar uma mensagem pública e não adiciona caminhos do ambiente, usuário ou instalação global. Isso impede a injeção por `OBS_PLUGINS_PATH`/`OBS_PLUGINS_DATA_PATH` nessa entrada do frontend, inclusive antes do antigo retorno portable. As buscas padrão dos módulos empacotados de libobs ficam intactas. Este patch não implementa aprovação de toda DLL por assinatura dentro do loader libobs e não impede uma alteração posterior dos próprios binários do pacote.

No módulo NVIDIA, a decisão de aprovação vem antes dos carregadores/version probes. Nos carregadores AFX/VFX, o guard continua obrigatório antes de `LoadLibraryExW`: compara caminho fixado, rejeita arquivo reparse/diretório, obtém o caminho final, calcula SHA256 BCrypt e mantém handle sem compartilhamento de escrita/exclusão até terminar os loads. VFX verifica os dois arquivos principais antes de carregar qualquer um. Falha no segundo libera o primeiro handle sem carregar o SDK. Flags de resolução de dependências do loader original e descarregadores originais ficam preservados.

As duas famílias ficam **approved=false e complete_payload_approved=false**, sem caminho aprovado. Os três fingerprints são observações do draft de qualidade existente, não decisão de aprovação nem nova inspeção do SDK nesta rodada. Não há bypass por versão do arquivo, variável de ambiente ou preferência do operador. Isso desativa o registro direto dos filtros NVIDIA enquanto não houver aprovação FreeMix: evita que uma criação direta de filtro OBS contorne apenas a guarda JavaScript. O motor e os outros filtros não mudam.

## Expor o motivo sem carregamento ou segredo

O módulo exporta três funções somente leitura: `freemix_nvidia_policy_contract_version()` retorna 1; `freemix_nvidia_policy_approved("afx"|"vfx")` informa a decisão de release; `freemix_nvidia_policy_reason("afx"|"vfx")` retorna texto estático público, com reason code atômico. Não retornam caminhos, hashes privados, URLs ou credenciais. Approval não significa dispositivo disponível nem mídia homologada.

Binding UI/backend ainda é proposta Root-owned em `READ-ONLY-STATUS.md`: consulta apenas módulo já carregado, mantendo referência durante leitura/cópia, valida exports/versão e devolve unknown quando ausente. Não registrar callback global persistente sem remoção de lifecycle, não usar ponteiro de `GetModuleHandle` sem pin e não usar `LoadLibrary` para descobrir status. Nenhuma nova rota foi aplicada.

## Limites concretos

- O teste traduz tipos/constantes/Win32 stubs e executa as decisões/ordem dos próprios loaders; o hash/path IO Win32 e BCrypt são verificados em fonte, não executados. O primeiro FAIL de harness por constante MAX_PATH ausente foi preservado em `MODEL-FIRST-FAIL.json`; correção ocorreu apenas no stub.
- Dependências transitivas/modelos, licença de redistribuição, hardlinks/corridas em diretórios ancestrais, módulos previamente carregados e comportamento real do loader precisam de qualificação separada. Os flags DEFAULT_DIRS originais ainda resolvem dependências. Por isso **complete_payload_approved=false**; não habilitar apenas trocando approved.
- O guard não governa NDI_RUNTIME_DIR_V6, drivers NVENC/CUDA/Desktop Video/CoreAudio/VLC ou VST escolhido pelo operador; nem bloqueia macros importadas que executam processos. O inventário suplementar mantém essas pendências distintas.
- Política compilada só pode mudar numa release aprovada após revisão de origem/hash do conjunto completo e licença. Não redistribuímos SDKs nem fazemos download/install, winget ou atualização automática neste draft.
- A ligação de `bcrypt` é apenas receita CMake offside. Compilação completa e QA real ficam com Root, depois de revisar e integrar os sete alvos.

## Verificação

Node instalado do candidato 600: `runtime/node.exe` SHA ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32. `test.mjs` verifica 22 casos, as cinco bases canônicas intactas e bytes draft. `freeze.py` verifica AST/sintaxe, aplica cinco diffs em memória às bases e compara com drafts, e sela allowlist finita. Não executar novamente o preparador após Root integrar bases novas sem uma nova revisão/versionamento.
