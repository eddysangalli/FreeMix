# Ticker.Template 2D — rascunho isolado

**DRAFT_QA_PASS_NOT_APPLIED**.30checks próprios Edge/parser/conversão/edição, regressãoQR46PASS e Polygon/Path33PASS em subpastas novas. Os três fontes propostos ainda estão somente em `draft/`; nenhum obs-vmix, FreeMix, Native, mesa, pacote, Git ou instalação foi alterado por esta frente.

## Subconjunto

Um `Ticker.Template` com exatamente um Layer contendo uma Composition com **dois TextBlock e uma Image**, preservando geometria, estilos/transform/crop2D já reconhecidos. A composição é renderizada como **um item** rolável. Seus textos e imagem são campos editáveis; o campo externo do Ticker é removido dessa lista para não substituir/destruir o template. PNG próprio incorporado é copiado e registrado no manifesto de integridade; edição pelo campo Image existente permanece disponível.

`AutoSize="Shrink"` dos TextBlocks desse template usa no máximo10passos de busca de tamanho, entre min(4px,fontSize) e fontSize. Mede overflow real do run; texto excessivo permanece inteiro e recebe `data-shrink-overflow`, ficando recortado no mínimo local. Edição pode voltar à fonte máxima; fontes locais/embutidas prontas são reavaliadas por document.fonts.ready. Clock atualiza o run sem destruir Shrink. Wrap é respeitado na medição. Não se alega equivalência tipográfica vMix; outros AutoSize recebem aviso.

Aviso sempre presente: **TypeAdd/fila não implementados**, unidade de Speed desconhecida, duração local aproximada `max(1,60/Speed)` segundos. Movimento considera a área do Ticker e o tamanho do item. Não criar automaticamente filas, append, dados/feed, clone de todos os itens ou tempo inferido. Templates fora dessa estrutura finita recebem diagnóstico e mantêm fallback textual anterior. ImageSequenceLoop/3D continuam diagnosticados.

## Evidência

-30checks: estrutura/campos, template geométrico, Add/Speed/AutoSize não suportado, recurso PNG real, originalGTZIP indisponível, imagem48×48 em posição esperada, animação20s paraSpeed3, texto longo/curto/overflow/retomada, Wrap, clock, ediçãoImage, QR lido ZXing, Polygon/PathSVG, avanço real do item e zeroHTTP/WSS/pageerror.
-100atualizações com Shrink: média0,25ms/máximo3,60ms nesta máquina;10probes no máximo por campo. Medição finita Edge, não desempenho/latência/endurance CEF.
-Screenshot própria `own-template.png` foi inspecionada: dois textos legíveis e imagem verde nas posições definidas. PNG/GTZIPs/deps/output/estado raw QA não entram na allowlist.
-RegressãoQR46 preserva testes de limites/decoder/update/safety, sem modificar os recibos QR originais. Polygon/Path32asserts anteriores idênticos; guard33 exige o hash do draft, não afirma que o diff completo é somente uma linha.
-Gate inicial omitia o nó wrapperTicker.Template e falhou antes de converter: `resultado-draft-gate-fail.json` preservado. Corrigido somente no draft, último ensaio30PASS.
-Baseline dos nove módulos copiados, incluindo seis da frente QR, conferido intacto no produto no fim da QA. Referências743 não foram abertas nesta implementação.

## Integração

Somente `gtzip-xml.mjs`, `gtzip-render.mjs`, `gtzip_converter.mjs` mudam. `gtzip-qr*`, gc-gtzip, Native/API/mesa não mudam. Root precisa liberar aplicação **após045000copiado/selado**, conferir baselinepins e criar próximo candidato. Não aplicar silenciosamente ao pacote vigente.

Reprodução: os drafts e helpers copiados estão na allowlist textual; `node qa-finalizacao/gtzip-ticker-template/test.mjs`, `node .../qr-regression/test.mjs` e `node .../polygon-regression/test.mjs` criam só outputs das próprias subpastas. Mesmos dependenciesQA livres da frenteQR: Node, Playwright/JSZip/sharp, Pillow/OpenCV/ZXing-C++2.3.0. O decoder-regression reutiliza somente a dependência privada já instalada em gtzip-qr/decoder-deps, não altera original.

**CEF Native, save/prepare pela API instalada e .fmx deste ticker ainda não executados.** Coordenação enviada a installer para próximo candidato somente apósQA45encerrada e rootfornecerpins. Título/PNG/textos de fixture são próprios e não derivam de textos, nomes ou mídia proprietários.
