# Composições, máscaras, orientação e locutor — 2026-10-08

Arquivos de produto alterados: `obs-vmix/ferramentas/entradas-producao.mjs`, novo `composicao-estilos.mjs`, novo `composicao-locutor.mjs`, `obs-vmix/painel/remoto/compor-avancado.js`. Production/API/Mesa e journal foram integrados pelos respectivos agentes responsáveis.

## Entregue

- Máscara independente por slot: elipse, cantos arredondados ou polígono de 3 a 32 vértices normalizados. O slot recebe uma cena privada e filtro OBS nativo. A fonte compartilhada original permanece sem alteração, inclusive quando usada em outro slot/composição.
- O enquadramento e crop acontecem dentro da cena privada antes da máscara; o slot mantém sua posição e rotação externas. Trocar a entrada substitui somente o filho privado. Duplicar/modelo cria wrappers e filtros próprios.
- Sombra difusa real: imagem PNG alfa com convolução gaussiana, renderizada pelo image_source nativo como decoração atrás do slot. Não depende de plugin blur. PNGs são gerados e gravados atomicamente no diretório de assets do projeto.
- Perfis de âncora/tamanho horizontal e vertical por slot GC. A orientação correspondente aplica a geometria; o outro perfil fica salvo para a variante.
- Variante horizontal/vertical vira outra composição, com slots/wrappers/decorações independentes. A versão portrait em canvas horizontal ocupa o viewport central 9:16. Para transmitir em 1080×1920: selecionar essa entrada e usar `fill:true` (Preencher/crop central), sem zoom extra, conforme contrato confirmado com o agente Outputs.
- Enquadramento por locutor usa medidores reais, sensibilidade, margem de troca, debounce e permanência mínima. As associações de áudio são explícitas por UUID. Diretor privado, retornos e buses são recusados/ignorados. Silêncio não inventa locutor. Posição manual desliga automação; desativar pela configuração restaura o layout-base.
- Editor agrupa controles avançados em detalhes, mostra apenas parâmetros da máscara escolhida, permite associar áudio/slot e criar variantes.
- Remoção de composição espera a lista do frontend confirmar que a cena saiu, antes do refresh. Wrappers e decorações próprios são removidos; prefixo privado oculto na lista lógica, mas atravessado pelo tally recursivo.

## Evidência curta

- `composicao-estilos-logica.json`: 12 verificações aprovadas (polígono/área/limites, PNG alfa, âncora, sensibilidade/debounce/permanência, diretor excluído e viewport).
- `composicao-estilos-nativo.json`: 12 verificações aprovadas no motor/API QA. Elipse/polígono realmente renderizados; a mesma fonte no outro slot continua inteira e sem filtros; wrapper oculto; sombra image_source PNG; variante/âncora independente; medidores reais trocaram foco A→B; posição manual cancelou automação. Execução final de aproximadamente 7 segundos, sem aviso de cleanup.
- `composicao-remocao-nativo.json`: 3 verificações aprovadas de remoção/lista/API e limpeza de artefatos privados.
- `composicao-estilos-ui.json`: 5 verificações do editor conectado e parâmetros condicionais; captura `composicao-estilos-ui.png`.
- Frames nativos: `composicao-estilos-evidencias/elipse.png`, `poligono.png`, `vertical-anchor.png`.

Raiz isolada FreeMix-QA-Parallel-Calls-20261008, WS 14476/API 18098, identidade do processo e instalação confirmadas. Programa anterior da QA restaurado e fontes/cenas sintéticas removidas. QA salva e encerrada pelo guard (`calls-avancados-encerrada.json`). Nenhum microfone físico, instância do operador ou envio externo usado.

## Limites preservados

- Máscaras usam filtro OBS SDR; o código nativo do filtro ignora 709_EXTENDED/HDR. Não foi feita homologação HDR.
- Polígono arbitrário é editado por pares JSON de coordenadas; não há editor de vértices com mouse nesta entrega.
- Âncoras tratam o quadro do slot. GC HTML em canvas cheio exige recortar sua área útil antes de ancorar. Não há adaptação automática universal de todos os templates HTML/GTZIP nem layouts universais por destino.
- Variantes são composições independentes, compartilhando apenas fontes originais e dados. Não há sincronização automática de todas as futuras edições entre as variantes.
- Auto locutor reorganiza slots; não é reconhecimento de rosto/voz nem tracking de pessoa dentro da imagem. Depende de medidores disponíveis e fontes audíveis, com ajustes pelo operador. Não toca mute/rotas de áudio.
- O modelo lógico universal de Input, tally AUX/retorno e detecção de freeze/sinal/reconexão continuam abertos. Testes físicos/humanos, aprovação visual e longa carga permanecem adiados.
