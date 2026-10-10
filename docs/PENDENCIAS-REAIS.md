# Pendências reais do FreeMix

O instalador selecionado é **0.1.0-local.20261010060000, Native24/a047860**. As correções posteriores estão em desenvolvimento e não estão incluídas nesse instalador.

| Frente | O que já existe | O que falta para encerrar |
|---|---|---|
| Botões de operação | Recuperação por UUID/cursor sem repetir comandos;24 testes de contrato e Cut/Preview/exclusão/contexto passaram em Native real. | Verificar endpoint HTTP e mesa; a prova direta de Production não cobre CEF/modal. Dois FAILs anteriores de fixture permanecem preservados. |
| Lentidão dos comandos | Miniaturas somente visíveis, com rotação limitada;11 testes. Consultas periódicas HTTP saíram da fila de comandos;13 testes com HTTP próprio. | Medir comportamento na mesa com Native/CEF e carga real. Testes de orçamento/fila não comprovam latência da GPU. |
| FTB | C++ integrado em de136e8: preto e retorno ao Programa renderizado, mantendo Preview;48 casos do modelo. | Build completa passou; observar quadros reais e metadados, integrar backend/UI e provar dedupe/erros sem reenvio. |
| Calls: vídeo contínuo por entrada | Captura AUX640×360 com PTS, três buffers, limite de duas fontes e25/30/29,97fps derivados; C++ integrado. | Provar captura/stop/leases no Native; integrar Node/browser; sincronizar com PCM/N-1 e verificar Master, CEF e convidados. O instalador600 ainda usa JPEG até5fps. |
| Editores de entrada | Handoff de Properties/Filters e nova observação opcional por UUID/visibilidade/foco Qt. | Build completa passou; observar no Native. Estado Qt não comprova ordem das janelas no Windows. |
| NDI HDR | NDI SDR/alpha e runtime distribuído; contratos HDR em outras saídas. | Acesso/licença Advanced SDK, implementar renderer/API e provar mídia em receptor HDR. SDK sozinho não conclui. |
| GTZIP além do contrato finito | Títulos literais/ticker dentro do conjunto implementado. | Obter exemplos com recursos/tempos ausentes e implementar por família. Não há suporte universal a3D/imagens/feeds. |
| Replay, ASIO, SDI, OMT, PTZ/controladores | Contratos e ensaios de software registrados. | Equipamento/driver/receptor/câmeras/SSD/GPU, audição e sessão longa no destino. |
| WAN, bonding e Calls externos | Loopback/FEC/NACK/HTTPS local e provas delimitadas. | Duas conexões reais, VPS/domínio/TURN, destinatários e condições de perda. Loopback não comprova internet. |
| Distribuição pública | Setup local, diagnósticoZIP manual e assinatura interna Ed25519. | Windows limpo e homologação de destino; certificado Authenticode para assinatura Windows; DNS/VPS para publicação HTTPS. |

As primeiras cinco linhas ainda têm trabalho de software implementável; não são todas dependências de hardware. As demais exigem recursos específicos, além de possíveis correções durante os ensaios. As estimativas dependem do primeiro teste real e não constituem promessa de término.

Alpha via Web Browser foi abortado por desempenho. Ponte alpha nativa permanece beta separada. Não reativar o caminho rejeitado.
Histórico anterior completo: [registro preservado](historico/20261010-preNative25/PENDENCIAS-REAIS.md).
