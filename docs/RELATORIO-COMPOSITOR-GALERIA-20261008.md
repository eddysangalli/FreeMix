# Compositor multicâmera — entrega local

Implementado catálogo próprio de156 geometrias únicas para2–16 fontes em16:9 e9:16: grades com respiro/compactas, destaque com laterais/topo/rodapé, PiP2–4. Miniaturas numeradas derivam dos mesmos retângulos usados por InputEngine; filtráveis por número, orientação, família e busca. Seleção abre etapa2 com miniatura, câmeras/entradas atribuíveis, nome e Criar visível; Trocar layout retorna ao catálogo. Criação/duplicação seleciona nova entrada UUID no editor.

Fundo cor, imagem local PNG/JPEG/WebP/BMP ou entrada UUID, com fit/fill. Imagem validada por assinatura e tamanho32MB, copiada por hash aos assets do projeto. Cópia e modelo preservam fundo; troca remove item antigo antes de liberar imagem privada; ciclos rejeitados. Varianten H/V escolhem geometria correspondente e ajustam fundo ao viewport. Nenhuma fonte compartilhada recebe filtro de slot.

Editor usa imagem PNG real do compositor via /api/composition-frame autorizado, limite960px por lado, aspect preservado, refresh após mudanças limitado a500ms e botão manual. Fontes numeradas, arraste, alça inferior direita, Shift para tamanho, teclado1/10px, guias de centro/bordas e snap7px. Área segura acompanha viewport vertical. Alterações manuais preservam comportamento de desativar locutor automático.

Arquivos de produto: ferramentas/entradas-producao.mjs, composicao-presets.mjs, composicao-fundo.mjs; painel/remoto/compor.js, compor.html, compor-galeria.js, compor.css. Root integrou state.compositionPresets, frame API e picker Qt settings_pick_image/status.

Evidências novas: compositor-galeria-logica.json4PASS (156 modelos íntegros), compositor-galeria-nativo.json12PASS (fundo real, slots, fit/fill, ciclo,16 vertical, pose, duplicação), compositor-snap-logica.json4PASS, compositor-frame-variant.json5PASS (PNG API/aspect/variante/fundo próprio), compositor-galeria-ui.json8PASS, compositor-ui-native-check.json2PASS, compositor-atribuicao-ui.json4PASS, compositor-remocao-dependencia.json1PASS. Total40 verificações; sem tráfego externo nem toque no operador. Reruns só durante correções do comportamento novo, nenhuma bateria anterior reexecutada.

Exclusão pela API recusa remover fonte/entrada usada em slot ou fundo de outra composição viva. A recusa instrui trocar a fonte ou remover o dependente antes; a prova conferiu lista nativa intacta. QA própria encerrada, aba temporária fechada, composições de ensaio removidas e scripts geradores pontuais arquivados.

Screenshots: compositor-galeria-ui-final.png, compositor-atribuicao-ui-final.png, compositor-galeria-evidencias/{destaque-com-fundo,frame-api}.png. Comparação/UX em compositor-design-qa.md.

Limites: frames são snapshots ao editar, não monitor de vídeo contínuo; só imagem local estática nesses formatos (GIF animado não implementado). Picker positivo Qt não automatizado; consulta desconhecida recusada e UI ligada ao contrato real. Modelos verticais usam viewport9:16 dentro do canvas base e seleção explícita na saída fill, não sincronização automática de variantes. Presets reutilizam as entradas já existentes; a câmera física deve estar adicionada na mesa. Plugins Advanced Masks/Move/Switcher/StreamFX estão em outra frente e não foram incorporados ao editor nesta rodada.

Atualização posterior: Advanced Masks foi incorporado por slot ao editor em rodada separada, com 14 verificações novas e fechamento normal da QA. Ver `RELATORIO-COMPOSITOR-ADVANCED-MASKS-20261008.md`. Os 40 checks e o nome deste recibo continuam correspondendo à entrega da galeria; não foram repetidos nem renumerados.
