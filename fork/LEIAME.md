# Motor nativo do FreeMix

A série de catorze patches aplica-se ao OBS Studio 32.2.2, com commit upstream exato e hashes em [manifest.json](manifest.json). Inclui todas as alterações nativas da entrega local 0.1.0-local.20261009153453, inclusive áudio, saídas, preferências e correção de reset RAW.

Para verificar: `node scripts/reconstruir-motor.mjs --check`. Para reconstruir a partir de uma pasta nova: `node scripts/reconstruir-motor.mjs`. Leia [BUILD-FROM-SOURCE.md](../docs/BUILD-FROM-SOURCE.md) antes de compilar.

A série foi aplicada em índice separado sobre a base e a árvore resultante coincidiu com o HEAD nativo local; recibo em docs/evidencias-ultima-rodada/github-patches-verificados.json. O OBS oficial não recebe push destas alterações.

A série atual inclui também as correções de Fill/Key, o host ASIO multicanal e as quatro saídas HDR por OMT com contrato manual PQ/HLG. As fontes posteriores à entrega 153453 ainda aguardam o novo instalador integrado; não atribuir essas correções ao pacote antigo.
