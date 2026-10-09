# Instalar o FreeMix Studio

Abra INSTALAR-FREEMIX.cmd na raiz, ou envie entregas/FreeMix-Studio-Setup-0.1.0-local.20261009213415.exe para outro Windows x64. O EXE contém o pacote completo, aproximadamente 1,38 GB. Escolha uma pasta nova/vazia; motor, plugins, Node, FFmpeg e NDI 6.3.2 são locais. Depois abra FreeMix Studio pelo atalho ou FreeMix Studio.cmd da instalação.

O padrão é uma mesa nova. A importação .fmx é explícita, preserva a origem e cria coleção com mídia verificada, novas credenciais e saídas/automações paradas. O instalador recusa pasta não vazia. A desinstalação conserva projetos, mídia, configurações e arquivos distribuídos que foram alterados. Não migre copiando toda a configuração da mesa anterior.

Diagnósticos ou COLETAR-LOGS.cmd gera ZIP local sanitizado. Revise e envie manualmente por e-mail/WhatsApp; não há upload automático. Configurar rede é uma ação separada, opcional; nenhuma regra de firewall é aplicada pela instalação normal.

Conferência: duas instalações pelo EXE real em TEMP com espaços; importação opt-in, hash de prévia, mídia, segredos/autostart, diagnóstico e duas desinstalações passaram. Root abriu controle + Native real da cópia instalada, NDI carregado, nove rotas HTTP acessíveis, zero REC/stream/saídas e fechamento cooperativo em 776 ms sem novo crash. O log contabilizou duas alocações não liberadas, sob investigação.

O EXE não possui Authenticode. O pacote interno tem assinatura Ed25519 e hashes dos 9.520 arquivos verificados. Windows limpo, drivers/dispositivos físicos e WAN ainda não foram homologados. A mesa do operador não foi atualizada/ativada por este ensaio. HDR SDI e a nova correção de sincronismo A/B entrarão em outra versão.

SHA-256 do EXE: 8b1398c5b46435bff9518c4841756aa41754f971456a357366779864b0577773

Recibos: docs/evidencias-distribuicao-conclusao/resultado-package-native-startup-213415.json e qa-candidate-report.json.
