# Scripts auxiliares

- `inicializacao`: implementação do atalho principal; `Abrir-FreeMix.ps1 -Verificar` confere dependências sem abrir o motor.
- `manutencao`: aplicar atualização com a mesa fechada, preparar kit de servidor e configurar rede por ação explícita.
- `build`: compilação C++ e sincronização de fontes para o GitHub.
- `installer-windows`: fontes e builder do instalador Windows offline.
- `distribuicao/aplicar-fontes-payload.mjs`: aplica fontes canônicas e dependências transitivas de um commit conferido ao payload novo, antes de selar; recusa pacote selado, fontes alteradas e dependências não rastreadas.
- `rea`: atalhos da ferramenta de engenharia reversa preservada.

Para uso normal, prefira os atalhos da raiz.
