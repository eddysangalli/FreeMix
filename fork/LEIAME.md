# Motor nativo do FreeMix

A série atual tem27 patches sobre o OBS Studio32.2.2, base e hashes exatos em [manifest.json](manifest.json). HEAD de desenvolvimento:c4b5af00ea4a4b744a3a19fef5ec861f693c9a69; árvore verificada:ee8a93355681dd637f8bb8d74306e58704ea005b.

No repositório FreeMix, confira com `node scripts/reconstruir-motor.mjs --check`. Para reconstruir, forneça uma pasta nova: `node scripts/reconstruir-motor.mjs --dest=C:/caminho/novo/FreeMix-native`. Esse segundo comando obtém bases oficiais; o export local já verificou a árvore usando índice próprio, sem rede. Leia [BUILD-FROM-SOURCE.md](../docs/BUILD-FROM-SOURCE.md).

Build Native27 completa passou. Gate final Master/saídas Programme exige prova GPU/recepção; defaultOFF/áudio audível. Vídeo contínuo Native25 passou20s em IAB/CEF, sem PCM/AV/VDO; controle Calls integrado, opt-inOFF. HTTP/editor passou em QA própria; diagnóstico Native27 de duas fontes passou com RGBA exato, aguardando confirmação de cor no CEF. O instalador selecionado continua600/Native24. Não atribuir essas correções às entregas antigas.

Histórico anterior: [registro preservado](../docs/historico/20261010-preNative25/FORK-LEIAME.md).
