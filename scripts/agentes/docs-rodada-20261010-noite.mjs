// One-off: writes the 10/10 night round into the four handoff documents (root docs/ and FreeMix/docs/, which are
// kept identical). The previous text of each document stays below the new block, untouched. Refuses to run twice.
import fs from "node:fs/promises";
import path from "node:path";
const ws = path.resolve(import.meta.dirname, "../.."), MARK = "<!-- rodada-20261010-noite -->";
const put = async (name, transform) => {
  const file = path.join(ws, "docs", name), text = await fs.readFile(file, "utf8");
  if (text.includes(MARK)) throw Error("already applied: " + name);
  const next = transform(text);
  await fs.writeFile(file, next); await fs.writeFile(path.join(ws, "FreeMix/docs", name), next);
  console.log(name, text.length, "->", next.length);
};
const EVID = "evidencias/20261011-app36-r4e-real-pass/ROOT-README.md";

await put("CONTINUAR.md", (t) => `# Continuidade do FreeMix
${MARK}
> **Leia primeiro este bloco.** É o resumo vigente, em linguagem direta. O registro detalhado do Codex (até 10/10, 19h) continua logo abaixo, sem alteração.

## Onde estamos — 10/10/2026, 23h30 (Claude assumiu de onde o Codex parou)

**Instalador selecionado:** continua o \`0.1.0-local.20261010060000\` (motor Native24). **Fonte atual:** motor Native36 (\`e81afe7\`) + painel deste repositório. Tudo o que foi corrigido desde a madrugada do dia 10 (menus que não disparam comandos, inventários de áudio e SDI, cursor de mídia, salvamento automático só quando há mudança) está na fonte e **ainda não está em instalador**.

### Fechado nesta rodada
- **"Abrir os menus não pode executar comando" passou em execução real** (App36 R4e): cinco telas abertas por 60 s, contadores idênticos aos de antes (run 0, execute 1, journal 2, escritas 19). Preview em 90 ms e Cut em 165 ms confirmados pelo motor; salvamento automático só depois de mudança; salvamento manual OK; fechamento limpo (0 vazamentos, 0 crash). [Prova e limites](${EVID}).
- As rodadas R4, R4b e R4c do dia 10 falhavam por **três defeitos do próprio roteiro de teste**, não do programa: exigência de contadores zerados em valor absoluto (contraditória com a partida do áudio), processo da API de teste que não conseguia terminar (faltava \`process.disconnect()\`) e pedido de salvamento manual com nome de ação errado (\`checkpoint\` em vez de \`recovery_checkpoint\`). Os recibos de falha foram mantidos; nenhum critério foi afrouxado.
- A parte que era feita à mão (abrir as cinco telas e tirar os retratos) agora é um script com navegador real. Um ensaio completo leva cerca de 8 minutos e fecha tudo sozinho.

### Em andamento
1. **Revisão de código das 12 mudanças do motor que ainda não foram para instalador** (patches 0025 a 0036), pedida ao Gemini e conferida item por item contra a fonte antes de aceitar. Primeira conferência: o alerta sobre o talkback ficar aberto é **falso** (existe o temporizador de 100 ms que fecha quando o prazo vence); os alertas de que **uma única entrada defeituosa no registro do ASIO ou um único dispositivo de reprodução sem nome fazem o programa descartar todos os dispositivos válidos** são **verdadeiros** e serão corrigidos.
2. Depois das correções: compilar (Native37), congelar, repetir o ensaio de App e **selar o instalador novo**.

### Continua pendente (sem mudança nesta rodada)
- **Calls com vídeo contínuo:** sincronismo reprovado (o vídeo recebido atrasa 9,78 ms a cada segundo; o áudio chega no tempo certo). É recurso experimental e fica desligado. O retorno atual das Calls continua o de imagens até 5 por segundo.
- **Redução de ruído (RNNoise):** reduziu 1,04 dB no ruído de teste; o exigido é 3 dB.
- **Legendas (LocalVocal):** falta provar fechamento com o filtro ainda trabalhando.
- **FTB em 29,97:** o cursor passou; falta o ensaio completo no Master.
- Dependem de equipamento, licença ou rede de fora: SDI/HDR/ASIO/PTZ físicos, NDI HDR (SDK Advanced), WAN/bonding com duas redes, Windows limpo, certificado de assinatura.

### Como repetir o ensaio de App (para quem assumir)
1. Derivar a rodada nova a partir da última (\`qa-finalizacao/native36-real-app-r4e-offside-20261011/derive-r4e.mjs\` é o modelo: copia os arquivos de teste, troca os nomes, registra o que mudou).
2. Rodar o preparador gerado (\`prepare-app36r4.mjs --commit=<HEAD do FreeMix> --integration-receipt-sha=<...>\`) e a conferência (\`preflight-app36r4.mjs\`) com o \`runtime/node.exe\` do pacote selecionado. O preparador exige o repositório \`FreeMix\` limpo e no commit informado.
3. Em dois terminais: \`root-browser.mjs\` (espera o programa de teste, abre as telas, salva os retratos e aguarda \`ROOT-REVIEWED.json\`) e \`launch-root-only.mjs --root-launch-authorized=...\` (instala a cópia de teste, abre, roda, fecha). Olhar os cinco retratos e só então gravar \`ROOT-REVIEWED.json\` com \`{"approved": true}\`.
4. O resultado sai em \`receipt.json\` na pasta de preparação. Recibo de falha não se apaga: a tentativa seguinte ganha pasta nova.

### Ajudante Gemini (Antigravity CLI)
\`scripts/agentes/agy-pedir.mjs\` envia um pedido ao \`agy.exe\` (modelo \`gemini-3.8-flash-high\`) e guarda pedido, resposta e recibo em \`qa-finalizacao/agy-<data>-<nome>\`. Material maior vai em arquivos numa pasta \`qa-finalizacao/agy-trabalho-<nome>\`. **Só fonte do produto ou do teste** entra nessas pastas: nada da instalação do operador, de logs, de mídia ou de senhas. Resposta do ajudante é material para conferir, não decisão: na primeira leva, um dos cinco achados "certos" era falso.

### Regras que continuam valendo
Mesa, API, vMix, Calls, gravações, mídia e configurações do operador não são tocados. Ensaios rodam em pasta e portas próprias (\`FreeMix-QA-…\`), fecham o programa pedindo, nunca matando. Falha fica registrada como falha. Publicar: só commit e push no GitHub privado e pacote local.

---

## Registro anterior (Codex, até 10/10 19h)
` + t.replace(/^# Continuidade do FreeMix\s*\n/, ""));

await put("PENDENCIAS-REAIS.md", (t) => {
  const from = "| P0 — abrir menus sem executar comandos |";
  const i = t.indexOf(from), j = t.indexOf("\n", i);
  if (i < 0) throw Error("P0 row not found");
  const row = `| ~~P0 — abrir menus sem executar comandos~~ **FECHADO em 10/10 23h** | App36 R4e em execução real: cinco telas + 60 s com contadores idênticos (run 0, execute 1, journal 2, escritas 19); Preview 90 ms e Cut 165 ms confirmados; salvamento automático só após mudança; fechamento limpo. [Prova](${EVID}). | Repetir o mesmo ensaio sempre que o motor ou o painel mudarem (≈8 min, automatizado) e no instalador novo. Ordem das janelas no Windows e telas dentro do programa (CEF) continuam fora desta prova. | Qualquer um, seguindo "Como repetir o ensaio de App" em CONTINUAR.md. |`;
  const head = `# Pendências reais — visão atual em 10/10/2026, 23h30\n${MARK}\n\n**Mudou nesta rodada:** o P0 dos menus foi fechado com prova real (linha riscada na tabela). Entrou um item novo, pequeno: **inventário de áudio tolerante a uma entrada defeituosa** (hoje uma única chave quebrada em \`HKLM\\SOFTWARE\\ASIO\`, ou um único dispositivo de reprodução sem nome, faz o programa descartar todos os dispositivos válidos); correção em preparo junto com a revisão dos patches 0025–0036. O resto da tabela continua como estava.\n`;
  return head + (t.slice(0, i) + row + t.slice(j)).replace(/^# Pendências reais — visão atual em 10\/10\/2026\s*\n/, "");
});

await put("PLANO-CONCLUSAO-20261013.md", (t) => `# Plano de conclusão até 13/10
${MARK}

**Situação em 10/10, 23h30.** Passo 4 (validar o App com a fonte final) **concluído** para Native36 + painel atual: [App36 R4e PASS](${EVID}). Ordem daqui para a frente:

1. Conferir e corrigir o que a revisão de código dos patches 0025–0036 confirmar (pequeno; vira Native37).
2. Compilar, congelar, repetir o ensaio de App (8 min) no Native37.
3. Selar o instalador novo, instalar em pasta própria, abrir/fechar duas vezes, diagnóstico e desinstalação; publicar commit e push.
4. Em paralelo, sem segurar o instalador: Calls contínuo (segue desligado), RNNoise, LocalVocal com filtro vivo, FTB 29,97 completo.
5. Terça, 13/10: conferir a entrega e listar o que depende de equipamento, licença ou rede.

---

## Registro anterior (Codex)
` + t.replace(/^# Plano de conclusão até13\/10\s*\n/, ""));

await put("ATUALIZACAO-20261010.md", (t) => `# Estado operacional em 10/10/2026
${MARK}

**Atualização das 23h30:** o ensaio de App passou em execução real (App36 R4e): abrir e manter abertas as cinco telas não dispara comando; Preview, Cut e salvamento automático conferidos; fechamento limpo. As três falhas anteriores do dia eram do roteiro de teste. Detalhes e limites: [prova](${EVID}). Instalador selecionado continua o 060000; o novo depende de uma pequena leva de correções do motor e da repetição do ensaio.

---

` + t.replace(/^# Estado operacional em 10\/10\/2026\s*\n/, ""));
