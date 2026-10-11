// Makes an isolated work folder for the helper with a set of fork patches (product source only) and a review request.
//   node preparar-revisao-patches.mjs <nome> <primeiro> <ultimo>     e.g. revisao-native-a 25 26
import fs from "node:fs/promises";
import path from "node:path";
const [name, first, last] = process.argv.slice(2);
if (!/^[a-z0-9-]{3,40}$/.test(name || "") || !(Number(first) >= 1) || !(Number(last) >= Number(first))) { console.error("uso: <nome> <primeiro> <ultimo>"); process.exit(1); }
const ws = path.resolve(import.meta.dirname, "../.."), fork = path.join(ws, "FreeMix/fork"), work = path.join(ws, "qa-finalizacao", "agy-trabalho-" + name);
await fs.mkdir(work);
const picked = (await fs.readdir(fork)).filter((f) => /^\d{4}-.*\.patch$/.test(f) && Number(f.slice(0, 4)) >= Number(first) && Number(f.slice(0, 4)) <= Number(last)).sort();
let bytes = 0;
for (const f of picked) {
  const text = await fs.readFile(path.join(fork, f), "utf8");
  // Source only: a patch carrying something that looks like a credential is not handed over.
  if (/-----BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}|server_password"\s*:\s*"[^"]{8,}/.test(text)) { console.error("recusado, parece conter segredo: " + f); process.exit(1); }
  await fs.writeFile(path.join(work, f), text); bytes += Buffer.byteLength(text);
}
await fs.writeFile(path.join(work, "PEDIDO.md"), `# Pedido: revisão de código em busca de defeitos reais

Você pode ler os arquivos desta pasta. Não execute nada, não acesse a rede e não leia nada fora desta pasta. Responda em português.

## O que há aqui
${picked.length} patches (formato \`git format-patch\`) de um programa de mesa de corte para Windows feito sobre o OBS Studio 32.2.2 (C++17, Qt 6, libobs). São mudanças recentes que ainda **não** foram para nenhum instalador:
${picked.map((f) => "- `" + f + "`").join("\n")}

## O que eu preciso
Uma revisão de **defeitos que causam problema em uso real**, não de estilo. Procure, lendo cada trecho alterado com o contexto do patch:
1. Uso de memória depois de liberada, vazamento de referência do libobs (\`obs_source_t\`, \`obs_data_t\`, \`obs_output_t\`, \`obs_weak_*\` sem release correspondente), dupla liberação.
2. Corrida entre threads: dado tocado pela thread de áudio/vídeo/gráfica e pela de interface sem trava ou atômico; trava segurada durante chamada que pode bloquear ou reentrar; ordem de travas invertida.
3. Fechamento do programa: callback ou timer ainda registrado depois do objeto destruído; espera sem limite; thread que não é encerrada; saída que continua ativa.
4. Erros de conta: índice fora do vetor, divisão por zero, estouro de inteiro em tamanho de buffer, conversão de formato de pixel ou de taxa de amostragem com unidade trocada, carimbo de tempo em unidade errada.
5. Caminho de erro que deixa estado inconsistente (retorno antecipado sem desfazer o que já foi feito).

## Formato da resposta
Lista numerada, do mais grave para o menos grave, no máximo 12 itens e 1200 palavras. Para cada item:
- **Arquivo e função** (como aparecem no patch) e o trecho curto de código.
- **O que acontece** e em que situação concreta (sequência de passos).
- **Certeza**: "certo" (dá para ver no patch), "provável" (depende de código fora do patch — diga qual) ou "a confirmar".
- **Correção mínima** sugerida.
Não liste nada que você não consiga apontar no texto do patch. Se um patch estiver correto no que dá para ver, diga isso em uma linha. Termine com uma linha dizendo quais patches você leu por inteiro.
`);
await fs.writeFile(path.join(work, "PROMPT-CURTO.txt"), "Leia o arquivo PEDIDO.md desta pasta e faça exatamente o que ele pede, lendo os patches da pasta por inteiro. Somente leitura: não crie nem altere arquivos, não execute comandos, não acesse a rede. Responda em português, no formato pedido.\n");
console.log(JSON.stringify({ work, patches: picked.length, kb: Math.round(bytes / 1024) }));
