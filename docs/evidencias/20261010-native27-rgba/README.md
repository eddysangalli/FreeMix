# Correção RGBA Native27 — prova real limitada

A captura SDR BGRA declarava RGBA e trocava vermelho/azul. A correção mínima declara BGRA no staging e mantém a conversão real para RGBA. Commit Native c4b5af00ea4a4b744a3a19fef5ec861f693c9a69; build completa congelada em2085 arquivos.

Duas fontes30fps passaram:601 quadros cada em20s, com RGB assimétrico exato no wire versus settings/PNG público. A segunda continuou até754 após parar a primeira. Alpha opaco, PTS e sequência válidos, dois retires sem fault. Native214948 fechou cooperativamente: contador0/Meter0/remaining0/double0/crash0; arquivos2085 conferidos depois do fechamento. Root inspecionou o PNG próprioB vermelho.

FAIL Native25 preservado na evidência anterior. A frase Native25 no primeiro check do runner é um texto herdado; pins/vendor confirmam Native27. Não foi repetida toda a matriz antiga. Não comprova ainda CEF, convidados/VDO, PCM/N-1, sincronismo A/V, WAN ou hardware. O instalador selecionado600/Native24 e a instalação do operador permanecem intactos.
