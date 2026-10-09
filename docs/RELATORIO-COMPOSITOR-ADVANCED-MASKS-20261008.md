# Advanced Masks no compositor — 08/10/2026

Integração real por caixa, com filtro `advanced_masks_filter_v2` aplicado exclusivamente à cena privada `FreeMix Slot <UUID>`. Não modifica filtros da câmera/cena compartilhada, Programa nem instalações do operador. A opção aparece quando o motor descobre o plugin. Projetos antigos mantêm a máscara nativa; a mudança de motor exige seleção explícita.

Controles: círculo, retângulo, elipse, polígono regular (3–12 lados), estrela (3–12 pontas e raio interno), coração, tamanho, suavização interna/central/externa e cantos do retângulo. Campos persistem no schema `mask.type=advanced`; modelos, duplicação e reflow usam esse mesmo schema. A ausência do plugin bloqueia a aplicação com mensagem e conserva o fallback nativo. Nenhuma configuração arbitrária do plugin é aceita.

Círculo usa os eixos da elipse nativa compensados pela escala externa do slot, mantendo diâmetro físico igual. Demais formas acompanham a proporção/transformação da caixa; não há promessa de proporção física invariável de estrelas/corações/polígonos. Suavização é percentual da menor dimensão do canvas, convertido para pixels do shader. Sombra continua difusa da caixa; não acompanha a silhueta Advanced Masks. Não expõe superformula, máscara por fonte, ajustes de cor nem todos os controles da janela original do plugin.

Fonte técnica lida: checkout oficial `qa-portatil/advanced-masks-provenance/source/obs-advanced-masks-1.5.4/src/mask-shape.{c,h}` e efeitos dessa versão; binário oficial já registrado pelo recibo de instalação. Sem download novo, alteração nativa ou rebuild nesta frente.

Evidência nova (sem repetir os 40 checks da galeria):

- `compositor-advanced-masks-logica.json`: 5 PASS de IDs, compensação, feather, validação e compatibilidade antiga.
- `compositor-advanced-masks-nativo.json`: 7 PASS em WS14476/API18098, incluindo seis renders distintos, isolamento da mesma câmera no segundo slot, fundo revelado, pixels suaves e troca nativo↔plugin sem dois filtros simultâneos.
- `compositor-advanced-masks-ui.json`: 2 PASS; seleção Coração + suavização 5% pela interface, metadata/settings confirmados no motor. Console sem erros. Captura `compositor-advanced-masks-ui.png`.
- PNGs reais em `compositor-advanced-masks-evidencias/`, incluindo cada forma e o contorno suavizado.
- `compositor-advanced-masks-qa-fechada.json`: instância própria saiu normalmente por `shutdown_idle {qaClose:true}`, depois API própria encerrada. Fonte/composição sintéticas removidas antes do fechamento; aba criada para ensaio fechada. Operador preservado.

Arquivos produto: `composicao-advanced-masks.mjs`, `composicao-estilos.mjs`, `entradas-producao.mjs`, `painel/remoto/compor-avancado.js`. Fontes quiescentes após esta entrega; empacotamento e documentação principal pertencem à raiz.
