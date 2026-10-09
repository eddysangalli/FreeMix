# Continuidade do FreeMix

Atualizado em 2026-10-09T22:58:34.923Z. O trabalho autorizado até terça-feira, 13/10, permanece ativo. Preservar a mesa, vMix, Calls, gravações e saídas do operador. Todos os testes usam cópias TEMP e portas próprias.

## Entrega disponível

O instalador completo verificado é **0.1.0-local.20261009213415**, selecionado por entregas/INSTALADOR-ATUAL.json e INSTALAR-FREEMIX.cmd. EXE real instalado duas vezes, importação de projeto/diagnósticos/desinstalação conservadora e startup Native passaram. Credenciais novas, dependências/NDI e coleta ZIP local estão incluídas. Não afirmar que ele contém alterações feitas depois de 213415.

ABRIR-FREEMIX.cmd continua associado à instalação do operador e ao atualizador incremental anterior. Não apontar esse atualizador para um pacote completo nem aplicar DLLs com o operador aberto. A ponte nativa SRT→NDI alpha está entregue como beta separado; o receptor alpha WebBrowser foi abortado e não deve ser retomado.

## Fontes e próxima versão

Git do produto: FreeMix, branch feat/native-menus-config-screens. Último push confirmado: 583ac9d. Native: fb98b14c071fa89146f74dc8c26157c2ce9026ee, série de 19 patches com árvore verificada e 177 snapshots. Não houve push para o upstream OBS. O número 0.1.0-local.20261009223334 está reservado para fontes/candidato, ainda sem instalador aprovado.

A build completa do Native 19 passou. Usar exclusivamente qa-finalizacao/native-build-frozen-fb98b14 para QA e futuro empacotamento; o rundir de trabalho pode mudar durante builds. O pacote completo anterior continua imutável.

| Frente | Estado confirmado | Próximo passo |
|---|---|---|
| SRT | Native 19: 11 capturas, packed420/444, Fill/Key, alpha/chroma, seeks, PCM no Fill, Key silenciosa e PTS crescentes; reconexão/stop-start e fechamento exit0. | Integrar guia de áudio e repetir no novo instalador; WAN/vMix físico continuam separados. Master segue o Programa; bus independente seleciona o áudio da fonte própria. |
| SDI HDR | Compilação/contratos RGB10/metadados passaram; seis guards negativos do Native 19 e mensagem de driver passaram, sem crash. | Placa/driver não inicializam nesta máquina: sinal físico/capabilities do hardware inconclusivos. Não declarar HDR físico homologado. |
| Replay | Reprodução A/B: 111 capturas visuais com diferença até um quadro; 90 s sem correções periódicas. PCM direto preMaster em 30/50/100% e 91 s contínuos passaram. NTSC, VFR e restart off-air após EOF passaram; um cenário EOF encerrou exit0 em 947 ms. | A fixture completa ignorou a resposta de recusa do shutdown com saídas QA ainda ativas; não há prova de hang Native nesse recibo. FAIL do harness preservado; a limpeza/fechamento é repetida com resposta conferida. Agente fecha matriz/allowlist antes de integrar JS e selar candidato. |
| Janelas | Nove rotas HTTP do instalador 213415 passaram; isso não prova abertura/renderização das nove janelas CEF. | Agente agora verifica open_panel/close_panel, DOM/erros e saída normal com API real em cópia própria. |
| Alocações | Mesmo conjunto 159 binários do 213415: saldo 2 em Native direto, launcher e Native+API; saídas cooperativas e nenhum crash. | QA clone99 com instrumentação exclusiva/PDBs está em build; contador não identifica sozinho origem, tamanho ou crescimento. Macro não entra no produto. |

## Donos e integração

- auditoria_pendencias_reais: replay-disco.mjs, multicâmera/VFR/áudio/EOF/encerramento em QA isolada; não espelhar JS sem allowlist final.
- transportes_rede_conclusao: SRT/SDI Native19 concluídos; agora conferência de janelas CEF. Allowlist SRT/SDI 71c6764c… já espelhada pelo root com hashes e normalização de EOF registrada.
- installer_exe: rastreamento de alocações em clone TEMP99; build própria, parallel2, sem tocar cache comum, pacotes ou mesa.
- Root: espelhos/Git, dependências/licenças, documentação atual, pacote novo assinado/ZIP/EXE e conferência da instalação. Só selar depois das verificações aplicáveis; preservar recibos FAIL e versões anteriores.

## Recursos externos

ASIO/Direct Out, SDI/Fill+Key/HDR, controladores/PTZ e monitores precisam de equipamentos. Bonding WAN requer VPS e duas conexões reais; HTTPS/TURN requer domínio/DNS/servidor. NDI envio HDR requer Advanced SDK/licença. Windows limpo e Calls externas precisam de ambientes/convidados. Nenhum serviço foi publicado nem logs enviados automaticamente.

Ver PENDENCIAS-REAIS.md para critérios e prazos de ensaio após disponibilidade. Não prometer concluir homologação física/WAN sem esses recursos.

## Referências

- ENTREGA-ATUAL.md e INSTALACAO.md: entrega e uso do instalador.
- PENDENCIAS-REAIS.md e PLANO-CONCLUSAO-20261013.md: escopo, limites e próximos passos.
- RELATORIO-SRT-POS-SEEK-NATIVE19-20261009.md: SRT e SDI do conjunto atual.
- FONTES.md / BUILD-FROM-SOURCE.md: patches, reconstrução e exportação verificada.
- historico/CONTINUAR-20261009-224131.md: cronologia antiga preservada; não usar números/builds antigos como estado atual.
