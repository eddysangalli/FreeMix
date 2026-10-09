# Validação do Native20 de produção

Harness preparado para executar apenas depois da autorização explícita do root e do envio do SHA256 do recibo congelado configurado. Exige commit 6cbf07641c501cb6b319c6bf7000b805fdce625c, configure explícito, versão gerada com -g6cbf076, rastreador OFF e raiz native-build-frozen-6cbf076-configured. A primeira tentativa com versão19 está excluída.

Comando: node matrix-production.mjs --frozen-receipt=CAMINHO --receipt-sha256=SHA256 --authorized-head=6cbf07641c501cb6b319c6bf7000b805fdce625c. Use o caminho completo deste script e do recibo. Não executar a preparação novamente: arquivos anteriores são preservados.

Três instalações novas do pacote213415 assinado recebem a árvore Native congelada inteira (bin/data/obs-plugins), com todos os hashes declarados verificados antes e depois da cópia. Cada raiz TEMP tem espaços, portas efêmeras e cópias independentes; nenhuma instalação, configuração, porta ou processo do operador é reutilizado. O pacote213415 permanece imutável. Nenhum atalho global, firewall ou autostart é criado.

Modos: Native direto sem API, launcher/control e Native direto com API. Coleção nova sintética, gravação/stream/saídas paradas e nenhuma entrada física ou de mídia/rede. Fechamento cooperativo limitado aos PIDs de executáveis dentro da própria raiz. Logs devem mostrar versão correta, Number of memory leaks:0, nenhuma lista de objetos restantes/double-destroy e nenhum crash. Todos os modos devem usar bytes idênticos. O código de saída do Native detached pelo launcher é indisponível; o harness comprova fechamento do PID e registra o log final.

Sem PDB, overlay de alocador, ledger ou guards de URL. O harness retira somente variáveis de instrumentação QA herdadas. O flag padrão --disable-updater continua usado; o atualizador de recursos RTMP de produção pode fazer consultas HTTP públicas em leitura, sem redirecionamento local e sem alteração de proxy/firewall. O recibo declara essa limitação. Contagem bnum zero em três sessões curtas não prova RSS/endurance ou homologação física.
