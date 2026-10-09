# FreeMix — execução autorizada até terça-feira, 13/10/2026

O usuário autorizou implementar todas as pendências do chat com subagentes enquanto viaja. Este registro orienta as próximas execuções. Não é uma declaração de entrega pronta. A referência inicial é AUDITORIA-PENDENCIAS-20261009.md, complementada pelos pedidos de timeline contínua e entradas/autoplay do Replay.

## Objetivo e restrições

Entregar código integrado no GitHub, instalador/pacote local atualizados e evidência por requisito. Preservar mesa, gravações, mídia, configurações e processos do operador; raízes/portas isoladas para testes; releases seladas imutáveis. Não publicar nem enviar dados externos. O receptor alpha WebBrowser foi abortado por desempenho e não deve ser retomado. Logs ficam em ZIP local para envio manual pelo beta.

Não confundir implementação, teste simulado, ensaio nativo local e homologação física/externa. Não marcar objetivo concluído por atingir terça-feira. A falta de equipamento/acesso precisa indicar exatamente o ensaio e os recursos necessários; não elimina trabalho implementável.

## Frentes e donos dos arquivos

1. **auditoria_pendencias_reais (agora implementação Replay):** replay-*.mjs, remoto/replay.js/html e QA própria. Histórico contínuo com vídeo/áudio, timeline automática, seeks e IN/OUT, quatro players e medição de custo/PTS. Root integra HTTP /api/replay-preview/<token> com GET/HEAD/Range autenticado. Não editar centrais, mesa, Git mirror, instalador ou operador.
2. **installer_exe:** scripts/installer-windows, iniciar-freemix/api, preparar/instalar-portatil, recuperacao-*, diagnostico-producao/zip, settings*/recuperacao*/diagnosticos*/studio-dialog.css. Migração .fmx offline explícita e opt-in para coleção nova, mídia verificada, credenciais novas, zero autostart; desinstalador só de arquivos próprios imutáveis verificados, preservando dados e alterados; responsividade/descrições; ZIP sanitizado. Não selar release final antes da integração.
3. **transportes_rede_conclusao:** Native multistream e transportes/NDI/OMT/SDI/SRT; ferramentas e telas saídas/rede. Estabilidade, múltiplos senders, alpha/áudio, reconexão, receptor nativo separado SRT→NDI/OMT para uma entrada vMix, contratos HDR, bonding/FEC/NACK e kits HTTPS/TURN. Não fazer build compartilhado nem deployment externo.
4. **Root:** servidor-api, controle-producao, mesa, empacotar-limpo, integração/commits/build final; áudio/ASIO/Direct Out e N-1; composições H/V/GTZIP, macros/controladores, efeitos/legendas. Pode redistribuir essas tarefas a um agente ao encerrar uma frente. Arquivos compartilhados são integrados em série.

## Lista de aceite

