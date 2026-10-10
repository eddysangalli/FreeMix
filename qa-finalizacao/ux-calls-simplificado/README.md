# Calls simplificado — proposta isolada

O operador escolhe o microfone dedicado no topo, prepara os retornos, marca quem recebe sua voz e segura **Segure para falar**. Soltar fecha a concessão do microfone. A mesa usa a mesma seleção `rapidTargets`, persistida por projeto; `null` mantém o comportamento histórico de todos os Calls, inclusive futuros, e `[]` significa ninguém.

Cada convidado tem nome, estado do **retorno** (não comprovação de fala/escuta remota), resumo “vê/ouve” e link para copiar. Vídeo/áudio escolhido ficam em detalhes; fontes aparecem somente em áudio personalizado. Ganho/diagnóstico e TURN ficam em detalhes avançados. Programa conserva a câmera virtual existente; composição/entrada conserva a prévia JPEG existente de até 5 fps. Não foi criado novo transporte.

## Alterações propostas

Quatro arquivos apenas, preservando rotas, ações e formato de estado existentes:

- `painel/remoto/calls.html`: topo compacto, destinos claros, resumo por convidado e divulgação progressiva.
- `painel/remoto/calls.js`: uma seleção canônica com salvamento automático somente em alteração do usuário; pendente/salvo/erro, rollback local, sincronização externa pelo estado e descarte de resposta de projeto anterior. Concessão confirmada, guarda de início pendente e cancelamento de resposta tardia; mouse/teclado/blur/ocultação fecham a concessão própria.
- `ferramentas/calls-producao.mjs`: rollback da seleção em RAM quando persistência falha; rejeição de Call removido; payload com destinos específicos recusado no retorno B compartilhado. Chamador histórico sem payload de destinos continua permitido no B, sem alegação de seleção individual.
- `painel/talkback-rapido.js`: usa a mesma seleção; requer retorno individual preparado, convidado existente e watchdog; explicita configuração/ocupação por outro controle. Nenhuma alteração na mesa, Native ou mistura de áudio.

Os controles duplicados `rapid-apply`, `rapid-all` e `rapid-status` da janela Calls foram substituídos por seleção automática e mensagem de estado. A busca nos fontes originais identificou referências desses IDs apenas no antigo `calls.js`; IDs de mic, rede, talk e ações existentes permanecem. `targets` passou a listar o estado persistido, em lugar da seleção local independente.

## Evidência e limites

- `test/backend-result.json`: **21/21 PASS**, motor proposto com arquivos próprios de persistência e OBS simulado; misturador PCM original com amostras próprias. N-1, seleção de diretor, concessão inválida, Master/faixas 1–5 e monitor protegidos nas chamadas observadas.
- `test/ui-vm-result.json`: **34/34 PASS**, script real em DOM/VM limitado: leitura sem escrita; mudança e falha de seleção; mouse/teclado/blur/ocultação; concessão tardia, heartbeat, projeto anterior, saúde do retorno e mesa canônica.
- Falhas iniciais dos dois harnesses foram preservadas separadamente; eram fixtures, sem resultado de Native.
- `test/browser-result.json`: root revisou via CUA/IAB a página própria, confirmou seleção Ana+Bruno após reload, teclado Espaço por 1,3 s, três heartbeats e parada com lease próprio. Carla ficou desmarcada. O coletor próprio apenas leu eventos/estado HTTP; não realizou essa interação. Captura final em `qa-finalizacao/ux-operacao-20261010/capturas/07-calls-simplificadas.png`. O servidor simula três pessoas, um microfone e as ações; não contém tokens reais, transmissão ou áudio.

Estes testes não provam pointer capture no CEF, áudio físico, VDO.Ninja/WAN, TURN nem convidados ouvindo. `publisher=publishing` indica prontidão local; a UI diferencia retorno conectado de aguarda convidado. O watchdog existente continua a proteção final para perda de rede, com lease de 1,5 s; requisições da UI têm prazo de 5 s. Nenhuma nova garantia de instante de fechamento com rede quebrada foi inventada.

## Revisão e integração

`baseline-pins.json` e a allowlist vinculam a proposta aos quatro hashes originais. Root deve conferir os hashes antes de aplicar os patches. Não aplicar sobre mudanças concorrentes. O produto, operador, Native, Git e pacotes selados permaneceram intactos nesta frente.

Servidor QA próprio: `preview.mjs`; porta efêmera, endereço e PID em `preview-runtime.json`. Mantido até root concluir capturas. O comando `node test/ui-vm.mjs` executa somente VM; `node test/backend.mjs` usa TEMP próprio e remove somente essa raiz após fechar timers. `prepare.mjs` documenta as derivações backend/mesa; HTML/JS da janela são rascunhos autorais presentes, não gerados do nada pelo preparador. `compact-advanced.mjs` registra o ajuste único de ganho para detalhes; não executar novamente sobre o draft atual.
