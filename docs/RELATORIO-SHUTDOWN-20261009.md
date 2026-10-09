# Fechamento nativo dirigido — 09/10/2026

PASS: um único motor QA, uma janela Settings aberta e fechamento normal com consultas concorrentes limitadas. Raiz `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-Shutdown-20261009`, API18311/WS14611; configuração veio da QA Responsive arquivada, nunca do operador. Operador e QA-Menus/OMT18310 preservados.

- PID87016, identidade/path verificados. EXE SHA256 `e75c63a476a3a48ae6e11e71d0600e48ada08a895152e6e111f4b80dd430647e` da build final root.
- Janela `/settings` nativa aberta e visível; nenhuma saída ativa antes de fechar.
- `shutdown_idle` com `qaClose:true` confirmou fechamento salvo.
- Seis consultas durante fechamento: quatro respostas normais, uma `success:true, interfaceBusy:true, closing:true` às12:43:53.462Z e uma recusa207 quando o frontend já encerrava. Com as duas consultas anteriores de identidade/panel, oito na execução dirigida.
- Handle externo do processo confirmou **exitcode0** às12:43:56.217Z. Nenhum relatório de crash novo; log registra shutdown, limpeza de cenas e unload do WebSocket.
- API própria encerrada após verificar installationId, motor desconectado e caminho exato do node da QA. Nenhuma outra porta/processo foi encerrado.

O primeiro acesso de identificação aconteceu após WS conectar, mas antes de terminar o carregamento e recebeu207. A prova continuou no MESMO motor depois da prontidão; não houve segundo boot nem repetição de fechamento. Isso foi sincronização do wrapper, não crash do produto.

Log de saída registra14 memoryleaks do contador OBS. O ensaio comprova ausência de crash e encerramento normal desse caso, não ausência de todo vazamento nem todos os interleavings possíveis.

Recibo: `resultado-shutdown-20261009.json`. Scripts: `preparar-qa-shutdown-20261009.mjs`, `test-shutdown-20261009.mjs`, `fechar-api-shutdown-20261009.mjs`. Fontes do produto/Native não alteradas por esta frente.