| Requisito | Próximo resultado verificável |
|---|---|
| Replay completo | Assistir à gravação com vídeo/áudio, timeline atualizando durante REC, escolher pontos antigos, criar lance em todos os ângulos sem parar REC nem alterar Programa; medir prévia/seek. |
| Instalação e atualização | Novo EXE com correções posteriores à build 153453, migração opt-in, atualização/rollback, desinstalação preservando projetos, teste de caminhos/portas, fontes correspondentes. |
| Menus e branding | Telas acessíveis, sem duplicar configurações operacionais; descrições; matriz de resoluções/DPI; FreeMix nas superfícies do produto, preservadas atribuições/licenças. |
| Recuperação | Alterações de composição/título/mídia/saída após snapshot recuperadas e dependências ausentes diagnosticadas; esclarecer janela de persistência e zero autostart. |
| Áudio | Buses independentes além de M/A/B, rotas reais; esclarecer captura ASIO versus playback ASIO e implementar saídas suportadas; N-1/talkback sem Master, watchdog/reconexão. |
| Transportes | Origem/conexão persistem, múltiplos envios independentes, Fill/Key/alpha/áudio, recuperação de queda, contratos HDR reais. |
| Alpha em uma entrada vMix | Receptor nativo separado, vídeo pós-chroma arbitrário, recomposição Fill/Key com mesmo PTS e áudio, saída NDI/OMT; performance medida. |
| Composições/GC | Vínculo H/V propaga conteúdo/dados mantendo geometrias próprias, desfazer/recuperação; GTZIP suportados enumerados com alertas de nós ausentes; assets/fontes e sinal congelado. |
| Replay multicâmera | Offsets/referência comum, áudio exclusivo, drift e VFR/taxas incompatíveis tratados; não afirmar genlock físico. |
| Macros/controladores | Ações/eventos e feedback de estado, reconexão sem duplicação; separar simulador de dispositivo físico. |
| Efeitos/legendas | Blur e XYZ/tracking com material representativo; reconhecimento operacional em português com qualidade/carga medidas. |
| Rede/distribuição | Bonding com perdas/falha/roteamento, FEC/NACK e mídia decodificada; kit HTTPS/TURN/receptor pronto, WAN apenas com infraestrutura e conexões reais disponíveis. |
| Logs beta | Botão/CMD ZIP local completo e sanitizado, com versão, identificação de máquina, logs/crashes/dependências; sem upload automático. |

## Estado inicial desta rodada

Git produto: feat/native-menus-config-screens, 6de1000. Build instalada/pacote selado: 153453, ainda anterior às correções de Replay e algumas telas. Timeline atual é JPEG por quadro e atualização manual; a reprodução contínua do histórico e crescimento automático são pendências concretas. A/B/autoplay já foram corrigidos e testados; validar com o novo fluxo. O serviço foi atualizado após encerramento da Call e manteve REC na mesma sessão, com arquivo crescendo; a mesa carrega a interface nova na abertura normal. Não reiniciar motor/serviço do operador quando houver Calls/saídas/REC ativos sem uma janela autorizada.

Atualizar este documento com entregas e evidências ao integrar cada frente. Registrar requisitos externos que não puderem ser executados; não reciclar os relatórios antigos como se validassem a nova build.

## Progresso verificado — 09/10, rodada atual

- Prévia Replay HTTP integrada pelo root: GET/HEAD/Range local e autenticado, lease liberada em término/cancelamento/erro/HEAD/416. Treze verificações HTTP reais em porta efêmera (`resultado-replay-preview-http.json`). Player contínuo ainda em testes do agente; não selado nem aplicado no operador.
- Composições H/V: contrato de conteúdo existente identificado, corrigida propagação indevida de Fit/Fill, adicionado desfazer de conteúdo por sessão e indicação de vínculo. Seis regressões + sete verificações no motor real isolado, detalhes em COMPOSICOES-HV-20261009.md. Isso resolve conteúdo/fontes/fundo e preserva geometria; não propaga toda edição de layout.
- Build Native `obs-studio` terminou exit 0, EXE SHA-256 `09ae2e0f2c72df7e4245df2cb616ba3ede281fe28eb9dc2a6cde0e9b91df105e`. Alterações de transportes ainda em QA dirigida pelo agente. Não copiado para operador nem selado em entrega.
- ASIO de saída: SDK oficial 2.3.4 obtido por `https://www.steinberg.net/asiosdk`, redirecionamento `https://download.steinberg.net/sdk_downloads/ASIO-SDK_2.3.4_2025-10-15.zip`, SHA-256 `d5ebf0c20dd2c5f43771fd0c1418f4b361bf52434ee670097cfa6b3a335e2eca`. Fontes locais em downloads/asio-sdk-official/source/ASIOSDK; licença oferece GPLv3. Playback multicanal ainda por implementar; obter SDK não conclui áudio.

## Integrações posteriores — 09/10, 18h05

