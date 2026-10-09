## Estado prioritário — 09/10/2026, 18h05

O trabalho até 13/10 permanece ativo. Leia PLANO-CONCLUSAO-20261013.md para os donos dos arquivos, entregas e evidências. O Git do produto está em `feat/native-menus-config-screens`, commit `3e6a1dc`.

Replay, ASIO, distribuição, recuperação e Fill/Key foram integrados nas fontes. O pacote 153453 é anterior a essas integrações e permanece imutável. GTZIP, HDR manual por OMT e correções de fechamento LocalVocal/SceneSwitcher foram integrados nas fontes com provas locais. Recuperação .fmx dos títulos passou no Native final 1c045e5d. Controladores foram congelados e espelhados com 12 provas de software e 26 casos de navegador. Ainda faltam ensaios prolongados e o novo instalador. Relatórios antigos não comprovam a entrega atual.

Os ensaios físicos e de WAN, o envio HDR por NDI Advanced SDK e a publicação em domínio próprio dependem dos recursos correspondentes. Não publicar automaticamente nem alterar a mesa do operador.

# FreeMix — entrega SRT 4:4:4 e alpha

## Instalação e organização — 09/10

Instalador Windows offline em `entregas/FreeMix-Studio-Setup-0.1.0-local.20261009153453.exe`; abra pela raiz `INSTALAR-FREEMIX.cmd`. Fontes em `scripts/installer-windows`. Instalação nova com assinatura/hash, portas livres e atalhos; não migra automaticamente a mesa. Essa entrega anterior não inclui desinstalador nem Authenticode. As fontes novas incluem desinstalação conservadora; o novo EXE ainda está em preparação. Conferência em raiz temporária separada, documentada em INSTALACAO.md.

Documentos atuais foram reunidos em `docs`, scripts auxiliares em `scripts` e versões anteriores/experimentos encerrados em `archived/limpeza-demo-20261009`. `obs-vmix` permanece a instalação de uso; `freemix-app` é o código nativo; `FreeMix` é o repositório Git do produto. Seu runtime gerado duplicado foi arquivado. Root CONTINUAR é somente apontador para este documento.

As seções abaixo preservam a cronologia dos testes. O estado final do experimento alpha-web é ABORTADO; resultados anteriores não são indicação de uso atual.

## Protótipo vídeo alpha por uma entrada de navegador — 09/10

**ABORTADO para uso operacional por pedido do operador:** o teste real com vídeo foi rejeitado por lentidão, travamentos, avanço/retrocesso aparente e atraso local. As provas Edge/quadros sintéticos não homologam esse comportamento no vMix. Não recomendar esta rota para vídeo nem internet; WAN não foi testada. A saída Horizontal para 18460 foi parada, desabilitada e configurada sem início automático. O receptor próprio de PID 43420 foi encerrado; HTTP 18750 e UDP 18460 estão livres. FreeMix/vMix permaneceram abertos. Fontes e recibos foram conservados como histórico do experimento, sem promoção a release. Próxima alternativa apenas em análise: receptor nativo SRT→NDI com alpha e áudio.

Correção do teste assistido: o operador realmente trocou Horizontal para TITLE 25, enquanto a saída paralela Teste Alpha Web continuava com TITLE 15. A duplicação criada pelo agente causou a confusão. O teste foi unificado: Horizontal / índice 0 / Saída 2 agora envia TITLE 25 a 18460; saída de teste índice 3 foi parada, desabilitada e liberada. Receptor reconectou, geração 2, vídeo chegando, única saída habilitada. Para trocar a fonte, editar Horizontal. As etiquetas da navegação web agora incluem o nome real do destino. Não encerrar/reiniciar motor/vMix para esse ajuste.

Teste assistido no operador: uma saída livre, **Teste Alpha Web / índice 3 / Saída 5**, foi configurada para SRT Caller 127.0.0.1:18460 com a mesma origem packed 420 da saída Horizontal; demais configurações de destinos permaneceram idênticas. Esta alteração de teste foi feita na mesa, diferente dos ensaios isolados abaixo. Receptor conectado; operador confirmou vídeo no Web Browser vMix. Edge decodificou a transmissão real em 1920×1080. Ajuste no MSE preserva duração do GOP em vez de saltar para os últimos 250 ms a cada fragmento: 150 quadros renderizados em cinco segundos após estar pronto. Fonte deve ser trocada nessa Saída 5, não na Horizontal 18360. Confirmação de transparência sobre fundo no vMix continua pendente.

Correção adicional do assistente SRT: o botão de confirmar agora compõe a URL com todos os valores visíveis (IP/porta/modo/latência), preservando parâmetros avançados. Antes, sem um evento `change` individual, a confirmação podia manter a porta antiga. Regressão `resultado-srt-port-submit.json` e ensaio existente `resultado-srt-conexao-ui.json` passaram; saída ativa continua protegida. A janela de configuração já aberta precisa ser reaberta para carregar o JavaScript novo; não reiniciamos o motor nem alteramos o destino ativo do operador.

`ABRIR-RECEPTOR-ALPHA.cmd` / `obs-vmix/ferramentas/alpha-web-receptor.mjs` recebem vídeo H.264 4:2:0 com cor/máscara lado a lado, remuxam sem recodificação para MP4 fragmentado e recompõem alpha do mesmo quadro em WebGL. **Não redesenha GC HTML**: qualquer fonte/composição com alpha real, inclusive chroma aplicado, pode alimentar o transporte. Serviço separado, HTTP 18750 / SRT 18460; guia `VIDEO-ALPHA-UMA-ENTRADA.md`. Nada foi publicado externamente.

