# FAIL preservado — RGB recebido no CEF27

O wire trouxe vermelho, azul e RGB assimétrico exatos. O teste do canvas receptor registrou119 amostras pretas no início e apenas43 vermelhas; por isso falhou no critério pré-declarado.595 quadrosRTC decodificados e548 callbacks não substituem prova de cor.

Há duas hipóteses de harness ainda não confirmadas: ROI fixa320,180 pode cair fora de uma resolução inicial adaptativa320x180 do RTC; mensagens de fase posteriores ao screenshot deixam um intervalo após troca de cor. Não foram alterados limites nem repetido o ensaio para aprovar. A investigação deve registrar dimensões reais/alpha e transições finitas, distinguindo a medição de um defeito do produto.

Native12684 fechou cooperativamente: contador0/Meter0/remaining0/double0/crash0.24 textos,7 helpers e2085 arquivos Native de origem e destino foram verificados depois. Nenhum operador, PCM, VDO ou instalador selecionado foi alterado.
