# Pendências reais e critérios de conclusão

Estado das fontes em 2026-10-09T21:29:47.215Z. O instalador 153453 é anterior às integrações abaixo. O pacote novo só será identificado como entregue depois de assinatura, conferência de todos os arquivos e instalação em raiz isolada. Provas de software não substituem os ensaios físicos descritos aqui.

## Trabalho de software desta rodada

| Frente | Implementação e evidência atual | Trabalho restante para encerrar |
|---|---|---|
| Recuperação | Snapshots/eventos, mídia e configurações em perfil/coleção novos; estados de títulos, composições e saídas. Importação GTZIP com fonte livre e valores foi restaurada sem originais no motor 1c045e5d, saída 0 e sem autostart. | Integrar tudo no pacote final e repetir abertura/importação pela instalação nova. Alterações ainda não persistidas no intervalo de debounce não são garantidas; drivers/servidores externos não podem ser reconstruídos por um snapshot. |
| Áudio | Host ASIO próprio: 8 barramentos estéreo/16 canais, roteamento por UUID e Direct Out. SDK/formatos e callbacks ensaiados; o Native enumera drivers sem abri-los. N-1/talkback fora do Master têm provas de PCM locais. | Empacotar as correções e conferir a interface ASIO real; esse equipamento não foi fornecido ao ensaio isolado. |
| NDI/OMT/SDI | Saídas independentes, múltiplos nomes, Fill/Key com timestamps comuns, áudio somente no Fill e reconexão. OMT SDR PA16 com alpha; quatro saídas HDR P216 com contrato manual PQ/HLG passaram no SDK local. | Integrar o novo Native e testar receptores físicos. NDI HDR exige Advanced SDK licenciado; SDI HDR ainda não está implementado na integração atual. |
| Interface | Central com categorias/descrições, Transmitir para MultiStream, Externo para SRT/NDI/OMT/SDI, ajustes específicos nas engrenagens dos módulos. Matriz de DPI/telas em recibos; página de erro agora usa FreeMix. | Testar o instalador novo, seus atalhos e o início de todas as janelas; validar visualmente em monitores físicos. Não há promessa de identidade pixel a pixel em qualquer resolução ou plugin. |
| Composições/GC | H/V, vinculação de conteúdo, undo e referências por UUID ensaiados no Native. GTZIP: XML/camadas/grupos/transformações 2D e animações reconhecidas; fonte Bebas Neue OFL opcional por título e imagens/fontes livres por biblioteca. Inventário de 743 arquivos, sem redistribuir os modelos de referência. | Os avisos do conversor continuam visíveis: sequências sem frames/tempo explícitos, tickers complexos e contratos proprietários desconhecidos precisam de casos-alvo finitos. O inventário não é aprovação visual dos 743 títulos. |
| Replay | Timeline contínua durante gravação SourceRecord; player MSE, seeks e pontos IN/OUT no histórico, áudio opt-in por câmera, players A/B com autoplay no ar e offsets por referência comum. Prova curta em CEF real já executada. | Ensaio contínuo de 20 minutos em CEF está em execução; falta integrar o recibo final e conferir a instalação. Sincronismo de software não cria genlock físico. |
| Macros/controladores | Ações/eventos existentes e feedback de software. Correções desta rodada: eventos ProjectOpen na reconexão, handlers MIDI antigos, dedup na troca da porta e releases OSC/MIDI pendentes. OSC UDP real passou; 26 casos de navegador passaram. | Fontes/recibos congelados e espelhados; falta a conferência no pacote integrado. MIDI/StreamDeck/XKeys/Companion físicos precisam de dispositivos; MIDI doubles não são essa prova. |
| Efeitos/legendas | Blur/máscaras próprios e plugins licenciados incluídos; transformação XYZ de plano texturizado, FaceTracker/VISCA e LocalVocal/Whisper local. LocalVocal recebeu cancelamento seguro de inferência; SceneSwitcher recebeu parada no shutdown. Duas saídas normais da suíte completa, 876/892 ms. | Integrar os três DLLs reconstruídos com fontes/licenças. Fala portuguesa, PTZ e desempenho prolongado precisam de material e hardware representativos. Não inclui modelagem de meshes 3D nem licença StreamFX. |
| Bonding/distribuição | UDP com AES, FEC/NACK, medição por caminho, kit de receptor/feed HTTPS/TURN e assinaturas. Logs por botão/BAT geram ZIP local sanitizado, sem envio automático. Instalador com importação explícita, desinstalação conservadora e credenciais novas. | Novo pacote completo com dependências/NDI, assinatura e instalação limpa; operação WAN e domínio exigem servidor e duas conexões reais. |
| Alpha para vMix | SRT packed preserva cor/máscara no mesmo quadro; OBS recompôs e o operador recompôs no vMix com auxiliares. Browser/WebGL foi abortado por desempenho real. Ponte nativa SRT→NDI recebe qualquer vídeo com alpha, incluindo chroma aplicado, sem redesenhar GC; 20 min em andamento. | Receber o resultado da endurance. Ponte segue beta separada até teste em vMix/NDI externo; não reativar o receptor de navegador rejeitado. |

