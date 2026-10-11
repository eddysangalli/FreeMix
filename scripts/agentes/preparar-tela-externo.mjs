// Makes the isolated work folder for the helper to draft the new External outputs window (product source only).
import fs from "node:fs/promises";
import path from "node:path";
const ws = path.resolve(import.meta.dirname, "../.."), repo = path.join(ws, "FreeMix"), work = path.join(ws, "qa-finalizacao/agy-trabalho-tela-externo");
await fs.mkdir(work);
const remoto = (await fs.readdir(path.join(repo, "painel/remoto"))).filter((f) => /^saidas.*\.(js|html)$/.test(f)).map((f) => "painel/remoto/" + f);
const files = [...remoto, "painel/remoto/controle.js", "painel/remoto/vmix-dialogo.css", "painel/remoto/transmitir.html", "painel/remoto/transmitir.js", "painel/remoto/calls.html", "painel/remoto/calls.js", "ferramentas/saidas-producao.mjs", "ferramentas/ndi-producao.mjs", "ferramentas/saidas-sdi.mjs", "ferramentas/saidas-srt.mjs"];
for (const f of files) { const text = await fs.readFile(path.join(repo, f), "utf8"); if (/-----BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}/.test(text)) throw Error("parece conter segredo: " + f); await fs.mkdir(path.dirname(path.join(work, "atual", f)), { recursive: true }); await fs.writeFile(path.join(work, "atual", f), text); }
await fs.mkdir(path.join(work, "novo"));
await fs.writeFile(path.join(work, "PEDIDO.md"), `# Pedido: nova janela "Externo" (saídas externas), no padrão das telas do vMix

Trabalhe **somente dentro desta pasta**. Não acesse a rede, não execute o produto. Escreva os arquivos novos em \`novo/\`. Responda em português.

## Contexto
Programa de mesa de corte para Windows (FreeMix) operado como o vMix. As janelas de configuração são páginas HTML/JS servidas por uma API local e mostradas dentro do programa. A tela atual de saídas externas (\`atual/painel/remoto/saidas.html\` + \`saidas.js\` + \`saidas-*.js\`, aberta com \`?context=external\`) é uma página web grande, com abas, textos longos e muitos campos; o dono quer **uma janela pequena, igual às do vMix, simples de operar**.

Já existem duas janelas refeitas nesse padrão, que servem de modelo de código e de visual:
- \`atual/painel/remoto/transmitir.html\` + \`transmitir.js\` (Configurações de streaming);
- \`atual/painel/remoto/calls.html\` + \`calls.js\` (Chamada de Vídeo);
- folha \`vmix-dialogo.css\` (classes \`vd-*\`: corpo escuro, campos claros, rótulos em negrito alinhados à direita numa coluna, botões na barra escura de baixo; verde = selecionado, vermelho = no ar, âmbar = atenção). **Use essa folha; não crie outro visual.** Se precisar de uma classe nova, liste-a em NOTAS.md em vez de criar CSS solto.

## A referência (vMix)
- Botão **External** da barra de baixo com engrenagem. A engrenagem abre: Output 2 / Output 3 / Output 4 (cada um escolhe a fonte: Output, Preview, MultiView, Input N…), e os itens "Outputs / NDI / SRT Settings" e "External Output Settings".
- **Outputs / NDI / SRT**: quatro linhas, Saída 1 a 4. Em cada linha: a fonte de vídeo (Output / Preview / MultiView / entrada), a fonte de áudio (Master / barramento), botão NDI liga/desliga com engrenagem (nome do emissor, alfa), botão SRT com engrenagem.
- **External Output**: dispositivo (câmera virtual ou placa), tamanho/quadros, áudio, canal alfa.

## O que entregar em \`novo/\`
\`externo.html\` e \`externo.js\`, no padrão de \`transmitir.*\` / \`calls.*\`, largura 700 px, com:
1. Botões numerados **1 a 4** no topo (como os de transmitir): cada um é uma saída de rede; quadradinho vermelho quando está enviando.
2. Linha **Tipo**: dois botões lado a lado **NDI** e **OMT** (verde = o escolhido), se o motor oferecer os dois.
3. Para a saída escolhida: **Fonte de vídeo** (Saída (programa) ou uma entrada da mesa), **Fonte de áudio**, **Nome na rede**, **Grupos** (só NDI), caixa **Canal alfa** e o que mais o motor aceitar de verdade para esse envio. O que for raro (precisão PA16, Fill+Key, nome do Key) fica atrás de **Mostrar opções avançadas**.
4. Linha **Câmera virtual**: estado + botão Ligar/Parar. Linha **Tela cheia**: botões para abrir a janela de tela cheia de Saída / Preview / (o que o motor oferecer) e de uma entrada escolhida.
5. Tabela **Ver Status** (como em transmitir): uma linha por saída 1–4 de cada tipo que estiver configurada ou enviando: tipo, nome, fonte, estado.
6. Barra de baixo: **Iniciar tudo / Parar tudo**, **Começar N / Parar N**, **Ver Status**, e à direita **Avançado** (leva para \`/saidas?context=external&transport=<tipo>\`, o editor completo, que continua existindo para SDI/DeckLink e SRT/RIST) e **Salvar e Fechar**.
- Saída que está enviando não pode ser editada (campos travados; o botão vira "Parar N" vermelho), como em transmitir.
- **Toda ação precisa ser real**: descubra nos arquivos de \`atual/\` quais leituras e comandos existem (ações enviadas a \`/api/control\`, o que \`GET /api/outputs\` e \`GET /api/settings\` devolvem, campos de \`FreeMixRemote.getState()\`) e use exatamente esses, com os mesmos nomes de campo. **Não invente ação, campo ou endpoint.** O que a referência tem e o produto não oferece: deixe de fora e liste em NOTAS.md. Nada de botão desabilitado "de enfeite".
- Abrir a janela **só lê**; nenhum comando é enviado sem clique.
- Listas (\`<select>\`, tabelas, grupos de caixas) só podem ser reescritas quando o conteúdo muda (veja o \`fill()\` de calls.js), para não fechar uma lista aberta.
- \`NOTAS.md\`: (1) tabela "controle da tela → ação/endpoint real, com os campos enviados → arquivo e trecho de onde tirou"; (2) o que ficou de fora e por quê; (3) dúvidas.

## Regras de código
JavaScript simples no navegador, sem bibliotecas nem build. A página precisa conter \`<span id="connection" hidden></span>\` e \`<p id="message" hidden></p>\` e carregar \`controle.js\` antes do seu script. Evite nos seus elementos os atributos \`data-preview\`, \`data-action\`, \`data-media\`, \`data-mute\`, \`data-monitor\`, \`data-route\`, \`data-gc\`, \`data-team\`, \`data-iso\`, \`data-volume\` e os ids \`media-select\`, \`speed\`, \`loop\`, \`autonext\`, \`seek\` (o controle.js reage a eles). Textos da interface em português do Brasil, curtos. A palavra "OBS" não pode aparecer na tela. Sem parágrafos de ajuda, sem assistente em etapas.
`);
await fs.writeFile(path.join(work, "PROMPT-CURTO.txt"), "Leia PEDIDO.md nesta pasta e faça exatamente o que ele pede: leia os arquivos de atual/, escreva externo.html, externo.js e NOTAS.md em novo/. Trabalhe somente dentro desta pasta; não execute comandos nem acesse a rede. Ao terminar, responda em português com um resumo de 10 linhas do que escreveu e do que ficou de fora.\n");
console.log(JSON.stringify({ work, files: files.length }));
