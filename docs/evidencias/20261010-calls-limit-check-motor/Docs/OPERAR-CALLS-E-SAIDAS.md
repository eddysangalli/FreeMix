# Calls, talkback e saídas

**Call e retorno:** na mesa, use **Adicionar Entrada → Call**. Em Calls, abra **Ajustar o que este convidado vê e ouve**, escolha Vídeo/Áudio e clique **Salvar retorno**. **Programa sem a própria voz** é N-1: retira a voz do próprio convidado. **Convidados ouvem uns aos outros** inclui os demais convidados também quando você escolhe fontes de áudio. Clique **Preparar retornos**, copie o link atualizado e confirme com a pessoa o que chega. Retorno pronto ainda pode estar aguardando conexão.

**Talkback privado:** **Configurar microfone → Microfone dedicado → Usar este microfone**. Escolha **Todos os Calls** ou **Somente os selecionados** e confira os nomes em **Sua voz vai para…**. Segure **Segure para falar** e solte para parar. O microfone dedicado fica fora do Master neste fluxo; a seleção também vale para o Talkback da mesa. Todos inclui Calls adicionados depois.

**Limite de vídeo:** confira o modo/limite informado pelo motor. O padrão usa câmera virtual para Programa e imagens locais até 5 fps para entrada/composição. Captura contínua, quando habilitada separadamente, é experimental; não pressupõe sincronismo A/V. Se Salvar aguardar confirmação, **Conferir motor** consulta somente o estado atual, sem repetir o envio. Não confirma que o convidado está ouvindo.

**SRT para OBS/vMix:** **Externo → SRT / RIST**. Escolha uma saída livre e siga **1. Destino → 2. Conteúdo e áudio → 3. Conferir e iniciar**. Com o receptor em Listener, use **Conectar ao receptor (Caller)**, IP do receptor e a mesma porta. Na mesma máquina, IP `127.0.0.1`. `0.0.0.0` serve à escuta, não ao destino Caller. Pare antes de alterar saída ativa. Confira vídeo e áudio no receptor.

**MultiStream para plataformas:** **Transmitir** abre MultiStream, sem iniciar. Os três passos configuram RTMP/RTMPS/HLS. **Salvar sem iniciar** guarda; **Salvar e iniciar este destino** ou **Iniciar este destino** envia. As quatro saídas adicionais são compartilhadas com SRT/RIST. **Transmissão principal · perfil salvo** usa um perfil separado e encaminha a **Configurar transmissão principal**.

Escolher entrada de vídeo não seleciona seu áudio: Master é o mix do Programa. Qualidade, overlays e transparência ficam nos detalhes avançados. 4:4:4 sozinho não cria alpha; packed/Fill+Key exige recomposição no receptor. NDI/OMT/SDI ficam em Externo; SRT HDR possui configuração avançada separada, sem alpha. Rede/TURN fica nos detalhes de Calls; importar TURN para os retornos exige prepará-los novamente.

Este roteiro acompanha o draft UI; Root deve integrá-lo com a versão correspondente antes de distribuí-lo. Recepção, WAN e sincronismo são verificações distintas do estado do motor.
