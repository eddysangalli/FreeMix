# FreeMix — correção de encerramento e reconexão SRT

Use ABRIR-FREEMIX.cmd na raiz. Salve e feche a instalação correspondente antes: o launcher aplica o pacote assinado mais recente, cria backup, preserva configurações e inicia serviço + motor juntos. A versão e os ZIPs correntes estão em entregas/ULTIMA-ATUALIZACAO.json; cada ZIP tem SHA-256 ao lado. Nenhuma mesa aberta é encerrada pelo atualizador.

- SRT: saída independente x264/H.264 4:4:4; alpha empacotado com Fill à esquerda e Key em cinza à direita no mesmo quadro. Teste real de dez segundos, 320×180 lógico/640×180 transmitido, 30 fps, alpha 0/128/255 sem erro. A largura transmitida é o dobro da útil. Internet, Full HD e HDR não foram comprovados.
- OBS receptor: filtro fornecido em painel/efeitos/srt-packed-alpha.shader, seguido de Crop/Pad para retirar a metade direita. Plugin obs-shaderfilter necessário no receptor. Prova GPU com quadro recebido passou. Guia completo em ferramentas/GUIA-SRT-444-ALPHA.md, com ZeroTier e comandos FFmpeg.
- Transmitir abre MultiStream. Externo reúne SRT, NDI, OMT e SDI com campos por destino/emissor, sem autostart. Configurações gerais organizadas com descrições; gravação, transmissão, externo e multigravação ficam nos seus próprios módulos. Editor original completo permanece acessível.
- SRT usa um formulário inicial enxuto para conteúdo, áudio, resolução e conexão. Encoder, FPS, overlays e alpha ficam em Avançado; o guia abre separadamente.
- Janelas extras: corrigida resposta CORS de saúde usada pela mesa local. O launcher seleciona outra porta quando há conflito com vMix/outro programa e preserva credenciais. Uma mesa já aberta guarda o endereço antigo até ser reaberta.
- Encerramento: eventos de fechar repetidos são recusados durante confirmação/destruição; fechamento principal aguarda o destrutor dos painéis CEF. Teste pelo X com três painéis, Salvar e fechar e consultas simultâneas passou com saída 0 e nenhum novo crash. Isso valida o cenário dirigido, sem atribuir a ele a causa exata do relatório Qt original.
- Reconexão SRT: limpeza da fila/contexto anteriores e proteção contra escrita antes do cabeçalho; limpeza dos ponteiros do transporte. A compatibilidade do receptor continua separada da estabilidade do emissor.
- Diagnóstico beta: COLETAR-LOGS.cmd gera ZIP local sanitizado para encaminhamento manual. Nenhum dado foi enviado automaticamente.

Recursos anteriores e limites: CONTINUAR.md. Pendências reais e trabalho necessário para fechar cada uma: PENDENCIAS-REAIS.md. Provas desta atualização acompanham docs/evidencias-srt444 no pacote. O primeiro FAIL de Key foi preservado e superado pela prova corrigida; não foi escondido.

Exemplo local FreeMix → vMix: entrada SRT Listener na porta 18360, latência 120 ms; FreeMix caller srt://127.0.0.1:18360?mode=caller&latency=120000. Use 4:2:0 sem alpha neste vMix: o log do teste confirmou recepção seguida de falha no decoder para o perfil 4:4:4 com alpha empacotado. Para esse perfil use OBS com recomposição; alpha packed não é recomposto automaticamente no vMix.

Os executáveis/runtime ficam nos ZIPs locais. GitHub guarda fontes e uma série completa de patches sobre o OBS fixado. VPS/domínio, hardware, internet, HDR completo, GTZIP ainda não suportado e acabamento universal das telas continuam com critérios explícitos em PENDENCIAS-REAIS.md.
