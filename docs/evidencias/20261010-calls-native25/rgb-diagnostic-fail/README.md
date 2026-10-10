# FAIL preservado — fidelidade RGBA Native25

Duas fontes30fps receberam598 quadros cada. A segunda continuou até750 depois da parada da primeira; parser/PTS/sequência/alpha/fault continuaram válidos. A captura pública PNG da mesma fonteB é vermelha; o transporte declaradoRGBA entregou[35,51,200,255], azul. A primeira também não permite concluir fidelidadeR/B apenas por ser verde.

Root e agente observaram a imagem própria vermelha por view_image. Causa localizada nas fontes: stagingSDR BGRA, AUX declaradoRGBA sem conversão, passagem de bytes BGRA. Correção mínima está em preparação, ainda não qualificada em Native/receptor. As provas anteriores de throughput e três cores não qualificam fidelidadeRGB. Nenhum ensaio foi repetido para ocultar FAIL. Native108996 fechou cooperativamente, contador0/Meter0/crash0.
