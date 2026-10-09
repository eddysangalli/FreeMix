# Central OBS, rede dos Calls, serviços e estabilidade

Central integrada ao motor: 98 campos em dez categorias. A extração lógica por expressão regular contou97; a leitura nativa é a referência completa. Parâmetros de encoder vêm de `obs_get_encoder_properties` do encoder escolhido, incluindo visibilidade, opções e limites. Preview não grava; aplicação exige saídas paradas, modo avançado e revisão atual do perfil. Persistência atômica, readback e recarga de saídas foram comprovados com x264.

Provas dirigidas: `central-ampliada-nativa.json` (5), `central-ampliada-ui.json` (5 observações DOM/screenshot), `calls-ice-logica.json` (2), `feed-servidor-tls.json` (4), `reset-video-raw-nativo.json` (3), `integracao-20261009-final.json` (4). Interface sem overflow horizontal nas larguras observadas 1422/777/555; rodapé visível e menu/formulário se reorganizam. Não é aprovação universal de todos os DPI ou controles de plugins.

Calls importa `FreeMix ICE` v1 do kit, valida URLs/credenciais/política, para retornos antes de trocar e mantém credenciais fora do status público. O SDK VDO.Ninja realmente gerou RTCConfiguration com TURN/relay no ensaio sem rede. Publicador recebe configuração pelo canal local autenticado; convidados continuam no VDO.Ninja. Não houve conexão TURN externa ou teste de audição humana.

KitLinux: feed assinado verificado antes de escutar, GET/HEAD e allowlist, nenhum upload/listagem ou endpoint de operador. Teste HTTPS real local com CA própria comprovou feed/manifesto/assinatura/payload e rejeitou adulteração/traversal. Caddy/coturn têm templates privados, domínio/IP validados, portas dedicadas e preservação de serviços existentes. Instalação/publicação Caddy/coturn/DNS/firewall não foram executadas. Receptor bonding usa exportação privada separada; porta do JSON deve corresponder à configuração e às rotas.

Crash adicional isolado: mudança de resolução liberava o vídeo main mantendo ponteiros RAW inativos. Corrigido emlibobs: detach antes de free sob enumeração/mutex, refs retidas até rebind, flag explícita que sobrevive a falha e é limpa pelo setter do plugin. `width/height` devolvem 0 durante o intervaloNULL. Inicialização semmix tem guarda. A câmera virtual passou reset640x360, GetOutputList e retorno à resolução anterior, semAV. Crashes da investigação estão preservados somente emQA, sem copiar relatórios brutos para o beta.

Build final: EXE7e84b16e44080f7cb2e635110f8703ee14abfa7db81cc271f2aac591b0b9b72e; libobsbb050a55a20f8c55105f0d80c777a1f30274dc84928591ecdce77829f00b651e; obs-ffmpeg2376ee21a90e67742f40e81257bba0b994ab45cf205ef9f413af441311b0bc05. Ensaios NDI/PA16/replay desta rodada usaram o mesmo EXE/FFmpeg e libobs anterior; a mudança de core final tem sua própria prova de reset e integração. Não se reapresentou prova anterior como teste novo.

RootQA foi salva e fechada normalmente. Instalação e dados do operador preservados. Nenhum serviço externo recebeu mídia ou logs.