Ensaios isolados: `resultado-alpha-web-video.json` PASS (movimento, alpha 0/130/255 nominal 0/128/255, entrada tardia, queda transparente, reconexão) e `resultado-alpha-web-fullhd.json` PASS (1920×1080 lógico / 3840×1080 packed, 30 fps na origem). Navegador Edge headless, sem alterar operador/vMix. Sem áudio; Chromium embutido no vMix, duração prolongada, latência e WAN ainda precisam validação. Não confundir protótipo de fonte adicional com os ZIPs nativos assinados anteriores.

O operador confirmou em prints que SRT packed 4:2:0 chega ao vMix e a recomposição funciona com **SRT + Virtual + Mix Key + Mix Fill**, ambos com aspecto Widescreen; Key/Fill aplicado entre os dois Mix renderizados. Aplicar diretamente na fonte recortada causou opacidade/enquadramento errados. A nova entrada de navegador é tentativa de eliminar esses quatro auxiliares, ainda não declarada homologada no vMix.

## SRT para vMix — 4:2:0 e Fill/Key, 09/10

O motor agora oferece três modos de transparência SRT: `packed` em 4:2:0 ou 4:4:4 (cor e máscara no mesmo quadro), e `fill`/`key` separados em 4:2:0 (duas portas, largura original). Todos usam x264/H.264 e uma entrada/composição com alpha real. O formato 4:2:0 reduz a resolução de cor; a máscara cinza usa a luminância em resolução completa. O modo separado conserva áudio em ambos os envios: silencie a Key no receptor. Duas conexões não garantem sincronismo de quadro/genlock.

Prova local: `qa-portatil/resultado-srt-fillkey-20261009.json`, três receptores FFmpeg nas portas isoladas 18366–18368, 90 quadros decodificados por modo, H.264 High/yuv420p, máscara 0/128/255 e diferença média 0 entre a Key separada e a metade Key do packed. Native SHA-256 947724cf99c8babdf43d7c032de7bb43192694e7d08f7ecbaa133b631ac5d14d, saída 0, nenhum novo crash. UI e adapter passaram; o teste não modificou o vMix/operador. Falhas iniciais de contexto UI e referência da fixture foram preservadas.

vMix: a recepção 4:2:0 e a recomposição Key/Fill ainda precisam ser conferidas na mesa. Para um SRT único, o transporte preserva as metades no mesmo quadro, mas precisamos validar se o Key/Fill usa o Crop da Virtual Input; pode exigir um Mix renderizando a metade Key. Isso não foi declarado concluído. Guia: SRT-VMIX.md.

A correção de reconexão/divisão por zero permanece no obs-ffmpeg.dll SHA-256 7d2d4fd4bcf628d606b73bf6f48ee1f5103ce3559e0abb1c1cae1b037a6509e8. O relatório de 12:16 foi recebido com a instalação antiga ainda aplicada (135628). Atualização somente após salvar e fechar normalmente, pelo ABRIR-FREEMIX.cmd; o agente não reiniciou o operador.


A entrega corrente é identificada em entregas/ULTIMA-ATUALIZACAO.json e nos manifests assinados dos ZIPs. O launcher aplica somente com a instalação salva e fechada; não atribuir a versão nova a uma mesa que continua aberta com o executável anterior. Pacotes anteriores permanecem imutáveis.

## Encerramento e reconexão SRT — correção de 09/10

O fechamento principal agora recusa eventos reentrantes durante a confirmação/encerramento e aguarda o destrutor dos painéis CEF. Painéis são removidos com a janela principal ainda íntegra; sua exclusão adiada não compete com a destruição do pai. A cópia corrigida passou no fechamento pelo X, com Salvar e fechar, três painéis, fechamento simultâneo de um painel e consultas ao motor: saída 0, nenhum novo crash (`resultado-close-reentry-fixed-20261009.json`). O cenário antigo também passou; isso não prova a causa exata do relatório Qt original.

No muxer SRT/MPEG-TS, reconectar agora descarta os pacotes e o contexto da conexão anterior. Escrita fica bloqueada até o cabeçalho do novo contexto estar inicializado. Corrigida também a limpeza dos ponteiros após falha/fechamento do transporte. Essa fila residual era um caminho concreto para a divisão por zero durante as reconexões observadas.

O teste do operador confirmou conexão SRT com o vMix, seguida de `SRT.ExitingDueToDecoderFailure` no perfil High 4:4:4 com alpha empacotado. Para este vMix use 4:2:0 sem alpha. O contrato alpha empacotado, agora também disponível em 4:2:0, exige receptor compatível e recomposição, como OBS com decodificação por software e shader fornecido; não é alpha universal de SRT.

## SRT 4:4:4 e alpha, validado localmente

- SRT independente aceita H.264/x264, I444 ou NV12 e alpha empacotado: Fill esquerdo e Key cinza direito no mesmo quadro. O receptor precisa dividir/recompor, conforme `obs-vmix/ferramentas/GUIA-SRT-444-ALPHA.md`. Sem seleção avançada, permanece 4:2:0 e sem alpha.
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
