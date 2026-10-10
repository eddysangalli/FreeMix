# Direct Out: ajustes pendentes, frontend isolado

Único alvo proposto: `FreeMix/painel/remoto/audio-buses.js`, baseline SHA256 `d5173ff3418b85b675e297c1b1b13db9837dec95fcac712b949792422548e706`. O canônico não foi alterado por esta tarefa. Nenhum Native, API, navegador ou dispositivo foi iniciado.

O polling original reaplicava dispositivo, nível, atraso e checkbox ativo da configuração salva. Um pedido pendente de desligar podia voltar visualmente a ativo quando chegava outro snapshot. O draft mantém esses quatro valores para a mesma coleção (`state.scope`), UUID público selecionado e época de queda observada. Editar, descartar, abrir e atualizar a tela não envia comandos.

`Aplicar saída direta` captura uma intenção imutável e usa a rota existente. Só uma confirmação positiva com o mesmo proprietário e revisão limpa o draft. Uma falha mantém os ajustes; uma confirmação tardia não apaga uma edição nova ou a seleção de outra fonte. `Descartar ajustes` é local e fica desabilitado enquanto o comando está ocupado. Troca de fonte, coleção, remoção ou queda observada descarta ajustes com aviso, sem nova escrita. Desativar uma saída existente continua permitido com inventário desconhecido, usando a proteção do backend já integrado.

A lista vazia de captura ASIO passa a dizer que a consulta não retornou drivers. O contrato do plugin não certifica a ausência de drivers instalados nem sua funcionalidade.

## Evidência e limites

`test.mjs` executa o arquivo completo em VM com DOM limitado e fetch simulado: 18 verificações funcionais de polling, quatro campos, parada pendente, seleção ausente, fontes removidas, mudanças de contexto, queda observada, ACK tardio, recusa, descarte e ausência de escrita automática, mais uma verificação explícita de UTF-8 (19 PASS). `CHECKS.json` registra o resultado. Sintaxe Node passou. Isso não é prova visual, integração HTTP ou áudio físico.

A revisão independente do draft provisório `7884a9a1…` demonstrou botões ainda disponíveis durante ACK pendente. Essa falha foi preservada pelo revisor. O draft adiciona gate próprio do Direct Out, pinta os botões logo após despachar e conserva o bloqueio até terminar o refresh, incluindo a janela em que o `busy` legado já é falso. O descarte também verifica esse gate. Os testes finais exercitam a cadeia real de `onclick`, ACK e poll suspensos, sem pintar manualmente os botões para simular a correção. Uma primeira tentativa de edição do materializador falhou em assertion antes de gravar; não foi usada como prova.

O freeze provisório `ALLOWLIST 71e1986e…` / draft `9376d504…` foi rejeitado por mojibake real nas novas mensagens e no teste: um roundtrip de edição usou `Path.read_text()` com locale Windows em vez de UTF-8 explícito. Está preservado integralmente no diretório anterior. Esta derivação repara apenas o encoding, mantém o conteúdo ASCII de toda a implementação idêntico e acrescenta guard de mensagens Unicode corretamente decodificadas. `DERIVATION.json` e `ENCODING-CHECK.json` registram o limite e a comparação. Não usar o freeze anterior para integrar.

O snapshot `/api/audio-routing` não fornece geração da conexão Native. O draft observa somente o estado real já mostrado por `audio.js`: `Motor conectado` / `Controle indisponível`. Uma reconexão invisível entre polls com a mesma coleção e UUID não é detectável por este contrato e permanece não homologada. Não se adicionou API central para isso.

O comando HTTP existente não oferece recibo de operação nem cancelamento confirmado. Erro de rede não demonstra que o backend parou; o draft conserva a intenção e não repete automaticamente. Essa mudança não afirma resolver a incerteza de comandos legados ou adicionar deadline ao endpoint. Uma operação já despachada para a fonte anterior pode concluir; o guard impede atribuir esse ACK à nova edição.

## Antigravity

Primeiro foi enviado apenas um trecho público selecionado e brief compacto ao `gemini-3.8-flash-high`, em cwd próprio, inline/no-tools, deadline 120 s. `AGY-STDERR.txt` registra timeout de impressão com turno em andamento. `AGY-RESULT.json` devolveu resposta vazia e zero tokens, apesar do rótulo `SUCCESS`; não foi tratado como implementação ou aprovação. O fallback Codex ocorreu após essa falha operacional documentada, sem afirmar falta de cota. A revisão independente mantém seus próprios recibos.

## Integração proposta

Root deve comparar o SHA do alvo com `PRODUCT-PIN.json`, aplicar o único patch revisável e repetir os testes CPU contra uma cópia do alvo integrado. Não copiar este diretório QA para payload nem alterar freezes anteriores. Depois, um ensaio próprio de frontend/HTTP pode comprovar o comportamento real; nenhum runtime foi autorizado nesta tarefa.
