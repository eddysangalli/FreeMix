# FreeMix — entrega SRT 4:4:4 e alpha

A entrega corrente é identificada em entregas/ULTIMA-ATUALIZACAO.json e nos manifests assinados dos ZIPs. O launcher aplica somente com a instalação salva e fechada; não atribuir a versão nova a uma mesa que continua aberta com o executável anterior. Pacotes anteriores permanecem imutáveis.

## SRT 4:4:4 e alpha, validado localmente

- SRT independente aceita H.264/x264, I444 e alpha empacotado: Fill esquerdo e Key cinza direito no mesmo quadro. O receptor precisa dividir/recompor, conforme `obs-vmix/ferramentas/GUIA-SRT-444-ALPHA.md`. Sem seleção avançada, permanece 4:2:0 e sem alpha.
- Prova loopback: dez segundos, 320×180 lógico/640×180 transmitido, 30 fps, High 4:4:4 Predictive/yuvj444p; alpha 0/128/255 com MAE 0 e RGB MAE 0,202. Native encerrado normalmente, sem crash novo, operador preservado. Não comprova Full HD/internet/HDR.
- Primeira prova `qa-portatil/resultado-srt444-20261009.json` conserva o FAIL inicial do Key e o PASS de 444 sem alpha. A correção passou em `resultado-srt444-keyfix-20261009.json`; EXE SHA-256 `82b743e26ba4c592d76df5dcde827a0bf95f3025e101736a28ca7f0edaf76621`.
- Externo em `/saidas?context=external`, com abas NDI/OMT/SDI, precisão real e configurações por emissor sem autostart. Evidências: `resultado-saidas-external-ui.json`, `resultado-saidas-external-real.json`, `resultado-srt-formato-adapter.json`, `resultado-srt-formato-ui.json` e `resultado-srt-acesso-guia.json`.
- Organização operacional: Transmitir abre MultiStream. SRT, NDI e OMT ficam em Externo; os perfis SRT avançados pertencem às saídas externas independentes. Abrir a tela ou preparar o perfil não inicia transmissão.
- SRT simplificado: conteúdo, áudio, resolução e conexão aparecem primeiro; encoder, FPS, overlays e alpha ficam em Avançado. O guia abre separado. A evidência final da interface é `resultado-srt-simples-ui.json`; não confundir rascunho com transmissão iniciada.
- Encerramento com janela CEF e polling simultâneo passou em `resultado-shutdown-20261009.json`, em build identificada no recibo. Isso valida o cenário dirigido; não identifica a causa exata do crash original do operador.
- Receptor OBS: shader srt-packed-alpha.shader seguido de Crop/Pad; prova GPU PASS com alpha MAE zero. Guia em ferramentas/GUIA-SRT-444-ALPHA.md no pacote. Essa prova usa um quadro do SRT recebido, sem afirmar recepção contínua externa no OBS.
- Janelas extras: CORS restrito é aplicado também à resposta de saúde. Serviço local restaurado na porta 18188 sem reiniciar Native/projeto. O launcher escolhe 18188–18198 se a porta configurada pertence a outro programa; portas explícitas de QA permanecem fixas. Mesa aberta antes da alteração precisa ser reaberta.

## Implementado e comprovado localmente

