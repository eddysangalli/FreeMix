# Fontes e reconstrução

O motor ativo é o fork C++ do OBS Studio 32.2.2. As pastas `src/` e `plugins/obs-freemix/` contêm protótipos anteriores; não são o motor da entrega atual.

`fork/manifest.json` fixa o commit upstream completo e a ordem/hash de todos os patches da versão indicada. A série contém toda a mudança nativa, inclusive as fontes e headers novos que estavam fora de commits anteriores. `docs/native-source/` é uma cópia de consulta das fontes modificadas; a série em `fork/` é a referência para reconstruir a árvore.

Com Git e Node.js 20+:

```text
npm ci
node scripts/reconstruir-motor.mjs --check
node scripts/reconstruir-motor.mjs
```

O segundo comando confere hashes sem rede. O terceiro clona a base oficial para uma pasta nova `native/obs-studio`, aplica a série e busca submódulos. Recusa sobrescrever destino existente. O Git precisa de nome/e-mail configurados para aplicar os commits. Também é possível usar `--dest PASTA_NOVA`.

Compile no diretório do motor com o preset Windows x64 do OBS e as dependências de desenvolvimento correspondentes. A build local entregue usou Visual Studio 2026, desktop C++, ATL e `RelWithDebInfo`:

```text
cmake --preset windows-x64 -B build_2026
cmake --build build_2026 --config RelWithDebInfo
```

O executável e plugins OBS saem em `build_2026/rundir/RelWithDebInfo`. Versão de CMake, Visual Studio, Qt/CEF e demais dependências precisam satisfazer os presets da base fixada. `scripts/build/compilar-2026.ps1` preserva a receita do ambiente de desenvolvimento original; seus caminhos pressupõem a organização original da máquina e não são um instalador universal.

Os módulos JavaScript do produto ficam em `ferramentas/`, as telas em `painel/` e o kit Linux em `servidor/`. `package-lock.json` fixa as dependências npm. O portátil exige também runtime, binários e plugins descritos em `componentes.json`; um clone do Git, sozinho, não é uma instalação executável.

As fontes locais modificadas de Source Record estão em `licenses/freemix-source-record/`, com receita de build e fonte original. Licenças e proveniência dos demais plugins ficam em `licenses/` e `docs/provenance/`. O archive de fontes Advanced Scene Switcher tem cerca de 481 MB e não entra no Git: URL/proveniência e hash estão registrados, e o archive acompanha o ZIP completo selado.

As chaves privadas de assinatura, credenciais, dados do operador, node_modules, DLLs/executáveis, builds e ZIPs de distribuição ficam fora do Git. Os hashes dos ZIPs locais estão em `docs/releases/`.

Verificação desta sincronização: a série foi aplicada em índice isolado sobre a base fixada, e a árvore resultante comparada à árvore do motor local. Isso comprova completude dos patches; não equivale a uma nova compilação num Windows limpo. As provas de execução correspondem aos builds identificados nos relatórios.

A sincronização de uma árvore Native local commitada usa scripts/distribuicao/exportar-fontes-native.mjs com --native=REPO_NATIVE --product=REPO_PRODUTO --head=COMMIT_COMPLETO --version=VERSAO. O exportador preserva patches existentes, verifica a árvore completa em índice TEMP separado e copia somente blobs commitados; fork/source-verification.json identifica os hashes das fontes. Não gera binários nem marca uma release homologada.
