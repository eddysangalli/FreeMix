# Recompilação do SceneSwitcher

Windows x64, Git, CMake e MSVC compatíveis com os imports Qt/libobs de uma árvore FreeMix já compilada. Mantenha o script junto ao patch. Todos os caminhos são parâmetros; a receita verifica o SHA256 do tag oficial, aplica o patch a uma fonte nova e compila sem tocar na instalação do operador.

```powershell
.\build-sceneswitcher.ps1 -SourceDir C:\build\ss-src -BuildDir C:\build\ss-out -NativeRoot C:\src\freemix-native -NativeBuildDir C:\src\freemix-native\build -ObsDepsRoot C:\sdk\obs-deps -QtDepsRoot C:\sdk\obs-deps-qt6 -CMake 'C:\tools\cmake\bin\cmake.exe'
```

Resultado: duas DLLs e seus PDBs em BuildDir/RelWithDebInfo. Substitua juntas `advanced-scene-switcher.dll` e `advanced-scene-switcher-lib.dll`, preservando a pasta original de subplugins 1.36.1, os recursos e suas licenças. As opções de build OFF somente evitam recompilar esses subplugins; eles permanecem disponíveis no produto. O patch não altera headers nem layouts/exportações de classes. Não mistura versões de subplugins. O manifest identifica o binário exato usado nos testes; builds em outros caminhos/toolchains podem ter hashes diferentes.
