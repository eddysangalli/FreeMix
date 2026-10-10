# QR GTZIP offline — contrato finito

PASS em **46 verificações de dados/navegador/decoder** e **28 de backend/persistência**, com fixture própria. Não houve execução Native/CEF, build, Git, instalação, alteração da mesa, envio ou edição do pacote selado.

## Contrato implementado

`QRCode` direto, em Layer/Group ou composição aninhada; `Name`, `Text`, `Dimensions` e `Location`, visibilidade/opacidade e transform/crop 2D já existentes. Texto editável UTF-8 não vazio, sem controles ou surrogate isolado, até512bytes; preto/branco, **ECC M**, **quiet-zone4**. Dimensão quadrada inteira16–2048px, pelo menos um pixel por módulo incluindo quiet-zone. Outros atributos/filhos QR são rejeitados com diagnóstico. Opções de ECC, cores, logo, versão forçada, QR estruturado/binário/ECI e equivalência pixel a pixel vMix não fazem parte do contrato. Crops, rotação, escala não uniforme, baixa opacidade e resolução final podem prejudicar leitura; não há promessa de leitura nessas transformações.

O encoder é uma closure offline de23módulos qrcode1.5.4 + dijkstrajs1.0.3. O bundle está no fonte do produto e não precisa de node_modules, servidor, CDN nem originais do título para executar. Cada título QR convertido recebe `gt-qr.js` e `QR-LICENSE.txt`, ambos registrados no manifesto de integridade. Os avisos MIT dos fontes também permanecem no bundle.

Parser diagnóstico, runtime e backend usam o mesmo contrato. Inicialização e `updateFields`/GC update geram SVG, preservando quiet-zone. Falha de atualização elimina o QR anterior e expõe motivo pelo retorno/dataset/aria. `save` e `prepare` validam o manifesto verificado; falha retorna erro pela UI já existente **antes de gravar valores ou criar/atualizar fonte**. Nenhuma alteração no painel foi necessária. Relógio não substitui SVG QR mesmo quando há nomes de campo duplicados diagnosticados.

## Evidência

- Inventário original somente leitura:743/743 hashes iguais,4/4 QR convertidos,0 diagnóstico QR. Os quatro possuem Name/Dimensions/Text; todos170×170, um Location, nenhum filho/opção extra. Somente contagens foram emitidas; não foram copiados modelos, textos, nomes, imagens ou fontes proprietários.
- Edge headless/Playwright: seis leituras **ZXing-C++2.3.0 independente** de screenshots reais — URL, texto português, caracteres literais seguros, retomada após erro,512bytes e Layer/group. Retornos decoded/matches true. ZeroHTTP/WSS e zero pageerror no ensaio final.
-100atualizações: média0,168ms/máximo0,300ms nesta máquina, sem fila nem acúmulo de SVG. É medição finita de geração, não latência CEF/render/streaming universal.
- Título convertido abriu com o arquivo GTZIP original indisponível; validação real de hash/manifesto/persistência também passou sem original.
- Backend:28checks; erro de QR deixa memória, arquivo e contagem de save inalterados, sem request Native; texto/ticker comuns mantêm comportamento. Conversão/arquivos/integridade/persistência são reais em raiz QA, a fronteira de requests Native é mock explícito.
- Transforms/posição/opacidade foram conferidos nos dados; grupo teve geometria real no navegador. Não houve homologação visual/decoder no CEF do produto ou câmera física.

## Falhas preservadas

1. `resultado-opencv-fail-preservado.json`: OpenCV5 não detectou um QR válido com caracteres especiais. A **mesma imagem** foi lida pelo ZXing sem alterar encoder; OpenCV ainda é registrado como observação e não forçado a PASS.
2. `resultado-harness-document-write-fail.json`: harness reutilizava `setContent` no mesmo documento, redeclarando const specs. Corrigido para páginas próprias novas, sem alterar produto para esconder erro de harness.
3. `resultado-duplicate-clock-fail.json`: caso de campo QR e clock com mesmo nome revelou sobrescrita do SVG. Corrigido somente na branch clock para pular `.gt-qrcode`; ensaio final46PASS inclui a regressão.

## Reprodução / arquivos

`node qa-finalizacao/gtzip-qr/test.mjs`, `node qa-finalizacao/gtzip-qr/test-save.mjs`, `node qa-finalizacao/gtzip-qr/reference-contract-check.mjs` e `node --check` nos seis fontes. Os dois primeiros criam somente fixtures/output QA próprios, Edge headless e arquivos dessa raiz. O terceiro somente lê as referências e grava recibo agregado. Não iniciar Native.

QA requer Playwright/JSZip do runtime Codex indicado nos scripts, Python com Pillow/OpenCV e **zxing-cpp2.3.0** em decoder-deps privado (`python -m pip install --only-binary=:all: --no-deps --target qa-finalizacao/gtzip-qr/decoder-deps zxing-cpp==2.3.0`). Dependências/PNG/GTZIP/binários/saídas/estado bruto QA ficam fora da allowlist; não entram no produto/Git/pacote. Fixture XML e scripts recriam o material próprio.

`build-bundle.mjs` reconstitui a closure a partir de qrcode1.5.4/dijkstrajs1.0.3 locais e verifica os23hashes em bundle-provenance antes de substituir o bundle. Não instalar dependências nem gerar bundle durante abertura normal do produto. A implementação do produto entregue já é autocontida.

Root deve espelhar os seis fontes e respectivas licenças/proveniência, atualizar o closure/preflight e criar **novo candidato**.000500 e anteriores permanecem snapshots. Este recibo não é declaração de novo instalador entregue, suporte universal GTZIP ou validação CEF.
