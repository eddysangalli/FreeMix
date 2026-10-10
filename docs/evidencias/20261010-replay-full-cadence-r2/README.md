# Replay r2: retirada confirmada e start explícito

**Draft somente, PASS26 modelos/sintaxe, não integrado.** Nenhum Native/API/FFprobe,
FFmpeg/GPU/browser/áudio/AV foi executado. AL27 e mídia original intocadas. O PASS33
FFprobe real do r1 continua prova do classificador original; não é reexecução r2.

## Delta contra r1

Somente `replay-disco.mjs` e `replay-cadence.mjs`. `replay-sincronia.mjs` e
`replay-preview.mjs` são dependências copiadas byte-idênticas ao freeze anterior.
`delta-r2.patch` é contra AL27. `combined-from-canonical.patch` contém r1+r2
contra as fontes canônicas que ainda eram os baselines verificados, para Root
integrar em série após revisão; nenhum script aplica produto.

## Scope e propriedade do processo

`cadenceScanner()` é o único factory. Não cria outro scanner quando o owner atual
está closed/retiring nem durante/depois de disposal. `retireCadence()` fecha o owner
capturado e exige **quiescent=true, jobs=0 e nenhum job registrado**. Recusa/throw/
resultado ausente/inconsistente mantêm `cadenceProbe` e `cadenceRetiring`, gravam
`cadenceFault={code,jobs}` e rejeitam com `REPLAY_CADENCE_NOT_QUIESCENT`. Mensagem
controlada, sem caminho de mídia nem stderr privado. Nunca interpreta kill como exit.

`scopeState()` lê o arquivo seguinte em variáveis locais. File/state/scope e campos
de Program/alinhamento só são substituídos depois da retirada confirmada e da
segunda checagem de disposal. Na falha, os valores anteriores ficam intactos.
Quando o child realmente fechar mais tarde, outra chamada a close consulta **jobs
atuais**, não reaproveita o antigo false; só então uma nova transição pode liberar a
referência. Owner antigo permanece fechado e nunca decodifica outra geração.

## Dispose e callers canônicos

`dispose()` marca disposing imediatamente, compartilha o trabalho concorrente,
executa fechamento de preview e cadência mesmo se um deles rejeitar/throw, espera
ambos por allSettled e **rejeita a falha**, sem marcar disposed=true. Referência
ao owner não quiescente permanece. Tentativa explícita posterior pode confirmar o
close tardio e terminar; ela nunca reabre esse controlador para operação.

O `servidor-api.mjs` atual chama replay/iso.dispose().catch(connectionError) em
stop. Esse catch passa a receber a rejeição real. O arquivo não foi alterado.
Esse stop continua fire-and-forget: esta revisão não afirma que o servidor espera
todos os componentes/Native ou que o encerramento geral tem prova nova. O child
retido pode manter o Node vivo; erro deve continuar observável até close real.

Guardas de command/queue/scope/hydrate/probe bloqueiam novas preparações e impedem
que metadata/scan concluídos depois de dispose continuem como load válido. Isso
não é uma reescrita transacional de todos os comandos Native já em voo nem do REC;
esses ciclos existentes continuam fora do escopo. Metadata-only tem o deadline
legado de 15 s; scanner segue 8 s + no máximo 2 s de espera bounded pelo próprio job.
Não houve relaxamento de cadência, frame-step, render, áudio, cache ou limites.

## Start desconhecido

O scanner/classificador não têm mais default videoStart=0. Em verifyCadence, o
método real de probe passa valor numérico somente quando start_time é número ou
string não vazia; ausência/null/blank/bool tornam start incerto => unknown, **sem
scan**, passo recusado e busca por tempo permitida. Zero explícito continua válido.
N/A/Infinity que já invalidavam a duração no metadata legado continuam recusados.
O campo legado videoStart retornado nos metadados gerais não foi redefinido; ele
não serve como evidência de certificação quando cadence.status é unknown.

## Testes e preservação

`model-final-r2-result.json`: PASS26. Modelo unreaped/close tardio, throwing e
indeterminate close, propriedade durante pending close, scope read failure e
imutabilidade, disposal concorrente/preview throw/cancel/resultado tardio,
command pendente, start ausente/zero/N/A, scan antes/apos disposal, guards canônicos
e sintaxe. Nenhum modelo foi apresentado como comportamento do SO/Native real.
Falha inicial do harness: JSON.stringify(Infinity) virou null; expectativa de
rejeição era inválida. Foi preservada e substituída por a string JSON 'Infinity'.
PASS24 anterior preservado; final PASS26 adiciona guards de conclusão/throw síncrono.

Depois de revisão Root, aplicar closure/deltas e usar clone/head/pins explícitos
na futura regressão Native preparada. Antes disso não afirmar shutdown geral,
imagem sincronizada, áudio exclusivo ou integração do patch como entregues.
