# Recompilação do LocalVocal corrigido

Pré-requisitos: Windows x64, Git, CMake ≥3.28, compilador Visual Studio compatível com Qt/libobs usados, Cargo/Rust para WebVTT, uma árvore nativa FreeMix já compilada e seus deps Qt/OBS. O build só importa SDKs/bibliotecas; não recompila nem modifica o FreeMix.

Mantenha `build-localvocal.ps1` junto a `freemix-localvocal-shutdown.patch`. A receita exige SourceDir novo e BuildDir próprio, baixa o tag oficial e Corrosion com hashes, extrai sem apagar diretórios existentes, confere/aplica o patch e compila com WebVTT. As demais dependências e hashes estão nos CMake oficiais e no relatório.

```powershell
.\build-localvocal.ps1 -SourceDir C:\build\localvocal-src -BuildDir C:\build\localvocal-out -NativeRoot C:\src\freemix-native -NativeBuildDir C:\src\freemix-native\build -ObsDepsRoot C:\sdk\obs-deps -QtDepsRoot C:\sdk\obs-deps-qt6 -CMake 'C:\tools\cmake\bin\cmake.exe' -Generator 'Visual Studio 17 2022'
```

NativeBuildDir e os dois deps podem ser explícitos; os padrões procuram NativeRoot/build_2026 e os diretórios mais recentes em NativeRoot/.deps. Não depende do caminho de Eddy ou da pasta QA. CMake é sempre explícito; o gerador é configurável. Resultado: BuildDir/RelWithDebInfo/obs-localvocal.dll e PDB, sem cópia/instalação automática. Os hashes finais documentados referem-se ao build executado da QA, sem promessa de reprodutibilidade binária entre toolchains.
