# Legendas offline em português

A tela Efeitos permite selecionar áudio público e uma fonte de texto para reconhecimento local com Whisper tiny multilíngue. A opção de digitação é explícita; por padrão o texto aparece por fragmento reconhecido. A automação aceita o mesmo parâmetro `buffered`, e `effects_filter` aceita o filtro XYZ já existente.

Ensaio de 09/10: áudio português sintético gerado localmente pela voz Windows Maria e processado pelo motor real isolado. Sem envio de áudio do usuário, sem destino cloud, sem monitor audível. As sete expressões de referência apareceram; primeiro texto em 501 ms. Há transcrições intermediárias incorretas, preservadas no recibo. O ensaio não mede WER nem homologa microfones, ruído, sotaques ou carga prolongada.

Recibo `qa-finalizacao/legendas-pt/resultado.json` e script `nativo.mjs`. Isso confirma reconhecimento operacional do material sintético, não reconhecimento perfeito. O texto da fala era: “Boa tarde. Estamos ao vivo com as notícias da cidade. A previsão é de chuva amanhã pela manhã. O trânsito está tranquilo e as escolas funcionam normalmente. Obrigado pela sua companhia.”

## Falha adicional encontrada

Após reabrir a raiz QA com filtros LocalVocal salvos e executar replay, o encerramento ficou preso. Pilhas capturadas localmente mostram a GUI esperando `obs_wait_for_destroy_queue`, destruição de LocalVocal esperando mutex e inferência Whisper/OpenBLAS ainda ativa. A causa precisa de correção e regressão antes do pacote final; o sucesso da transcrição não conclui estabilidade de encerramento. Diagnóstico `qa-finalizacao/shutdown-native-stacks.txt`, limitado ao processo QA próprio. Não é evidência de problema causado pelo replay e não se generaliza para todas as falhas anteriores.
