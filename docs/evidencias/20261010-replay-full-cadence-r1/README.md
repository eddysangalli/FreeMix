# Replay: lacuna VFR real e correção offside

Estado: **reprodução FFprobe real + draft PASS em 33 casos; não integrado**.
Nenhum Native/API/GPU/mesa/áudio/browser foi executado nesta frente. Fixture própria,
CPU FFmpeg/FFprobe com um thread, FFV1/PCM, 320×180, 30 segundos. AL31 anterior intacta.

## Evidência antes/depois

`reproduction-result.json` usa o método `DiskReplay.probe` original congelado.
O clipe late-VFR tem 885 quadros; entre 5–6 segundos há 15 intervalos de 66/67 ms.
Os metadados avg/r_frame_rate dizem 30/1. As janelas originais 0/13/26 s não veem
o intervalo: `variableFrameRate=false`, passo a 5500 ms permitido como se fosse CFR.
O índice integral de PTS, salvo em `fixture/*-pts.json`, prova a diferença.

`draft-test-final-result.json` usa o método real do draft e FFprobe real. Classifica
CFR900 e VFR885/540 corretamente. Late-VFR mantém seek por tempo e recusa passo por
quadro. Preparação dos três clipes: 154/151/122 ms. Cache frio de um clipe e lookup
quente têm tempos registrados no recibo. São arquivos pequenos sintéticos; isso
não certifica latência de 1080p/4K, GPU, imagens renderizadas, sincronismo A/B real,
áudio exclusivo, genlock ou performance geral do Replay.

## Integração restrita proposta

`replay-full-cadence.patch` altera apenas:

- `ferramentas/replay-disco.mjs`: substitui as três amostras por certificação finita
  do clipe salvo, revalida identidade ao hidratar, fecha o scanner em scope/dispose.
- `ferramentas/replay-sincronia.mjs`: passo exige cadência CFR confirmada integral;
  cadência desconhecida/VFR mantém busca por tempo e endpoint conservador.
- Novo `ferramentas/replay-cadence.mjs`: scanner/certificador/cache limitado.

`replay-preview.mjs` é cópia de dependência byte-idêntica, **não precisa integrar**.
Não há alteração de alinhamento coordenado, deadband, mute/gain/AFV dos players,
recorder, Core/API, timeline/UI, Native ou áudio. Novos campos da cadência são dados
de diagnóstico; `unknown` não significa VFR. A UI existente recebe erro explícito
para passo recusado; não há mensagem nova que alegue ter contado imagens no Native.

## Contrato de custo, cache e ciclo de vida

- Só `verifyCadence=true` para player salvo solicita scan. Histórico e proxy
  continuam metadados leves. Seek/tick não recodificam nem decodificam gravação longa.
- Máximo 120.5 s, 29.000 quadros, stdout 4 MiB, 8 s de deadline; CPU threads=1.
  Um scan pendente por owner; pedidos idênticos coalescem, outros recebem `unknown`
  sem fila. Timeout/cancel tenta kill do próprio FFprobe e aguarda close; fallback
  de 2 s limita a espera e mantém job registrado caso o SO não confirme close.
- Close retorna `{quiescent,jobs}`. Os processos reais de QA ficaram quiescentes.
  Uma falha real de reap tem que continuar declarada, não assumir cleanup universal.
  Root deve revisar o tratamento de `quiescent=false` na integração do stop/dispose.
- LRU 32 resumos compactos, sem guardar lista de PTS nem mídia. Identidade inclui
  caminho absoluto, dev/ino, tamanho, mtime/ctime; é invalidação local, **não SHA dos
  bytes**. Arquivos externos não devem ser modificados durante playback. Troca
  observada antes/depois do scan descarta o resultado. Fechamento/geração velha não
  repovoa cache, inclusive corrida durante await de stat.
- PTS finitos/estritamente crescentes, primeiro PTS compatível com start_time,
  cobertura do span e tolerância de cadência anterior (máx. 1.5 ms ou 0.5%) mantida.
  Falta de PTS, dano, orçamento/deadline excedido, clipe maior que limite, rate ou
  start incerto => `unknown`, passo recusado, seek por tempo permitido.
- Imports de até uma hora continuam possíveis; acima de 120.5 s ficam sem passo
  certificado neste contrato. Não inventar tabela de quadros VFR ou relabel CFR.
- Hidratação rescan uma vez os metadados antigos `bounded-decoded-pts`; depois só
  stat. Resultado `unknown` no mesmo arquivo não causa retry em cada tick; recarregar
  o lance solicita nova tentativa. Scope/dispose retiram cache e jobs próprios.

## Provas e falhas preservadas

33 casos cobrem FFprobe real, stdout/deadline/cancel/spawn failure, cache/coalescing,
LRU/clone, identidade/owner/close race, PTS inválidos/prefixo/final ausente, NTSC/PAL,
step sem mutação no modelo, upgrade de metadata antigo, recusa de arquivo longo,
inteireza dos métodos de áudio/alinhamento e sintaxe.
O harness inicial falhou por import-token; preservado sem alteração de produto.
Stage1 encontrou um job fantasma em spawn ENOENT, corrigido no draft. Stage2 falhou
em delimitador do teste de igualdade do método align (não em mídia). Stage3 PASS
31 precede a proteção adicional do prefixo/start; final PASS33 é o aceite do draft.
Não substituir as provas antigas por este recibo e não repetir AL31 automaticamente.

## Próxima prova, somente após autorização Root

Revisar/aplicar patch e closure do novo módulo, depois usar o runner finite-regression
com head/freeze/pins explícitos em clone próprio: imagens A/B no mesmo frame composto
em partida/seek/step/NTSC/VFR, PCM Master exclusivo, EOF e saída limpa. São regressões
do Native real que esta execução CPU não substitui. Para 1080p/4K, medir scan frio,
queda para `unknown` e ausência de bloqueio recorrente; não ampliar deadline/tolerância
sem nova revisão. Estimativa condicionada: integração/revisão 30–60 min; QA Native
finita 30–60 min após freeze próprio disponível, confiança média.
