# FreeMix Studio — entrega selecionada 0.1.0-local.20261010035000

Abra INSTALAR-FREEMIX.cmd na raiz do workspace, escolha pasta nova/vazia e use o atalho FreeMix Studio criado pelo Setup. O seletor confere o hash da versão aprovada. Motor, controle, Node, FFmpeg e NDI Runtime acompanham o pacote. Drivers físicos continuam sendo os do fabricante.

Transmitir abre MultiStream. Externo reúne SRT/NDI/OMT/SDI. Calls permite escolher o retorno e quem recebe o talkback; configurações de gravação, MultiGravação e Replay ficam nos próprios módulos. Replay mantém timeline contínua, IN/OUT e autoplay no ar. A importação .fmx é explícita, conserva a origem, cria credenciais e não inicia saídas.

Diagnósticos ou COLETAR-LOGS.cmd gera ZIP local sanitizado para envio manual por e-mail ou WhatsApp. Instalar não aplica firewall automaticamente nem substitui a mesa anterior. 035000 passou em instalação real própria, duas aberturas/fechamentos, diagnóstico e desinstalação conservadora.

Fontes Native24/060000 incluem novos menus, ticker textual, SRT HDR opaco e correções do prazo de resposta HDR e dos rascunhos/seleções de retorno das Calls. A candidata 050500 teve falha no verificador de encerramento; diagnóstico e desinstalação passaram separadamente, sem reclassificar essa falha. A 060000 ainda aguarda geração e instalação real: 035000 continua selecionada. O retorno de vídeo personalizado das Calls permanece limitado a 5 fps e exige uma nova implementação de vídeo contínuo.

Leia docs/ENTREGA-ATUAL.md, docs/INSTALACAO.md e docs/PENDENCIAS-REAIS.md para o estado vigente e critérios de aceite. Hardware, WAN, Windows limpo e NDI HDR Advanced SDK/licença permanecem gates explícitos. O receptor alpha WebBrowser está abortado; a ponte nativa alpha é beta separada. Assinatura interna Ed25519; sem certificado Authenticode.
