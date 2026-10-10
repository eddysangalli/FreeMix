# Fontes do FreeMix

O instalador selecionado600 corresponde ao Native24/a047860 e ao payload Git6adcd193. Consulte [entrega atual](docs/ENTREGA-ATUAL.md).

As fontes Native posteriores deste checkout correspondem a **de136e83595be92162ada8c7adc50f52751bd4ef**, árvore **4ad626ccd13cba0d7f13f3ca0fa670bada8425be**,25 patches sobre a base OBS32.2.2 pinada. A compilação completa passou e o runtime de2085 arquivos foi congelado. FTBv2, captura contínua das Calls e observação Qt ainda aguardam QA real e integração do controle; não pertencem ao instalador600. A versão700 no manifesto de fontes identifica desenvolvimento, sem novo pacote selecionado.

[fork/manifest.json](fork/manifest.json) e [source-verification.json](fork/source-verification.json) registram a reconstrução da árvore em índice próprio, três submódulos e os snapshots em docs/native-source. Leia [BUILD-FROM-SOURCE.md](docs/BUILD-FROM-SOURCE.md).

Créditos/licenças upstream e runtimes permanecem em licenses. NDI HDR exige Advanced SDK/licença e implementação. A chave Ed25519 privada permanece fora do Git e do pacote.

Histórico completo anterior: [proveniência preservada](docs/historico/20261010-preNative25/FONTES.md).