## Recursos externos necessários

| Pendência | O que é necessário | Prazo de ensaio depois que o recurso estiver disponível |
|---|---|---|
| Bonding na internet | VPS Linux/UDP, duas operadoras/interface distintas e receptor remoto. Interromper um caminho e medir mídia entregue sob perda/jitter reais. | 4–8 horas para configurar e executar a matriz inicial; correções dependem das falhas reproduzidas. |
| Feed HTTPS/TURN | Domínio/DNS e VPS com permissões e portas. O kit existe; hospedagem de páginas/Drive não recebe UDP/TURN. | 2–4 horas de configuração e uma sessão externa; nenhum serviço foi publicado automaticamente. |
| ASIO/Direct Out | Interface/driver compatível, saídas físicas e loopback/medição por canal. | 2–4 horas para a matriz básica; não há estimativa de correção de driver ainda não ensaiado. |
| SDI/Fill+Key/HDR | DeckLink, driver, modos/keyer e receptor/captura HDR compatíveis. | 4–8 horas para SDR/Fill+Key. HDR SDI requer implementação e teste dirigidos ao equipamento; não prometemos prazo fechado sem o contrato do hardware. |
| NDI HDR | Licença e Advanced SDK com API de envio HDR, mais receptor correspondente. | Sem prazo fechado enquanto SDK/licença não estiverem disponíveis. P216/PQ/HLG OMT manual já tem prova local, mas o SDK não carrega metadados HDR automáticos. |
| Calls/N-1/talkback WAN | Dois convidados em redes diferentes, celular/fone e TURN quando necessário. | 1–2 horas de sessão e reconexão; confirmar audição humana e ausência de vazamento no Master. |
| Replay em produção | Câmeras reais, gravação longa e disco/GPU de destino, referência comum se precisar de alinhamento estrito. | 2–4 horas por matriz; genlock exige uma cadeia física com relógio comum. |
| Controles/PTZ | Dispositivos MIDI/OSC/StreamDeck/XKeys e câmera VISCA configurada. | 2–4 horas por conjunto para comandos, feedback e reconexão. |
| Windows limpo | VM/máquina Windows sem ambiente de desenvolvimento, seus monitores/drivers e permissão de rede quando solicitada. | 2–4 horas para instalação/abertura/importação/atualização/desinstalação, mais o período operacional combinado. |

Esses prazos são estimativas dos ensaios, não garantia de correção de problemas desconhecidos. Não declararemos homologação física, WAN ou compatibilidade universal só por testes locais.

## Organização dos agentes

Três frentes paralelas estão ativas: replay/CEF e estabilidade das extensões; transporte nativo alpha/reconexão; macros/controladores e interface. O coordenador integra recuperação, dependências, fontes, patches e o instalador, preservando a instalação do operador. Os donos e recibos ficam em PLANO-CONCLUSAO-20261013.md e CONTINUAR.md.

Evidências novas no Git: docs/evidencias-distribuicao-conclusao, evidencias-gtzip-conclusao e evidencias-transportes-conclusao. Cada recibo identifica build, escopo e limitações. Instalação atual não é a mesma coisa que fonte integrada.
