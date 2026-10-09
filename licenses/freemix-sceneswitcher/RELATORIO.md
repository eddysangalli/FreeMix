# SceneSwitcher: parada antes da destruição do frontend

O hang foi observado depois de LocalVocal cancelar corretamente: o log original `../localvocal-shutdown/suite-shutdown-blocked.log` registra limpeza de cenas seguida pelo loop do SceneSwitcher consultando o frontend sem callbacks. O código oficial 1.36.1 somente parava no evento de shutdown quando havia macros específicas de encerramento. O patch chama Stop incondicionalmente, bloqueia Start depois do início do shutdown e torna a rotina idempotente para SCRIPTING_SHUTDOWN e fallback EXIT. Os passos/macros de shutdown existentes continuam preservados. Stop mantém o join e as notificações cooperativas de macros/filas do upstream; não libera objetos ainda em execução.

Fonte oficial GPLv2 tag 1.36.1: https://github.com/WarmUpTill/SceneSwitcher/releases/tag/1.36.1. ZIP codeload SHA256 `c3cb9d64d9bb9a15b0880a8b6e734ee20368f533fb5fb2aeb40b60aa77b66b2b`. Patch de três arquivos: rotina acima, importação de SDKs existentes sem recompilar OBS, e versão CMake 1.36.1 para o ZIP sem .git. Nenhum header/layout/exportação de classe foi alterado. Não foram removidos os subplugins da instalação; recompilam-se somente módulo e biblioteca centrais, preservando os binários oficiais 1.36.1 de subplugins e dependências.

DLLs congeladas e testadas juntas:

- `advanced-scene-switcher.dll`: SHA256 `699b1f15067fd27dd0aca42a5108b4b1be6d1e863085aabec71cbdfaab294cc0`.
- `advanced-scene-switcher-lib.dll`: SHA256 `5b0e93759d1d544d39371ce7bbe3f7e962a39fead1fe1f6b0cb2d3774d91b24f`.
- Patch SHA256 `d690e198d3c4fed165b0100cd939a4a70249837025e403b47d91d12dbdc3dc44`.

Build MSVC19.44 x64/RelWithDebInfo, Qt6.11.1 e libobs do FreeMix, receita com parâmetros explícitos. Fonte ZIP, patch, GPL, PDBs e hashes completos em delivery. A receita não instala nem inicia programas.

## Provas reais em clone TEMP próprio

Mesma DLL LocalVocal final `93d62d37950ad18ca35abcb15ba659235557097e47480be9a9c3b9b38a50c3ab`, perfil/coleção QA vazios, porta websocket efêmera autenticada, mídia sintética portuguesa, pistas/monitoramento desativados. Nenhuma captura física, saída ativa ou comando à mesa do operador. Vendor AdvancedSceneSwitcher Start/Stop/Start e status real conferidos. Os 22 carregamentos referem-se a DLLs de subplugins e dependências, não a 22 funções inteiramente homologadas.

| Recibo | Condição | Resultado |
| --- | --- | --- |
| resultado-suite-final.json | LocalVocal português + automação, DistroAV ainda desabilitado | 6/7 expressões portuguesas; cancelamento real; exit 0 em 802 ms; 22 DLLs, 0 falhas |
| resultado-full-suite-cancel-2.json | suíte instalada preservada + DistroAV 6.2.1/runtime NDI 6.3.2 | Start/Stop/Start PASS; cancelamento real; exit 0 em 876 ms; 22 DLLs, 0 falhas |
| resultado-full-suite-cancel-3.json | repetição completa com mesmo runtime NDI | Start/Stop/Start PASS; cancelamento real; exit 0 em 892 ms; 22 DLLs, 0 falhas |

Nos dois últimos, os logs mostram NDI library initialized 6.3.2.0, features completas registradas e unload normal; nenhuma saída NDI foi iniciada. O worker de automação parou antes de `All scene data cleared`. Nenhum timeout ou encerramento forçado no PASS. Logs e harness em `../localvocal-shutdown/`.

Limites: não houve teste de todos os tipos de macro, queues prolongadas, shutdown com macro bloqueada em sistema externo, hardware/NDI remoto, GPU Whisper, tradução cloud ou endurance. Os testes focam o caminho concreto de hang reproduzido. Não é promessa de ausência universal de crashes.

## Receita executada a partir de fonte nova

`resultado-portable-recipe.json` e `portable-build.log` confirmam a segunda compilação integral em SourceDir/BuildDir novos: SHA da fonte verificado, mesmo patch conferido/aplicado, módulo e biblioteca centrais linkados com exit 0. Caminhos CMake normalizados, imports SDK explícitos, sem dependência do caminho de Eddy. Esse build tem hashes próprios e não substitui as DLLs congeladas/testadas. Não se afirma reprodutibilidade binária entre caminhos/toolchains.