- **Replay contínuo:** SourceRecord real com duas câmeras, histórico de 6,32 para 9,82 segundos, prévia preparada em 356 ms, IN/OUT dos dois ângulos sem parar REC ou mudar Programa. Fontes, HTTP, interface e QA no Git `9f94659`.
- **Transportes:** cor Fill sem premultiplicação duplicada, Key silenciosa, reconexão NDI/OMT com áudio de 440 Hz e fontes da ponte nativa SRT→NDI no Git `205af12`. A rejeição explícita de HDR não suportado está em `41508d8`. HDR OMT P216 PQ/HLG passou no receptor real do SDK: 190/187 quadros, gradiente com 765/766 níveis, PCM e PTS monotônicos. Enumeração das fontes HDR e quatro emissores ainda em integração. Envio HDR por NDI depende do Advanced SDK licenciado.
- **ASIO playback:** mock IASIO com 16 formatos, oito rotas e 16 canais; dez mil callbacks sem alocação em tempo real. Build nativa exit 0. Vendor real enumerou quatro drivers sem abrir dispositivos; integração no Git `12cf444`. Playback em hardware físico ainda não homologado.
- **Distribuição e recuperação:** trinta fontes e sete recibos integrados no Git `3e6a1dc`. Importação online passou no motor real: título, UUID, 4:4:4 e alpha packed preservados em perfil/coleção novos, com saídas desligadas. Instalador final ainda não foi gerado.
- **Adicionar títulos:** dezesseis combinações de resolução/DPI passaram, com rodapé na base e formulário ocupando a altura disponível. Screenshot inspecionado. A matriz de distribuição tem outras 36 combinações em três telas.
- **Legendas em português:** sete expressões reconhecidas na fala sintética Windows Maria; primeiro texto em 501 ms. LocalVocal foi recompilado em QA; cancelar a inferência liberou a thread em 19 ms. A suíte completa revelou outro bloqueio no advanced-scene-switcher. Não declarar todo o fechamento corrigido até concluir esse cenário.
- **Donos atuais:** auditoria_pendencias_reais trata o fechamento das extensões; installer_exe amplia GTZIP, grupos, transformações, animações e fontes; transportes_rede_conclusao integra HDR OMT nativo/SDK/interface. Root integra fontes, pacote, builds e QA.
- Mesa e gravações do operador preservadas. Novos binários não foram ativados na instalação de uso. Goal e heartbeat continuam ativos; a conclusão de todos os requisitos ainda não foi declarada.

## Integração em 2026-10-09T21:30:58.826Z

Native final: commit 99e5944cf61aacc4c07167ef867d4ce52a752ae6; EXE 1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744. Catorze patches foram aplicados em índice separado e produziram a mesma árvore do HEAD. Não publicado no upstream OBS.

GTZIP congelado: 21 fontes e três recibos hash-verificados espelhados; recuperação .fmx com HTML/imagem/fonte livre/campos passou no Native final sem originais, zero saídas e saída 0. Fonte gtzip-runtime é autocontida em cada título; o FAIL anterior de dependência fora da pasta foi preservado.

LocalVocal e dois DLLs SceneSwitcher têm patches, fontes oficiais, licenças e receitas reproduzidas. Suíte completa com NDI fechou normalmente em 876/892 ms. Entrarão apenas no pacote novo, sem sobrescrever operador. Packager agora calcula fechamento de 97 módulos, inclui NDI pinado e aceita overlays explícitos de plugins por SHA-256.

Donos atuais: auditoria_pendencias_reais executa Replay/CEF20min; transportes_rede_conclusao executa ponte Native alpha20min; installer_exe corrige reconexão/feedback/releases de controladores e verifica24 casosUI. Root prepara selagem, instalador e integração final. Ensaios interrompidos por falhas de isolamento/instrumentação são preservados como FAIL, não resultados de mídia homologados.
