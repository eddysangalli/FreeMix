# Atalho do workspace original

Estes dois arquivos são as fontes do atalho usado na máquina de desenvolvimento. Copie ambos para a raiz de um workspace que tenha obs-vmix/ (instalação portátil) e entregas/ULTIMA-ATUALIZACAO.json (pacote incremental assinado). Eles não substituem FreeMix Studio.cmd de um portátil extraído.

O atalho preserva a mesa aberta. Depois do fechamento normal, verifica assinatura/hashes, identifica as APIs da própria instalação nas portas configurada/padrão/fallback e para somente processos confirmados por identidade e caminho de runtime. Aplica com backup e inicia motor/API juntos. Serviços de outra instalação e vMix são preservados. A identificação de APIs extras corrigiu o bloqueio observado com duas APIs locais após fechar o motor.
