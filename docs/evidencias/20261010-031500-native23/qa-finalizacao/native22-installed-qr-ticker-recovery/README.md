# QA preparada — Native22 instalado, QR + ticker + recuperação

Status: preparada, sem instalação ou Native executados. Aguardando candidato selado e autorização do root. Os candidatos 045000, 000500 e 233334 e seus recibos permanecem intactos.

O runner exige candidato SHA256, head, versão e caminho de recibo inédito. Recusa candidatos antigos e exige os pins do full build Native22 recebidos do root:

- head `500ced5ea0928453f9f27dc7d5649531e2671e28`;
- EXE `f44584df52ca2ab1dc22e9715a48bcaf1e849788c497883a6c24c126f4f58cf6`;
- obs-browser `b2334edaa5eb0da6ff287886abc134be9578cb836d37897483ae221a7d01e77a`.

Não há overlay da DLL de QA anterior. O instalador offline vem do pacote indicado, confere assinatura/hashes e copia para uma raiz TEMP nova com espaços. API, launcher, obsws, conversor e verificador GTZIP vêm da instalação nova. As portas são efêmeras; nenhum atalho global ou firewall é criado.

Após os pins e a autorização, a forma de execução é:

```powershell
node qa-finalizacao/native22-installed-qr-ticker-recovery/run-installed.mjs --candidate=CAMINHO_JSON --candidate-sha=SHA256_JSON --native-head=500ced5ea0928453f9f27dc7d5649531e2671e28 --version=VERSAO_NOVA --receipt=CAMINHO_RECIBO_NOVO
```

O procedimento importa explicitamente dois GTZIP próprios pela API: QR+Path e o ticker finito de uma Layer, dois TextBlock, um PNG verde procedural e QR. Preview/hash precede import; import não cria cenas, e Prepare é explícito. Cada título vai imediatamente ao Program após Prepare, sem espera prévia de cinco segundos. Capturas posteriores têm retries limitados para renderização assíncrona.

QR é decodificado por ZXing na screenshot CEF real. O ticker deve apresentar o PNG verde dentro da geometria esperada e pixels dos glifos, além dos valores de texto preservados nos metadados. Capturas do ticker serão inspecionadas visualmente após execução; a contagem de pixels não é OCR. A fila TypeAdd e a unidade Speed continuam limitadas/avisadas pelo produto.

OFF usa a própria janela QA visível em StudioMode: Program na cena de controle e Preview no título, com `videoActive=false` e `videoShowing=true`. Isso evita a textura guardada de uma fonte não exibida. A imagem OFF deve ser transparente, inclusive após refreshnocache e nova confirmação. ON, reload ON e edição UTF-8 são decodificados; o título sai do ar antes de Save/Prepare.

Depois, backup `includeMedia:true` deve incluir HTML, gc.js, gt-qr.js, licença QR e PNG. Os arquivos GTZIP originais já foram renomeados para indisponíveis; após backup, as duas pastas canônicas convertidas também são renomeadas, apenas dentro da raiz QA validada. A cópia `.fmx` passa por `recovery_import_preview` e `recovery_import` com hash esperado, em coleção nova. Deve confirmar `credentialsCopied=false`, `outputsStarted=false` e `automationsStarted=false`; verificar todas as dependências recuperadas e repetir Prepare/ON/CEF para ambos os títulos.

O runner confirma REC/stream/saídas parados, identidade própria de Native/API, shutdown_idle aceito, PID Native encerrado, contador zero e crash zero. A limpeza de falha usa espera limitada e identidade própria antes de eventual força; força permanece FAIL. Logs brutos não são emitidos; recibos guardam hashes/contagens e preservam avisos Meter. Nenhum dado/processo do operador é utilizado.

`prepare-plugin-future.ps1` é uma receita futura corrigida, somente preparada: remove eventos/referências de build e fixa `Link.ImportLibrary` e `Link.ProgramDataBaseFile` em OUT absoluto próprio, exigindo quatro nós de cada e containment validado. Não foi executada e não autoriza rebuild. A receita original e a divulgação de EXP/PDB compartilhados escritos na tentativa anterior ficam preservadas.

Verificações de preparação: sintaxe Node dos dois módulos, AST Python e parser PowerShell. Nenhuma prova runtime ou visual nova é alegada nesta preparação.
