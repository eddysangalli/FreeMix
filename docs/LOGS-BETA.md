# Enviar diagnóstico do FreeMix

1. Na mesa: **Configurar → Gerar ZIP de diagnóstico**. Também fica em **Configurações → Logs para suporte**.
2. Clique **Gerar ZIP de diagnóstico**, confira a prévia e clique **Baixar ZIP para enviar**.
3. Envie o arquivo ao responsável por e-mail ou WhatsApp. Nenhum envio automático acontece.

Se o FreeMix não abrir ou tiver acabado de fechar por erro, execute **COLETAR-LOGS.cmd** na raiz. O ZIP fica em **obs-vmix/diagnosticos/** nesta árvore de desenvolvimento, ou **diagnosticos/** na distribuição portátil. O BAT seleciona o arquivo no Explorer; não inicia nem reinicia o motor. A coleta não depende da API estar conectada ao OBS.

O pacote reúne logs recentes do motor e plugins, relatórios de crash, nome/apelido da máquina, identificador local, versão, sistema e descrição opcional do problema. Chaves e senhas conhecidas, URLs de servidores, e-mails, IPs e caminhos locais são removidos dos logs. Projetos, configurações completas, mídias, screenshots, documentos pessoais e dumps de memória não entram. Texto livre de um plugin pode conter dados que nenhum filtro consegue identificar: revise a prévia antes de enviar.

Coleta limitada a 70 logs e 16 MB de texto; até 1 MB por arquivo, mantendo início e final quando grande. O manifesto informa quais logs entraram e quais foram truncados. Até cinco ZIPs gerados são conservados na pasta; logs originais não são apagados. ZIP com hashes SHA256 e CRC conferidos antes de gravar. O nome do arquivo usa horário UTC para evitar confusão entre fusos.

O fluxo solicitado usa envio manual. Não precisa de Google Drive, domínio, SSH, conta ou servidor. Coleta e geração locais ficam disponíveis pelo botão e pelo BAT; não existe upload oculto, telemetria nem envio de áudio.

Provas desta rodada: `resultado-diagnosticos.json` (7 verificações), `resultado-diagnosticos-api.json` (5 verificações com motor desligado) e `resultado-diagnosticos-interface.json` (botão real no navegador de QA).
