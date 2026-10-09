# FreeMix — pendências e limites da entrega corrente

## SRT para vMix — 4:2:0 e Fill/Key, 09/10

O motor agora oferece três modos de transparência SRT: `packed` em 4:2:0 ou 4:4:4 (cor e máscara no mesmo quadro), e `fill`/`key` separados em 4:2:0 (duas portas, largura original). Todos usam x264/H.264 e uma entrada/composição com alpha real. O formato 4:2:0 reduz a resolução de cor; a máscara cinza usa a luminância em resolução completa. O modo separado conserva áudio em ambos os envios: silencie a Key no receptor. Duas conexões não garantem sincronismo de quadro/genlock.

Prova local: `qa-portatil/resultado-srt-fillkey-20261009.json`, três receptores FFmpeg nas portas isoladas 18366–18368, 90 quadros decodificados por modo, H.264 High/yuv420p, máscara 0/128/255 e diferença média 0 entre a Key separada e a metade Key do packed. Native SHA-256 947724cf99c8babdf43d7c032de7bb43192694e7d08f7ecbaa133b631ac5d14d, saída 0, nenhum novo crash. UI e adapter passaram; o teste não modificou o vMix/operador. Falhas iniciais de contexto UI e referência da fixture foram preservadas.

vMix: a recepção 4:2:0 e a recomposição Key/Fill ainda precisam ser conferidas na mesa. Para um SRT único, o transporte preserva as metades no mesmo quadro, mas precisamos validar se o Key/Fill usa o Crop da Virtual Input; pode exigir um Mix renderizando a metade Key. Isso não foi declarado concluído. Guia: SRT-VMIX.md.

A correção de reconexão/divisão por zero permanece no obs-ffmpeg.dll SHA-256 7d2d4fd4bcf628d606b73bf6f48ee1f5103ce3559e0abb1c1cae1b037a6509e8. O relatório de 12:16 foi recebido com a instalação antiga ainda aplicada (135628). Atualização somente após salvar e fechar normalmente, pelo ABRIR-FREEMIX.cmd; o agente não reiniciou o operador.


As implementações desta rodada têm provas locais. O que segue continua separado e não é declarado concluído por esses ensaios.

Veja [Pendências reais e critérios para encerrar](PENDENCIAS-REAIS.md): separa desenvolvimento, homologação e infraestrutura, com o trabalho concreto para concluir cada item.

Estabilidade: fechamento pelo X com painéis CEF passou na correção dirigida. O muxer SRT recebeu correção da limpeza entre reconexões. Compatibilidade de decoder continua uma exigência do receptor: o vMix desta máquina encerrou a recepção do perfil High 4:4:4/alpha empacotado; use 4:2:0 sem alpha nele. A prova local em FFmpeg/OBS não homologa automaticamente outro decoder.

## Limites de implementação ou tecnologia

- HDR: a rota atual OMT/PA16 é SDR BT.709; metadados HDR não são disponibilizados pelo SDK suportado. SDI/Fill+Key físico exige placa/driver/keyer compatíveis.
- Replay: sincronismo software e referência comum; genlock físico não é criado em câmeras independentes. Arquivo corrompido pode perder quadros/pacotes; reparo não recupera conteúdo inexistente.
- GTZIP/HTML: conversão universal de formatos proprietários, plugins/fontes sem licença e HTML arbitrário não implementada. Só modelos reconhecidos/contrato FreeMix GC v1 sincronizam.
- Recuperação: captura estática não reconstrói serviços dinâmicos nem reinstala drivers/dispositivos. Diagnóstico de DLL não comprova ABI ou licença.
- 3D/PTZ: editor transforma plano texturizado, sem mesh/modelagem 3D. StreamFX depende de licença; tracking exige detecção/calibração/desempenho adequados.
- Interface: responsividade e aproximação local comprovadas; identidade universal 1:1 para toda janela/DPI/monitor e todos controles de plugins não afirmada. Campos não migrados continuam acessíveis no OBS original.
- Infraestrutura pública: instalar kit/abrir portas/DNS/HTTPS requer VPS e domínio do operador; nenhum serviço público está ativo nesta entrega.

## Testes adiados e dependências externas

- Calls em celular/internet móvel com fone: dois convidados, eco, atraso, TURN e talkback ouvido.
- NDI/OMT entre máquinas; SDI/ASIO/DirectOut/MIDI/OSC/Companion/StreamDeck/XKeys/PTZ físicos.
- Duas conexões reais de operadoras distintas, receptor remoto, perda/jitter/banda variável; medição local é limite inferior de goodput testado.
- Aceitação externa HEVC/AV1/EnhancedRTMP/HLSHEVC, fala portuguesa, tracking prolongado, carga/GPU/Windows limpo/UAC/firewall/monitores DPI.

Documentação/provas: CONTINUAR.md e docs/evidencias-ultima-rodada/. Logs locais por botão/BAT estão prontos. Publicação, transmissão externa e envio automático de logs não foram feitos.
