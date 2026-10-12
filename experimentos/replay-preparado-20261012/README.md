# Replay preparado — bancada do Root

Status: **experimental, fora do produto e do instalador**. Código correspondente em ../../../../experimentos/replay-preparado-20261012; não copiar manualmente para a mesa.

Esta evidência cobre mídia sintética criada e decodificada por FFmpeg/FFprobe aprovados, com originais preservados e processos próprios encerrados. `playlist-real.json` e `curves-real.json` contêm resultados efetivamente medidos; arquivos `*-post.json` registram confirmação CIM e pins. CPU/mocks não são prova de Native ou hardware.

CUT/FADE é um único arquivo preparado; curva de velocidade exige silêncio explicitamente confirmado. H264 CRF18 reencoda e não garante ausência de perdas. Ainda faltam integração de interface/controlador, QA nativo, latência e endurance. Os testes sintéticos usam64x64/30fps e saída da playlist320x240/30fps; não medir1080p59.94 a partir desta bancada.

Falhas originais mantidas no ambiente próprio: worker R1 enum de recusa, curva R1 fixture do Root com duração incorreta e curva R2 inspeção RGB sem capacidade tipada. R2/R3 posteriores preservam os critérios e usam capacidade de inspeção restrita, sem liberar saídas arbitrárias.