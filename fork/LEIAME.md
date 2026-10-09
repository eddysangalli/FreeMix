# Motor nativo do FreeMix

A série de dez patches aplica-se ao OBS Studio 32.2.2, com commit upstream exato e hashes em [manifest.json](manifest.json). Inclui todas as alterações nativas da entrega local 0.1.0-local.20261009144437, inclusive áudio, saídas, preferências e correção de reset RAW.

Para verificar: `node scripts/reconstruir-motor.mjs --check`. Para reconstruir a partir de uma pasta nova: `node scripts/reconstruir-motor.mjs`. Leia [BUILD-FROM-SOURCE.md](../docs/BUILD-FROM-SOURCE.md) antes de compilar.

A série foi aplicada em índice separado sobre a base e a árvore resultante coincidiu com o HEAD nativo local; recibo em docs/evidencias-ultima-rodada/github-patches-verificados.json. O OBS oficial não recebe push destas alterações.
