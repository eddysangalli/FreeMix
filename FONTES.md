# Fontes do FreeMix

A entrega selecionada é600/Native24. O candidato093000/Native27 passou instalação, dois fechamentos, migração e diagnóstico, mas falhou na verificação da desinstalação em caminhos longos; não foi promovido. Consulte [entrega atual](docs/ENTREGA-ATUAL.md).

Este checkout corresponde ao Native28 **a09423dae10dbeed6d7f18b30a6cc22b78c49731**, árvore **3e2898994e62ad53624fd70e09fc40f8a9123d57**,28 patches/3 submódulos sobre a base OBS32.2.2 pinada. A compilação completa passou e 2085 arquivos foram congelados. Versão de fontes 0.1.0-local.20261010103000 é desenvolvimento; nenhum instalador novo foi selecionado. [Prova de compilação](docs/evidencias/20261010-native28-build/README.md).

Native27 provou cores RGBA e vídeo local limitado em IAB/CEF. Native28 acrescenta contrato linear-sRGBSDR8 para o gate final e proteção de epoch/cópiaPCM. Provas GPU/áudio/AV/VDO/WAN e lifecycleMeter continuam pendentes; gate/contínuo permanecemOFF. [Pendências reais](docs/PENDENCIAS-REAIS.md).

[Manifesto](fork/manifest.json), [verificação](fork/source-verification.json) e snapshotsdocs/native-source permitem reconstrução local. [Build](docs/BUILD-FROM-SOURCE.md). Créditos e licenças upstream permanecem; chave privada Ed25519 está fora do Git/pacote. [Histórico](docs/historico/20261010-preNative25/FONTES.md).
