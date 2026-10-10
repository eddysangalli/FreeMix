# Recuperação offline QR — fonte congelada

Status: **PASS de 33 verificações locais** (29 na primeira execução e 4 negativas adicionais). Sintaxe do único módulo de produto alterado também passou. Não houve Native, API instalada, saída, alteração de operador, Git ou pacote selado nesta QA.

Produto: `obs-vmix/ferramentas/recuperacao-dependencias.mjs`, SHA256 `1d40b99de88332e05dd20cba714bd1e158c3013f3bbc91db78a234c1452a42bf`.
Baseline preservado byte a byte em `before.mjs`, SHA256 `b2aed33999c71ada90d4e16ff668f2ed99e0edbe793300ff232e2c80cd28a6b5`, obtido da cópia FreeMix não alterada. Seu scanner reproduziu a falha de `require('./utils')`, registrada separadamente em `baseline-fail.json`.

O scanner reconhece exclusivamente `gt-qr.js` cujo conteúdo e tamanho correspondem ao runtime gerado pelo helper confiável instalado. Exige manifesto GTZIP formato 2, campo QRCode, exatamente um registro do encoder e da licença MIT com SHA/tamanho esperados, arquivo e licença íntegros, sem links. Só esse encoder verificado deixa de ter os requires internos Browserify tratados como caminhos externos. Scripts arbitrários, nomes diferentes, manifesto ausente e mesmo nome sem contrato continuam a análise normal. Um título reconhecido com registro, encoder ou licença adulterados é recusado.

Os helpers QR foram apenas importados e lidos; não alterados. Não existem novas dependências externas: ambos os módulos já fazem parte do fechamento de produto. Runtime esperado SHA256 `4f7e4c622e4622dd3c99a9fd3e4982ca21e155ae169dc59289919781eb428de1`; licença esperada SHA256 `8ed754b590178224fd5a4a7f6363f98893588c398745564de0aad37a2c247507`.

Prova: uma fixture própria QR UTF-8 e imagem incorporada passou pelo `RecoveryEngine.backup({includeMedia:true})` real de disco, produzindo `.fmx` de 10 arquivos. `load()` verificou tamanho/SHA de todos. O GTZIP e a pasta convertida originais foram renomeados na raiz TEMP própria e ficaram indisponíveis. `restoreGtTitles` restaurou 7 arquivos na pasta canônica nova; `verifyImportedGtTitle` validou o recibo original. O QR restaurado decodificou no Edge headless com ZXing independente. Calls Native foram mocks, portanto **isso não é aceite de recuperação pela API instalada ou CEF**. Essa prova ainda será feita no candidato seguinte.

Negativas incluem encoder adulterado, manifesto refeito para concordar com adulteração, licença ausente/adulterada, registro duplicado/ausente, encoder ausente, manifesto sem QR, outro nome de bundle e adulteração da mídia do `.fmx`. Relativos transitivos comuns ainda são copiados; escapes relativos e `file://` externos continuam recusados. Diagnósticos de URL remota, bare module e endpoint de runtime foram preservados. Não houve requisição a terceiros.

Scripts de teste escrevem apenas suas fixtures TEMP e novos recibos nesta QA; a primeira execução e o baseline FAIL ficam preservados. Não repetir com os mesmos caminhos de recibo: há `flag:'wx'` justamente para impedir sobrescrita de evidência. TEMP própria foi removida após conferir que permanecia sob a raiz TEMP.

`ALLOWLIST.json` contém somente o módulo aplicado e textos de QA. Screenshot QR, arquivos esperados sintéticos e mídia TEMP não são necessários à distribuição.

Diagnóstico de ativação separado: `qa-finalizacao/gtzip-activation-event-order/README.md`. A correção Native de OnLoadEnd pertence ao root/installer e não está incluída neste módulo.
