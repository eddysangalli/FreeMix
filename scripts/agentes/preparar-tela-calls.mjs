// Makes the isolated work folder for the helper to draft the new Calls window (product source only).
import fs from "node:fs/promises";
import path from "node:path";
const ws = path.resolve(import.meta.dirname, "../.."), repo = path.join(ws, "FreeMix"), work = path.join(ws, "qa-finalizacao/agy-trabalho-tela-calls");
await fs.mkdir(work);
const files = ["painel/remoto/calls.html", "painel/remoto/calls.js", "painel/remoto/controle.js", "painel/remoto/vmix-dialogo.css", "painel/remoto/transmitir.html", "painel/remoto/transmitir.js", "ferramentas/calls-producao.mjs"];
for (const f of files) { const text = await fs.readFile(path.join(repo, f), "utf8"); if (/-----BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}/.test(text)) throw Error("parece conter segredo: " + f); await fs.mkdir(path.dirname(path.join(work, "atual", f)), { recursive: true }); await fs.writeFile(path.join(work, "atual", f), text); }
await fs.mkdir(path.join(work, "novo"));
await fs.writeFile(path.join(work, "PEDIDO.md"), `# Pedido: nova janela de Calls, cópia da tela "Video Call" do vMix

Trabalhe **somente dentro desta pasta**. Não acesse a rede, não execute o produto. Escreva os arquivos novos em \`novo/\`. Responda em português.

## Contexto
Programa de mesa de corte para Windows (FreeMix) operado como o vMix. As janelas de configuração são páginas HTML/JS servidas por uma API local e mostradas dentro do programa. A tela atual de Calls (\`atual/painel/remoto/calls.html\` + \`calls.js\`) é uma página web genérica, com textos longos; o dono quer **a mesma tela do vMix, simples de operar**.

Já existe uma janela refeita nesse padrão, que serve de modelo de código e de visual: \`atual/painel/remoto/transmitir.html\`, \`transmitir.js\` e a folha \`vmix-dialogo.css\` (classes \`vd-*\`: corpo escuro, campos claros, rótulos em negrito alinhados à direita numa coluna, botões na barra escura de baixo; verde = selecionado, vermelho = no ar). **Use essa folha; não crie outro visual.**

## A tela de referência (vMix › Add Input › Video Call)
Tela pequena, de cima para baixo:
1. Dois botões lado a lado: **Hospedar chamada** (selecionado, verde) e **Conectar-se a Chamada**.
2. Linha **Senha**: campo com o número gerado + botões **Copiar** e **Redefinir Senha**. Abaixo, uma caixa escura de aviso de uma linha: o convidado usa esta senha/link para entrar.
3. Título **Sinal de retorno (Para Convidado)** e três listas: **Fonte de vídeo** (Output / Output 2–4 / Nenhum), **Largura de banda do vídeo** (ex.: "Padrão 720p 1200 Kbps"), **Fonte de áudio** (Master, Bus A…G; o convidado nunca se ouve de volta).
4. Caixas **Somente conexão direta ponto a ponto** e **Mostrar opções avançadas**.
5. Também existe no vMix o **Gerenciador de chamadas**: uma lista com uma linha por convidado (nome, estado, botões de áudio/vídeo/desconectar) e **Copiar Link**.

## O que entregar em \`novo/\`
- \`calls.html\` e \`calls.js\` novos, no padrão de \`transmitir.*\`: uma janela com (a) a lista das Calls existentes como botões numerados (como os 1–5 de transmitir), (b) o bloco da referência acima para a Call selecionada, (c) a lista de convidados/estado, (d) barra de baixo com as ações principais.
- **Toda ação precisa ser real**: descubra em \`atual/painel/remoto/calls.js\` e \`atual/ferramentas/calls-producao.mjs\` quais leituras e comandos existem (nomes de ação enviados a \`/api/control\`, campos do estado em \`FreeMixRemote.getState().calls\`, endpoints GET) e use exatamente esses. **Não invente ação, campo ou endpoint.** O que a referência tem e o produto não oferece: deixe de fora e liste em \`NOTAS.md\`.
- Mantenha as proteções que o código atual tem (por exemplo confirmar antes de redefinir senha/link, não repetir comando em caso de timeout).
- \`NOTAS.md\`: (1) tabela "controle da tela → ação/endpoint real → arquivo e trecho de onde tirou"; (2) o que ficou de fora e por quê; (3) dúvidas.

## Regras de código
JavaScript simples no navegador, sem bibliotecas nem build. A página precisa conter \`<span id="connection" hidden></span>\` e \`<p id="message" hidden></p>\` e carregar \`controle.js\` antes do seu script, como em \`transmitir.html\`. Textos da interface em português do Brasil, curtos, iguais aos da referência quando existirem. Sem parágrafos de ajuda, sem assistente em etapas.
`);
await fs.writeFile(path.join(work, "PROMPT-CURTO.txt"), "Leia PEDIDO.md nesta pasta e faça exatamente o que ele pede: leia os arquivos de atual/, escreva calls.html, calls.js e NOTAS.md em novo/. Trabalhe somente dentro desta pasta; não execute comandos nem acesse a rede. Ao terminar, responda em português com um resumo de 10 linhas do que escreveu e do que ficou de fora.\n");
console.log(JSON.stringify({ work, files: files.length }));
