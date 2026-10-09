# GTZIP: escopo de compatibilidade e integração

A conversão é local, explícita e parcial. `inspectGtzipFile(path,{includeFonts})` lê/verifica ZIP e XML, gera o plano em memória e não escreve arquivos. `convertGtzipFile(path,dest,{expectedSha256,includeFonts,folderName})` exige um destino novo, publica a pasta por rename de staging e mantém a origem. Não utiliza tar/PowerShell para extrair, não executa arquivos do ZIP e não abre o Native.

Suporta a hierarquia Layer/Composition/Group, ordem dos elementos, rotação 2D em radianos, escala/translação 2D, crop sem feather, Rectangle/Ellipse/Triangle/RightTriangle, Polygon/Path SVG simples, imagens por GUID/aliases, fontes locais ou opt-in, e Fade/Fly/Zoom/Rotate/Reveal/Expand/ZoomFade/Hidden. A animação usa um wrapper separado para preservar a transformação estática do conteúdo. Relógios de parede `{0:HH:mm}`, `{0:hh:mm tt}` e variantes com segundos são formatados localmente; isso não implementa cronômetros proprietários.

Efeitos proprietários (Shadow/Skew/FlipX), 3D, máscaras, geometry/bounding especiais, QRCode, animações contínuas e ticker com template composto recebem avisos com nome do objeto e caminho XML. Ticker simples usa rolagem HTML aproximada. Os dois ImageSequenceLoop encontrados nas referências apontam para um alvo 3D ausente (“vMix Cube”): não há contrato verificável de frames/tempo; são diagnosticados, sem reprodução inventada. GIFs importados podem animar pelo suporte do navegador.

O leitor ZIP aceita UTF-8/ASCII, store/deflate e CRC32 válido; recusa multipart/ZIP64, encriptação, links, travessia, colisão de nomes Windows e limites divergentes. Limites: ZIP 128 MB, expandido 256 MB, arquivo 64 MB, XML 8 MB, 4096 entradas. Destinos/arquivos não podem passar por links/junções.

## API e editor

A ação existente `gc_library_import` conserva os guards locais da API. Não há ação central nova. Os dados são `payload: {format:1,kind:'freemix-gtzip-import',operation:...}`; o retorno fica em `state.gcLibrary.last`.

- `preview`: `sourcePath` absoluto `.gtzip`, `includeFonts` boolean. Retorna `sourceSha256`, `manifest`, `written:false`.
- `import`: os mesmos campos, `expectedSha256` da prévia, `name` opcional. Cria outra pasta e registro nesta coleção; retorna `id`, `name`, `entrypoint`, warnings/fontes, `scenesCreated:false`, `outputsStarted:false`.
- `save`: `id`, `values:{nomeDoCampo:valor}`. Texto até 2000 caracteres; imagem deve ser recurso do título ou `library:<sha256>.<ext>`. Salva somente o registro, mantendo a pasta convertida imutável.
- `prepare`: `id`. Verifica integridade e exige título fora do ar; cria/atualiza explicitamente uma entrada browser/scene com bounds no canvas. Não seleciona Program, não abre saídas e não troca a coleção.

A tela Biblioteca GC apresenta Conferir → Importar → Editar → Criar entrada. Mudar caminho/nome/opt-in invalida a prévia. A biblioteca JSON existente exporta os modelos próprios e seus assets, mantendo o conteúdo GTZIP separado no backup completo .fmx. O botão de fonte livre usa a ação existente `gc_library_asset`, dados `{kind:'font',freeFont:'bebas-neue'}`; não instala nada no Windows.

## Imutabilidade e recuperação

`freemix-gc/<scopeHash>.json` conserva `{format:1,items:[...],imports:[...]}`. Cada import possui `id`, `name`, `sourceSha256`, `manifestSha256`, `resolution`, `fields`, `values`, `warnings`, `fonts`, `createdAt`. A pasta canônica é `painel/gc/gt_titles/gt_UUID`; contém `index.html`, `manifest.json`, `gc.js` próprio/autocontido, descritor, thumbnail opcional, assets e licença de fonte opcional. `manifest.files` lista `{path,size,sha256}` de todos os arquivos imutáveis, exceto o próprio manifesto. O registro autentica o manifesto por hash. `verifyImportedGtTitle(panel,record)` valida a pasta antes de salvar/preparar e está exportado para a integração de recuperação.

O backup deve incluir a pasta mesmo antes de preparar uma entrada, além de tokens `library:` em `values`. O restore deve reutilizar bytes idênticos ou copiar para essa pasta canônica na raiz nova, recusando arquivos existentes alterados. O responsável principal implementa esses hooks em suas fontes de recuperação. Imagens de biblioteca ficam em `painel/gc/biblioteca/assets`; a fonte livre conserva uma cópia `.OFL.txt` e sua exportação JSON leva o texto da licença.

A API HTTP precisa servir `.gif` com `image/gif` e `.woff` com `font/woff`; os locais conhecidos eram `servidor-api.mjs` MIME e allowlist de extensões (linhas 87/172 na leitura inicial). Essa integração central pertence ao responsável principal. O Native usa URLs file locais.

## Fontes e evidências

Bebas Neue Regular é opcional e conserva [SIL OFL 1.1 e proveniência oficial](../../obs-vmix/painel/gc/fontes-livres/README.md). Só é copiada ao converter quando includeFonts=true e a família solicitada é exatamente Bebas Neue. Fonte embutida também exige opt-in. Fontes ausentes são diagnosticadas com fallback Arial/sans-serif; nenhum download ocorre no runtime.

`inventory.mjs` leu 743 referências locais em oito famílias, sem extração ou cópia de assets. Contagens de Layer/Rectangle/Image/Ellipse/Triangle/RightTriangle conferem fora dos nós internos de ticker complexo, explicitamente diagnosticados. 361 arquivos não tiveram warning detectado; 382 receberam diagnósticos. Essas contagens não são aprovação visual nem garantia universal.

`test-converter.mjs` usa XML/PNG sintéticos próprios e a fonte livre: testa hierarquia, geometria, movimento em 50%, mídia, fonte, edição, transição de saída, hashes, rejeições, APIs mockadas e preservação da origem. `test-ui.mjs` cobre 900x650/1280x720/1920x1080 × DPI 100/125/150/200%, incluindo prévia invalidada, importação, edição, preparação explícita e fonte opt-in. Todos os testes usam raízes TEMP FreeMix-QA-* e Edge oculto. Nenhum Native/processo/GC/coleção do operador foi alterado. A prova Native/.fmx completa pertence ao responsável principal.

Os recibos e allowlist ficam em `build/`; screenshots mostram somente fixtures próprias. Templates, XML e imagens das 743 referências licenciadas não são redistribuídos.

O runtime gc.js é gerado de um literal próprio do conversor, incluído nos hashes e referenciado como ./gc.js. Não depende de arquivos fora da pasta GT nem copia código da instalação do operador. O guard de dependências da recuperação permanece estrito.
