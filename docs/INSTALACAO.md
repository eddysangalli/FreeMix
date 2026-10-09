# Instalar e abrir o FreeMix Studio

Abra **INSTALAR-FREEMIX.cmd** na pasta principal, ou envie o `.exe` de `entregas` para outra máquina Windows x64. O arquivo contém o pacote completo offline. Escolha uma pasta nova/vazia; o padrão é `%LOCALAPPDATA%\Programs\FreeMix Studio`.

O instalador verifica o conteúdo, instala motor/plugins/runtime, escolhe portas locais livres e cria atalhos na Área de Trabalho e Menu Iniciar. Depois abra **FreeMix Studio** pelo atalho. Não precisa abrir Node, OBS ou este workspace separadamente.

A instalação nova começa com a mesa inicial e não migra automaticamente o projeto em uso. Para a call imediata com suas entradas atuais, continue usando **ABRIR-FREEMIX.cmd** na pasta principal. Atualização nativa só é aplicada após você salvar e fechar normalmente.

Instalador de demonstração: `FreeMix-Studio-Setup-0.1.0-local.20261009153453.exe`, aproximadamente 1,25 GB. Usa a entrega assinada de 09/10. O receptor alpha-web abortado não foi acrescentado ao instalador. Mudanças de JavaScript posteriores à criação dessa entrega permanecem no workspace/fontes e precisam de novo pacote assinado para distribuição.

Este instalador inicial ainda não registra desinstalador no Windows e o EXE não tem assinatura Authenticode. O pacote interno possui assinatura Ed25519 e hashes verificados. Windows limpo e drivers/dispositivos externos continuam como homologação pendente.

Diagnósticos: use a ferramenta de logs do beta para gerar um ZIP local. Nenhum envio automático para terceiros está habilitado.

Validação local: instalação real em pasta temporária, dependências conferidas, motor com ready/barramentos/NDI, cinco rotas web HTTP 200 e encerramento normal apenas da QA. Dois atalhos reais (Menu Iniciar e Desktop no OneDrive) tiveram destino conferido e foram recolhidos após o teste. A primeira abertura da QA foi interrompida com porta ocupada/fechamento durante o teste; a repetição isolada passou. O guard de fechamento exigiu raiz com nome FreeMix-QA; a prova inicial foi conservada separadamente.