- Central:98 preferências originais em 10 categorias; propriedades de encoder descobertas no OBS real, rascunho, validação, revisão e aplicação com readback. Editor completo original permanece acessível. Formulários ajustam colunas, navegação e rodapé às janelas menores.
- NDI: runtime SDK6.3.2 portátil pinado/licenciado; Fill+Key nativo com timestamps comuns, Key cinza e áudio só em Fill. OMT: PA16 SDR/alpha de 16 bits com render RGBA16F; além das saídas múltiplas e conteúdo independente existentes. SDI: integração DeckLink device/mode/keyer/view/áudioUUID, validação e persistência sem autostart.
- Replay: quatro players, áudio exclusivo por câmera, offsets, calibração por referência comum de áudio e reparo por remux/recodificação limitado a120 s, cópia nova e original preservado.
- Bonding: UDP com AES/FEC/NACK, goodput e perda de mídia medidos por caminho sob comando explícito, alocação opcional por banda recebida, receptor privado portátil com CLI/hashes. Não há teste de banda automático.
- Recuperação: snapshots e eventos persistentes, restauração em projeto/perfil novos; captura manual de URLs explícitas e dependências estáticas com hashes, cópia sem scripts/conexões remotas; diagnóstico read-only de imports PE/DLLs.
- GC/Compor:156 presets, fontes numeradas, fundos e variantes H/V existentes; GTZIP ganhaEllipse/Polygon/Path e animaçõesZoom/Rotate reais, avisos para nós não convertidos. Títulos compatíveis têm animação/clock H/V comum e estilo/dados vinculados por protocolo opt-in.
- Efeitos: transformação XYZ com pivô/FOV/escala/projeção em plano texturizado; FaceTracker envia pan/tilt VISCA TCP para PTZ explicitamente configurada. Plugins oficiais blur/mascaras/Move/legendasoffline preservados. StreamFX pago não incluído.
- Calls: N-1/IFB/conferência/talkback fora do Master, watchdog e reconexão existentes. Importação privada TURN do kit aplica ao publicador de retorno e oculta credenciais no estado; convidados usam VDO.Ninja.
- Distribuição: kitLinux de feed assinado HTTPS/Caddy, coturn e receptor separado, preparado localmente. Não publicou domínio nem serviço externo.
- Estabilidade: corrigido ponteiro de vídeo RAW main inativo após mudança de resolução, com referências retidas, associação explícita e rebind; câmera virtual passou dois resets/GetOutputList sem violação de acesso.
- Suporte: COLETAR-LOGS.cmd e botão Gerar ZIP local sanitizado; beta encaminha o ZIP porWhatsApp/e-mail. Nenhuma coleta enviada automaticamente.

## Limites de implementação ou tecnologia

- HDR: a rota atual OMT/PA16 é SDR BT.709; metadados HDR não são disponibilizados pelo SDK suportado. SDI/Fill+Key físico exige placa/driver/keyer compatíveis.
- Replay: sincronismo software e referência comum; genlock físico não é criado em câmeras independentes. Arquivo corrompido pode perder quadros/pacotes; reparo não recupera conteúdo inexistente.
- GTZIP/HTML: conversão universal de formatos proprietários, plugins/fontes sem licença e HTML arbitrário não implementada. Só modelos reconhecidos/contrato FreeMix GC v1 sincronizam.
- Recuperação: captura estática não reconstrói serviços dinâmicos nem reinstala drivers/dispositivos. Diagnóstico de DLL não comprova ABI ou licença.
- 3D/PTZ: editor transforma plano texturizado, sem mesh/modelagem 3D. StreamFX depende de licença; tracking exige detecção/calibração/desempenho adequados.
- Interface: responsividade e aproximação local comprovadas; identidade universal 1:1 para toda janela/DPI/monitor e todos controles de plugins não afirmada. Campos não migrados continuam acessíveis no OBS original.
- Infraestrutura pública: instalar kit/abrir portas/DNS/HTTPS requer VPS e domínio do operador; nenhum serviço público está ativo nesta entrega.

## Homologação adiada pelo operador

- Calls em celular/internet móvel com fone: dois convidados, eco, atraso, TURN e talkback ouvido.
- NDI/OMT entre máquinas; SDI/ASIO/DirectOut/MIDI/OSC/Companion/StreamDeck/XKeys/PTZ físicos.
- Duas conexões reais de operadoras distintas, receptor remoto, perda/jitter/banda variável; medição local é limite inferior de goodput testado.
- Aceitação externa HEVC/AV1/EnhancedRTMP/HLSHEVC, fala portuguesa, tracking prolongado, carga/GPU/Windows limpo/UAC/firewall/monitores DPI.

## Evidência desta rodada

qa-portatil/central-ampliada-nativa.json, central-ampliada-ui.json, reset-video-raw-nativo.json, video-replay-integrado.json, resultado-bonding-medido-20261009.json, resultado-recuperacao-remota-20261009.json, resultado-instalabilidade-recovery-20261009.json, resultado-gc-efeitos-nativo-rodada.json, resultado-gc-gtzip-rodada.json, resultado-gc-efeitos-ui-rodada.json, calls-ice-logica.json, feed-servidor-tls.json e integracao-20261009-final.json. Cada prova informa escopo/build quando relevante; testes anteriores não são atribuídos a DLL nova.

## Abertura e preservação

Use ABRIR-FREEMIX.cmd na raiz. Aplique somente com a instalação correspondente salva e fechada; launcher verifica assinatura/hashes e cria backup. COLETAR-LOGS.cmd funciona sem abrir motor. PREPARAR-SERVIDOR.cmd gera kit da release selada; instruções em servidor/LEIA-ME.md. Não executeQA para operar, não feche/reinicie a mesa alheia e não publique/envie dados sem autorização.
