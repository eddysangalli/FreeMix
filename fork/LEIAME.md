# Motor nativo do FreeMix

A série atual tem26 patches sobre o OBS Studio32.2.2, base e hashes exatos em [manifest.json](manifest.json). HEAD de desenvolvimento:31a2139d084f8b9d014481d477e109d8827e0bcc; árvore verificada:a1b39773946828f3d3953f13178e69a9aaa4f0f1.

No repositório FreeMix, confira com `node scripts/reconstruir-motor.mjs --check`. Para reconstruir, forneça uma pasta nova: `node scripts/reconstruir-motor.mjs --dest=C:/caminho/novo/FreeMix-native`. Esse segundo comando obtém bases oficiais; o export local já verificou a árvore usando índice próprio, sem rede. Leia [BUILD-FROM-SOURCE.md](../docs/BUILD-FROM-SOURCE.md).

Build Native26 completa passou. Gate final Master/saídas Programme exige prova GPU/recepção; defaultOFF/áudio audível. Vídeo contínuo Native25 passou20s em IAB/CEF, sem PCM/AV/VDO; controle Calls integrado, opt-inOFF. HTTP/editor e diagnóstico da segunda fonte estão em QA própria. O instalador selecionado continua600/Native24. Não atribuir essas correções às entregas antigas.

Histórico anterior: [registro preservado](../docs/historico/20261010-preNative25/FORK-LEIAME.md).
