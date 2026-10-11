# App36 R4e: abrir as telas não dispara comando nenhum — PASSOU em execução real

Ensaio de 10/10/2026 à noite (23:15–23:21, horário local), motor Native36 (`e81afe7`) com o painel e as ferramentas do repositório no commit `e801f0e`, em instalação própria de teste. A mesa do operador não foi tocada.

## O que foi provado

1. **Abrir e deixar abertas as cinco telas não envia comando ao programa.** Mesa, Externo/SRT, MultiStream, Calls e Configurações do Replay ficaram abertas e consultando o programa por 60 segundos. Os quatro contadores vigiados ficaram exatamente iguais aos de antes de abrir:

   | contador | antes de abrir | depois das consultas HTTP | depois das telas + 60 s |
   |---|---|---|---|
   | `run` (macros/automação) | 0 | 0 | 0 |
   | `execute` (comandos) | 1 | 1 | 1 |
   | `journal` (diário da sessão) | 2 | 2 | 2 |
   | `mutatingReq` (pedidos de escrita ao motor) | 19 | 19 | 19 |

   Só as leituras cresceram (`refresh` de 6 para 101). Configuração, áudio, Programa e Preview continuaram iguais. O `1` e os `19` de antes de abrir são a ligação dos barramentos de áudio na partida (`audio_enable`), conferida pelo nome no ensaio.
2. **Preview e Cut pelo controle funcionam e são confirmados pelo motor:** Preview em 90 ms e Cut em 165 ms (pedido + leitura de volta). Repetir o mesmo Cut é respondido do cache, sem cortar de novo.
3. **Salvamento automático só depois de mudança.** Durante os 60 s sem mexer em nada, nada foi salvo (era isso que reprovava o R3). Depois de uma mudança real (etiquetas de uma entrada), a sessão foi salva sozinha. O ponto de salvamento manual (`recovery_checkpoint`, o mesmo que o botão da tela de Recuperação envia) respondeu 200 e gerou versão nova.
4. **Fechou limpo:** API encerrou com código 0, o programa aceitou o pedido de fechar e saiu; log com 0 vazamentos de memória, 0 avisos de medidor, nenhum crash; os 2085 arquivos do motor e os módulos do painel conferidos por hash depois do fechamento. Nenhum processo ficou para trás.

## Como se chegou aqui (três defeitos do próprio roteiro de teste)

As rodadas R4, R4b e R4c do dia 10 falharam antes de abrir qualquer tela. As causas estavam nos arquivos de teste escritos para a R4, não no programa:

- **R4c:** exigia contadores zerados em valor absoluto na linha de base, embora a partida do áudio sempre gere 1 comando e 19 escritas (a R3 não tinha essa exigência). Corrigido na R4d: o critério voltou a ser o de sempre — **zero incrementos** depois da linha de base — e a partida passou a ser conferida pelo nome do comando.
- **R4c (limpeza):** o processo da API de teste não conseguia terminar sozinho porque o arquivo perdeu um `process.disconnect()` que a R3 tinha; a limpeza estourava o prazo e deixava processos vivos. Corrigido na R4d, junto com janelas de tempo separadas para fechar a API e o programa.
- **R4d:** passou por tudo acima e parou no salvamento manual: o teste pedia a ação `checkpoint`, que não existe no produto (HTTP 400); a ação é `recovery_checkpoint`. O recibo da R4d continua FAIL, guardado aqui (`receipt-r4d.json`). Corrigido na R4e.

Nenhum critério foi afrouxado: as duas checagens de zero incrementos e a checagem de tráfego de *defaults* estão iguais; saiu apenas a exigência contraditória. O Gemini (Antigravity CLI) revisou as mudanças da R4d antes da execução e não apontou problema (`gemini-review-of-r4d-changes.txt`).

## O que mudou no modo de fazer

As cinco telas foram abertas por script num navegador real (Microsoft Edge sem janela, perfil próprio, controlado pelo protocolo DevTools — `root-browser.mjs`), que salva um retrato de cada uma e as mantém abertas até o fim. Antes isso era feito à mão no navegador do Codex. As imagens `r4e-*.jpg` foram vistas uma a uma antes de liberar a prova. O que o navegador observou (pedidos, erros) está em `browser-observations-r4e.json`: nenhum erro de página; o único 404 é `/favicon.ico`; as recusas de conexão do fim são as telas consultando depois que a API de teste já tinha fechado.

## O que esta prova não cobre

- É a combinação Native36 + painel `e801f0e` montada só para teste. **Ainda não é um instalador novo.**
- Telas dentro do próprio programa (CEF), ordem das janelas no Windows, GPU, áudio real, Calls com convidados, WAN e equipamentos não entram aqui.
- Não houve transmissão, gravação nem dispositivo aberto.
- Retratos mostram que as páginas carregaram com o programa real; não são aprovação de desenho pelo dono.

Arquivos: `RESULTADO.json` (resumo), `receipt-r4e.json` e `receipt-r4d.json` (recibos completos), `derivation-*.json` (o que mudou em cada rodada, texto antigo e novo), `ARQUIVOS.json` (origem e hash de cada cópia).
