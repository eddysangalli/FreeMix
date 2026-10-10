# LocalVocal cumulativo R3: build real; qualificação pendente

Root compilou offline o plugin0.6.2 + shutdown + governança de catálogo/modelos + RAII do callback + lifecycle. Configure0/build0, DLL1240064 SHA 5aa7f14d9dd01c8d110eb86bf42e5f50b2a1070e6dcb7d92bc7b27e97bf45b4f; PDB hash no recibo. Ferramentas/imports SDK iguais antes/depois. Catálogo805 SHA fff3925a6a49cfed5a1901d1af54e60b666552da2ab4354f35b243c54588dc5b.

31 modelos de lifecycle passaram no Root; destrutor/C++members, deque whisper e callbacks frontend agora possuem descarte explícito. Cloud permanece desabilitado. Correção de defeitos concretos não atribui todas as35 alocações anteriores nem comprova encerramento real. A primeira extraçãoR2 recusou symlinksUnix; R3 omitiu somente sete nomes/payloads fixados, sem seguir links, preservando FAIL e alvos regulares.

Não instalado no operador, não aplicado ao Setup600, sem novo instalador. QA32 com a tuple explícita está em preparação/execução separada; transcrição, recusas, latência e encerramento ainda exigem recibos reais. Política offline de build não é captura de tráfego; nenhuma afirmação de ausência de rede foi inferida só dos logs.

Atualização após execução: [Qualidade32 R4](../20261010-quality32-r4-and-app32-r2/ROOT-README.md) confirmou transcrição portuguesa sintética3/5 e remoção dos filtros seguida de fechamento ordinário exit0/alloc0/crash0 nesta DLL. Shutdown com filtro vivo e cancelamento efetivo em voo permanecem sem prova;17 casos negativos continuam pendentes. R4 geral permanece FAIL por RNNoise1,0358dB<3, sem atribuir todas as35 alocações antigas a uma causa.
