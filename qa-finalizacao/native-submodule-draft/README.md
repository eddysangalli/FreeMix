# Draft isolado de fontes Native com submódulos

Estado: **11 contratos PASS; revisão e aplicação pelo root pendentes**. Nenhum dos dois scripts do produto foi alterado. Nenhum build Native, instalação, operador ou acesso à rede externa foi iniciado.

O exportador atual grava o gitlink do submódulo como se fosse uma fonte e não inclui o CPP alterado dentro de `plugins/obs-browser`. O reconstrutor atual aplica os patches do pai antes de inicializar submódulos; um gitlink que aponta para um commit local não publicado passa então a exigir um commit que o upstream oficial não possui.

Os drafts adicionam `sourceSchema: 2`, árvore do pai e um manifesto por submódulo com URL upstream, base/head e árvores, patches SHA256, fontes committed SHA256 e objetos de commit textuais SHA256. A reconstrução primeiro inicializa os submódulos da base oficial, depois aplica os patches do pai e do plugin. A árvore aplicada precisa coincidir com a declarada. O objeto de commit original é validado pelo hash Git e restaurado somente no clone novo; isso conserva o SHA exato exigido pelo gitlink sem buscar o commit local no upstream. Não há um segundo `submodule update` depois dos patches do pai.

Arquivos propostos para aplicação posterior:

- `exportar-fontes-native.mjs` → `scripts/distribuicao/exportar-fontes-native.mjs`.
- `reconstruir-motor.mjs` → `FreeMix/scripts/reconstruir-motor.mjs`.

O reconstrutor aceita `--check`, `--dest DIRETORIO_NOVO` e `--dest=DIRETORIO_NOVO`. O destino deve ser explícito e novo. Isso remove o destino implícito anterior; atualizar `docs/BUILD-FROM-SOURCE.md` quando o root integrar. `--check` valida o arquivo local sem iniciar rede. No clone, o ref upstream deve coincidir com a base pinada. Caminhos fora do arquivo, symlinks e destinos existentes são recusados. Um arquivo legado ocupando o caminho de um gitlink em `docs/native-source` requer limpeza explícita pelo root antes da exportação; o draft não o apaga automaticamente.

`test.mjs` cria apenas repositórios próprios em TEMP com protocolo Git `file`. O child HEAD local está ausente do origin. A prova cobre exportação e fontes, verificação offline, reconstrução da árvore/commit exatos, preservação de Native/index/origens, recusa de SHA de patch, árvore declarada e objeto raw adulterados, destino existente e exportação incremental de um segundo commit com prefixo antigo preservado. Os três scripts passaram em `node --check`.

Limites: ensaio de contrato em mini repositórios, não reconstrução real do OBS/CEF nem compilação. Histórias de plugins devem ser lineares; alterações de caminho/URL de submódulo, merges ou remoção de blobs de fonte exigem revisão. Submódulos aninhados são inicializados na base oficial; novos gitlinks aninhados precisam de contrato adicional. O commit child é exato, mas o commit do pai criado por `git am` pode mudar os metadados de committer; a árvore do pai é a prova exata. O root deve congelar primeiro o novo HEAD Native/obs-browser e executar uma reconstrução real isolada antes de empacotar.

A versão `0.1.0-local.20261010004500` continua **TOTAL_REJECTED_RECOVERY**. Seu QR pelo Node instalado passou e foi desinstalado; isso não elimina a falha real de `recovery_backup(includeMedia)` nem a corrida de primeira carga do navegador. Allowlist da prova45: `installer-real-004500-qr-allowlist-20261010.json`, SHA256 `9ca82b31cdcfdac453a3b471b97bab91bf114c391a3f87e3f2636a3077e8f7db`.
