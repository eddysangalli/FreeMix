# Motor nativo do FreeMix

A série atual tem25 patches sobre o OBS Studio32.2.2, base e hashes exatos em [manifest.json](manifest.json). HEAD de desenvolvimento:de136e83595be92162ada8c7adc50f52751bd4ef; árvore verificada:4ad626ccd13cba0d7f13f3ca0fa670bada8425be.

No repositório FreeMix, confira com `node scripts/reconstruir-motor.mjs --check`. Para reconstruir, forneça uma pasta nova: `node scripts/reconstruir-motor.mjs --dest=C:/caminho/novo/FreeMix-native`. Esse segundo comando obtém bases oficiais; o export local já verificou a árvore usando índice próprio, sem rede. Leia [BUILD-FROM-SOURCE.md](../docs/BUILD-FROM-SOURCE.md).

Build completa passou; QA real e integração do controle da nova versão estão pendentes. O instalador selecionado continua600/Native24. Não atribuir FTBv2 ou retorno contínuo às entregas antigas.

Histórico anterior: [registro preservado](../docs/historico/20261010-preNative25/FORK-LEIAME.md).
