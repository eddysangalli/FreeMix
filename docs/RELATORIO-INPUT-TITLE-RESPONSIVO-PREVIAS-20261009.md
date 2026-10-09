# Adicionar Entrada / Title: responsividade e prévias

Conferência de 09/10/2026. Resultado: layout aprovado no ensaio de navegador a 600×600 e 1920×1080; quatro prévias ausentes foram geradas em pasta QA própria. A galeria passou de 23/27 para 27/27 imagens carregadas, sem fallback ou erro JavaScript. Os arquivos do produto e a mesa do operador permaneceram intactos.

## Escopo e limites

O teste usou Edge 155.0.4283.45 real, DPI 1, cópias verificadas de `mesa.html` e da árvore GC, servidor estático local em porta efêmera e dados de formulário isolados. Native, WebSocket e operações da mesa ficaram bloqueados; não foram acionados OK, importação, transmissão, gravação ou hardware. Portanto esta prova cobre renderização/layout e handlers de seleção, não uma criação real de entrada no Native.

A API de janelas CEF tem largura mínima de 800 pixels e não oferece redimensionamento/captura destas janelas independentes. Este ensaio exato de 600×600 é de navegador; a prova anterior das nove janelas CEF é separada. Não foi repetida essa matriz nem iniciada uma instância Native durante os testes de Replay.

O backend estático QA responde 404 ao pedido esperado `/api/json` de metadados. Isso explica o rótulo bruto `PASS_LAYOUT_WITH_ASSET_FINDINGS` também no recibo posterior. O verificador distingue esse 404 de fixture dos quatro 404 de PNG reais anteriores; depois da correção não há 404 da galeria. Os recibos brutos foram preservados.

## Layout observado

| Dimensão | Formulário: altura útil / rolagem | Galeria | Footer |
|---|---|---|---|
| 600×600 | 527 / 825 px, largura 455 px sem overflow horizontal | 2 colunas, 27 cartões | y=557, altura 43, termina em 600 |
| 1920×1080 | 1007 / 1007 px, largura 1720 px sem overflow horizontal | 9 colunas, 27 cartões | y=1037, altura 43, termina em 1080 |

Os oito campos do título selecionado são alcançáveis pela rolagem interna; os botões permanecem dentro da tela. O formulário ocupa a altura disponível, sem o antigo limite fixo de conteúdo. Em Full HD ainda existe espaço natural depois de um conjunto pequeno de campos — especialmente na aba Vídeo, com dois campos. Isso não deve ser descrito como ausência de qualquer espaço em branco.

As doze capturas antes/depois (Vídeo, Title no topo e Title nos campos, em duas dimensões) foram inspecionadas visualmente. Nenhuma alteração de CSS ou formulário foi necessária nesta frente.

## Quatro prévias corrigidas

As imagens foram renderizadas dos próprios HTML existentes a 1920×1080, com transparência, valores padrão do catálogo, fontes locais Segoe UI e animação de entrada concluída. Não houve edição de arte, título, catálogo ou HTML. O relógio usa o horário real da captura; não é um render determinístico de hora fixa.

Copiar somente os quatro PNGs abaixo de `qa-finalizacao/title-preview-patch-final/painel/gc/` para os caminhos correspondentes do produto:

| Caminho relativo em GC | SHA256 |
|---|---|
| `esportes/placar.png` | `ae3cbf2678bface6c44256815a6dc2a5f7151f80cf8833a7b110b6d281042dd0` |
| `jornalismo/lower_third.png` | `6c0bb2ec14929899ac04b781651c77360bf24f1c082fe7d67e338c17c91c13e0` |
| `jornalismo/urgente.png` | `27707fb1ae0b391299e08c2df48e3a23621a2d58d2ecfa83c63d853e61b4be7b` |
| `marca/bug_relogio.png` | `271f544b0878c11c375ff0e26daeca1c7c080c5505db8981e6d951158fc1e240` |

O placar mostra BRASIL 2–1 ARGENTINA, 2º T 35:00; lower third e urgente exibem os textos padrão; o bug mostra FREEMIX NEWS e o relógio. A inspeção visual confirmou os quatro PNGs. A imagem representa o quadro completo do HTML original, sem redesenho ou recorte artificial para a galeria.

## Evidência e reprodução

- Baseline: `qa-finalizacao/input-title-two-sizes-proof/resultado.json`, SHA256 `71d9d1e2b0359dac05dc802aa437c46fcf7cd1190ee282436b062171a5f38bf3`: 23/27 carregadas e quatro fallbacks Title nas duas dimensões.
- Render: `qa-finalizacao/title-preview-patch-final/resultado.json`: hashes dos PNGs e dos HTML/catalogo originais, fontes, padrões usados, zero erros e zero pedidos externos.
- Reteste: `qa-finalizacao/input-title-two-sizes-patched/resultado.json`, SHA256 `31578dfc2c33799ea1003b7a7d035c67ad56e59bd4230ea60bb35c101ae2d6bd`: 27/27 carregadas, zero fallback, zero erros JS, footer e campos verificados.
- Verificador: `qa-finalizacao/title-preview-patch-final/verificacao.json`, resultado `PASS_LAYOUT_AND_27_PREVIEWS_BROWSER_ONLY`: assinatura PNG, RGBA, dimensões, hashes, fontes originais intactas, doze capturas e classificação do 404 de fixture.

Scripts próprios: `test-input-title-two-sizes.mjs`, `render-legacy-title-previews.mjs` e `verify-input-title-previews.mjs`, todos em `qa-finalizacao/`. Os dois testes iniciais de fixture que não completaram a matriz foram mantidos; um fechava o popup pela preparação incorreta de estado, o outro exigia 27 prévias antes da correção. O primeiro render mantinha o placar padrão do HTML por navegação no mesmo documento; também foi preservado e não é promovido. O render final faz navegação em documento novo e verifica os valores do catálogo.

A allowlist congelada está em `qa-finalizacao/input-title-previews-allowlist-20261009.json`. A integração dos quatro PNGs em fonte/produto e o empacotamento pertencem ao agente root. Não há aprovação de instalação, CEF nestas duas dimensões, ação Native ou desempenho de vídeo inferida desta prova.
