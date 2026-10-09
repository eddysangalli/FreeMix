# FreeMix — pendências e limites de 0.1.0-local.20261009045022

As implementações desta rodada têm provas locais. O que segue continua separado e não é declarado concluído por esses ensaios.

Veja [Pendências reais e critérios para encerrar](PENDENCIAS-REAIS.md): separa desenvolvimento, homologação e infraestrutura, com o trabalho concreto para concluir cada item.

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
