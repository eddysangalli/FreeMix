# Reset de mídia: getter retido e barreira complementar

Recomendação para revisão do Root: aplicar somente os três patches em `retained-r2/patches`, após conferir `retained-r2/TARGETS.json`. Nenhum fonte canônico foi alterado, Native compilado ou processo iniciado nesta frente. A variante de cache em `draft/` e a primeira retenção em `retained-variant/` são comparação histórica, NÃO aplicar junto.

O resultado real Native32 continua `OBSERVATION_COMPLETE`, `fullFTBPass=false`, legado `FAIL_UNCHANGED_CRITERION`. `observation-samples.json` preserva todas as195 amostras da leitura original e seu SHA. Encerramento/pins/PCM que o Root comprovou não aprovam FTB geral.

## Causa demonstrável em fonte

- `media.c:326` `get_base_pts` lê o maior `next_pts` de áudio/vídeo. `decode.c:407` calcula `next_pts=frame_pts+duration`; `decode.c:420` zera-o no flush.
- `media.c:631` reset invalida timestamp, avança epoch, busca/prepara frames e conclui o request. Frame0 preparado possui próximo PTS≈33ms, mas ainda não foi submetido. `presented_valid` fica false e `resetReady` também.
- `media.c:1107` GET lê validade sob mutex, depois lê decoder `next_pts` fora dele. Esses escritores não usam o mesmo mutex. Há um read race concreto, independente da explicação determinística da amostra33.
- O primeiro frame novo chama `remember_presented_pts(0)` antes do callback. Por isso0 é PTS de submissão, sem confirmação de callback, CEF, textura ou tela física.
- `RequestHandler_MediaInputs.cpp` lê cursor antes de consultar o clock. São duas leituras; pareá-las como um snapshot atômico é incorreto.

Na captura houve uma mudança de epoch e um RESTART: epoch1/1634 submetido → epoch2/33 fallback inválido, submitted antigo1668 → epoch2/0 submetido válido. Esse encadeamento é compatível com os caminhos acima; não é evidência de um segundo RESTART. Não atribuímos todos os FAIL históricos ao mesmo motivo.

## Patch recomendado: retenção com validade separada

`media.h`: campo interno `last_valid_submitted_pts`, zerado pelo `memset` já existente. `media.c`: atualizar esse campo somente quando `pts>=0`, no mutex existente de `remember_presented_pts`; getter copia-o e copia `speed` no mesmo mutex. Não lê decoder. Reset mantém último PTS válido; primeiro novo frame válido publica seu próprio PTS. PTS negativo mantém último válido, ou0 sem submissão anterior.

`obs-ffmpeg-source.c`: dado inválido recebe `timestampSource=invalid-submitted-source-pts`, e política aditiva `legacyCursorPolicy=retain-last-valid-submitted-or-zero-while-invalid-v1`. O `submittedCursorMs` continua inválido quando `presentedValid=false`, incluindo um possível PTS negativo. Ele não é o cursor retido nesse caso. Versão1 permanece para os campos válidos existentes; o consumidor estrito que exige o enum antigo `decoder-base-fallback` precisa revisar esse enum/política explicitamente. O antigo harness de observação não está automaticamente compatível com o novo rótulo. Isso não altera limiares do oracle legado.

Getter inicial retorna0; reset/buffering retêm valor antigo até submissão válida. Isso pode parecer posição parada e precisa ser acompanhado do clock inválido/reset-pendente, nunca rotulado imagem nova. Conversão de speed não muda; speed é configurado antes do worker e não há writer dinâmico inspecionado. Não há espera, callback, seek, flush, clock, decode ou timestamp de saída novo. Não há mudança em `mp_media_free`/vida da fonte; consumidor continua obrigado a possuir a referência enquanto consulta. A estrutura interna cresceu: rebuild coerente da biblioteca e plugin é obrigatório, sem sobrepor só uma DLL ao binário antigo.

| Caso | Contrato proposto / limite |
|---|---|
| Init / callback ausente |0, sem afirmar prontidão |
| Reset | Último válido retido; primeira submissão nova produz um recuo, sem fallback futuro33 |
| Seek / pausa | Caminhos intactos; última submissão até callback/preload/seek publicar outra; não assume que seek sempre invalida o clock |
| Áudio sem vídeo | Usa hook de áudio existente; sem afirmação de som físico |
| Speed1/50/100/200 | Mesma conversão inteira; leitura conjunta, sem suporte novo a mudança dinâmica |
| VFR / NTSC / início nãozero | Não normaliza PTS nem inventa frame0; primeiro PTS real é mantido. Barreira baixa≤250 pode legitimamente recusar fixture com início maior |
| PTS negativo | Não substitui último timestamp válido pelo negativo; validade bruta permanece false |
| EOF / loop / preload | Retém até callback; preload pode publicar0. Novo epoch/loop adicional é rejeitado pela captura finita |
| Reconnect | Nova geração/inicialização começa0; barreira recusa assumir continuidade |
| Full-decode cache | `media-playback.c` usa getter de cache separado; não há homologação desse caminho |

## Barreira adicional: contrato próprio, sem trocar o legado

`reset-ready-clock-contract.mjs` é proposta pura. Captura UUID/conexão/generation/epoch/request ANTES de exatamente um RESTART; espera target request+1 e epoch+1 exatos, completed igual, `presentedValid/resetReady=true`, sem pending/progress. Posição vem exclusivamente do clock coerente `submitted-source-pts`, não do cursor legado pareado depois. Registra TODOS os samples; pre-reset/fallback ficam pendentes. Depois de armar, voltar a inválido, retroceder PTS, mudar fonte/conexão ou reset adicional falha sem retry.

Conserva as condições de progresso do oracle antigo (baixo≤250, salto≥1000, avanço≥1000, parede≥750, pelo menos2 avanços, erro<250ms), além do limite de201 samples/10s da observação. Só speed100 e mídia playing longa são qualificados para esse contrato de captura. Pausa não gera falsa prontidão.

Os19 modelos passaram. O oracle legado ORIGINAL reproduziu seu FAIL nas195 amostras. A projeção de getter retido sobre essas amostras passa pelo MESMO oracle, sem editar sua fonte/limiares: é previsão de modelo, NÃO Native novo executado. A análise offline complementar fica separada e não substitui a reprovação. Dois erros de fixtures/modelo de linguagem foram preservados em JSON próprios; critérios e dados originais intactos.

Root precisa revisar política/enum, recompilar conjunto coerente e executar UMA observação isolada novamente após autorização, guardando todas as amostras e o oracle legado intacto. Pixels, áudio, EOF/pausa/reconnect/NTSC e lifecycle permanecem provas reais futuras; nenhuma qualificação FTB/interface/saída foi ativada aqui.
