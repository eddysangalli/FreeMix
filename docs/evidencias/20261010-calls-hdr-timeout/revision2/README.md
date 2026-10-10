# Revisão2: rascunhos Calls e deadline HDR

Drafts próprios; não aplicados ao produto. O primeiro freeze13/8PASS permanece byteidêntico (ALLOWLIST dbf0319e…). Esta revisão responde aos achados adicionais do reviewRoot. Baselines canônicos permanecem calls.js01673273… e HDR642b6a54…. Patches partem desses mesmos baselines, não do primeiro draft. Arquivos de preparação são históricos; os patches/JS finais e BASELINE.json são os bytes a revisar e integrar com guard.

## Calls

A edição é guardada por guest.key/UUID e preset, somente vídeo, modo de áudio, ganho e UUIDs de áudio; até8 rascunhos em memória, sem nomes como identidade, links ou segredos. Cada edição tem revisão. Save captura scope/revisão/operação: ACK antigo após nova edição não a apaga, ACK de outro preset ou convidado removido não confirma a linha recriada. Pending guard impede segundo Save simultâneo, inclusive após repaint.

Save confirmado mantém os quatro valores no formulário enquanto espera eco de estado, sem trocar pelo globalpoll ainda antigo. O eco compara vídeo, modo, ganho e conjunto de fontes. Espera até2.5s; se não refletir, mantém valores confirmados e mostra aviso específico, Save fica bloqueado até reconciliar pelo polling. Não envia nova configuração automaticamente. SaveFAIL preserva edição e erro. Mudança de preset/remoção de UUID limpa somente a memória correspondente; mesmo nome com UUID novo não herda.

Fonte custom removida, mic privado ou a própria voz selecionada fica como checkbox marcado/desabilitado com Remover da seleção. Salvar é recusado enquanto isso permanecer no modo custom. Remover atua só no rascunho e requer Save explícito; mudar para Programa/Somente talkback é outra decisão explícita. Vídeo salvo removido também fica indisponível e não vira Programa silenciosamente. O resumo O convidado vê/ouve continua mostrando estado salvo, separado da edição.

## SRT HDR

Deadline5s em GET e POST utiliza sinal de fetch; abort também encerra espera pelo corpo JSON. Timeout de comando diz: Sem confirmação em5s; o comando pode ter sido aplicado, confira o motor. Timeout de consulta diz que o motor não respondeu e aponta Conferir motor. busy é liberado; needsCheck bloqueia Start até GET reconciliar. Não rotula transmissão falhada/cancelada nem desfaz comando Native. Erros reais restantes são preservados, sem retry.

## Provas e limites

result-final.json:12 casos PASS. DelayedSave com edição posterior; mesma UUID após mudança de preset; ACK antes de eco/poll antigo; timeout de eco e reconciliação dos quatro valores; SaveFAIL; fontes custom ausente/diretor/própria voz; vídeo ausente; remoção/recriação UUID; remoção com Save pendente sem draft anterior; limite8 recusando nona linha; HTTP real próprio devolvendo headers+corpo JSON parcial em Start e GET, ambos encerrados após5s com mensagem/busy/needsCheck/no retry conferidos. node --check passou nos dois JS finais.

O relógio do eco foi avançado só na VM própria. O deadline HTTP usou relógio real e servidor efêmero próprio; nenhum comando Native foi emitido. Sintaxe inicial do harness duplicou saveButton: FAIL preservado, nenhuma execução ocorreu nessa tentativa.10PASS da revisão anterior também foram preservados antes dos dois guards finais. DOM/VM e HTTP não comprovam CEF/visual/hardware/áudio físico. A aplicação exige revisão do Root e uma versão posterior ao candidato050500; fontes/pacote/operador/Git ficaram intocados por esta frente.
