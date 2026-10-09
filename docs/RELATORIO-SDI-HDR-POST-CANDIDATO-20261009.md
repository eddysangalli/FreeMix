# SDI HDR implementado em fonte · integração posterior

Esta frente é posterior ao candidato `FreeMix-Completo-0.1.0-local.20261009213415` e ao Native `1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744`. Não modifica esse pacote. O root integra e compila exclusivamente a versão seguinte; o agente não usou o build compartilhado nem ativou uma placa, driver ou saída do operador.

O caminho implementado seleciona uma fonte reconhecida pelo libobs como HDR/float por UUID, preserva renderização RGBA16F em view própria e gera P416 limitado PQ ou HLG. A conversão final é YUV444 Rec.2020 de 16 bits para RGBX10LE limitado, com alinhamento de 256 bytes e sem estágio SDR8. A mesa SDR permanece independente. A escolha de modo/FPS HDR vem da lista completa do driver, separada dos modos SDR compatíveis com o FPS do projeto.

O plugin exige `BMDDeckLinkSupportsHDRMetadata`, `BMDDeckLinkSupportsColorspaceMetadata`, dynamic range PQ/HLG correspondente, conexão SDI já selecionada no Desktop Video Setup, flag Rec.2020 no modo e `DoesSupportVideoMode` aceitando exatamente RGB10 sem conversão. O preflight consulta o driver; não altera conexão nem inicia a saída. Fonte SDR, áudio privado, alpha e keyer HDR são recusados. Os metadados de mastering são fornecidos e confirmados explicitamente; não são inferidos a partir do arquivo nem do pico global do monitor.

Cada frame SDK envolve os metadados EOTF/Rec.2020, primárias, branco, mastering e CLL/FALL da configuração. Interfaces ancillary são encaminhadas ao frame real. O envio usa até quatro frames SDK de preroll e três buffers próprios; dispositivos que exigem mais de quatro frames de preroll são recusados nesta rota. Falhas de ativação desligam callback/playback/áudio/vídeo em ordem. Fechamento impede novas chamadas, detach/stop fora do mutex e libera filas após os callbacks.

O áudio HDR usa PCM estéreo 48 kHz timestamped e o relógio de vídeo, incluindo o tempo de preroll; falha ou escrita parcial é registrada. A fórmula de PTS foi testada por contrato, mas sincronismo e preroll reais no cabo continuam parte da homologação física. SDR conserva seu caminho de áudio anterior. A configuração salva no perfil possui `autoStart:false`, sem ligar ao abrir ou ao verificar.

Também foram corrigidos problemas concretos do suporte DeckLink: a fila de nós original não reciclava o cache e o esgotava após três pushes; agora há um ring limitado com wrap/full guard. O frame de captura alocava duas bytes por pixel mesmo em formatos RGB/10 bits e destruía um array com `delete`; agora stride/alocação respeitam BGRA, RGBX10LE e v210, com `delete[]`. Esses ajustes possuem testes isolados, sem afirmar que explicam todos os crashes antigos do usuário.

## Provas executadas

- `qa-finalizacao/sdi-hdr/resultado-contract.json`: headers/enums reais do SDK, 877 níveis de cinza RGB10 de 64 a 940, comparação RGB/UV com referência escalar, erro máximo 0, stride/alinhamento/padding/guard, PQ/HLG, refusas de capacidades/fonte/metadata e rollback em quatro etapas. A conversão de 1080p mediu cerca de 2,1 ms por frame nesta máquina; mede somente conversão de pixels, sem GPU, cópias, SDK ou carga física.
- `resultado-sdk-frame.json`: execução do wrapper verdadeiro com um frame SDK mock. Doze campos de metadata PQ/HLG, snapshot dos valores, flag HDR, Rec.2020, interfaces ancillary, formato/stride; 100 mil ciclos de reciclagem e 200 mil frames concorrentes na fila real.
- `resultado-syntax.json` e `resultado-frontend-syntax.json`: `cl /Zs` dos quatro fontes plugin e do header frontend; includes/SDK gerados apenas lidos do build compartilhado. Não substituem build/link do root.
- `resultado-js-contract.json`: nove verificações da normalização e integração `OutputEngine`; doze pedidos inválidos recusados, UUID HDR sem conversão para cena, SDR independente, preflight/salvar sem start, start do perfil persistido e erro do driver devolvido.
- `resultado-ui.json` e `ui-600.png`: controles reais em Edge com estado de comandos simulado, confirmação de metadata, ausência de autostart, configurações ativas bloqueadas, rascunho preservado, PQ→HLG e modo próprio 50 FPS, sem overflow em 600 px ou erros de browser. O mock não simula sinal SDI real.

## O que falta de verdade

Atualização pós-build: root compilou/linkou o conjunto Native `772db16`. `resultado-native-guards.json` passou seis casos com EXE `50327ff7df67627533b2a2560d8be2a877858ccd79a350b6905a9a5ba52878d4`, DeckLink `b7336a8f88ca4b827b565a4bc75f632990c9772d05f1048a14f9ddd375e8e079`, obs.dll `f78813a5d33bcdff88900bf38c7e591a94662e41c378eed9b31f4e02fff13367`, frontend API `bd76bf520d8bab1445cacdc8898f96e3d247866773da9aa6c658f22496c642a9` e obs-ffmpeg stage2 `148c90f88c9deae26e2c28ee22fb3ed7dba3afd25bdb7e00f1091b53d9553b30`. O rundir inteiro foi congelado e sobreposto a uma raiz TEMP própria, com portas efêmeras; a prova não mistura EXE novo com core antigo. `resultado-coherent-stage2-payload.json` verifica também os binários/dependências do clone.

O Native reconheceu a fonte PQ pelo UUID, recusou SDR rotulado HDR, alpha/keyer/FillKey e hardware ausente, manteve SDI inativo e fechou exit0 sem crash. Esta máquina não inicializou o módulo DeckLink: o log informa que não foi possível criar o iterator e que os drivers podem não estar instalados. Assim, a rejeição de ausência de contrato foi real, mas a consulta de capacidades de uma placa compatível não foi executada. A mensagem genérica atual sugere atualizar o motor quando falta o plugin; nesta prova o motor está atualizado e o limite concreto é a ausência do driver SDK. O log registrou uma alocação não liberada no encerramento, sob investigação com as comparações de baseline do root; não há atribuição garantida a upstream nem prova de crescimento contínuo.

O recibo preserva `pluginLoaded:false`, `hdrOutputImplemented:false`, `runtimeHdrSupportConclusion:INCONCLUSIVE_DECKLINK_MODULE_NOT_INITIALIZED` e `decklinkCapabilitiesActuallyQueried:false`. O PASS cobre guards negativos e fechamento. A compilação das fontes está registrada separadamente; não é PASS de suporte HDR no runtime nem de sinal físico.

Após a prova, o root aplicou o refinamento de mensagem em Native `a98f62b`: “Plugin/driver DeckLink não inicializou ou esta versão não expõe o contrato HDR. Verifique Desktop Video/placa e a versão do FreeMix”. Esse texto não pertence ao EXE stage2 testado. O próximo build/pacote deve repetir os guards; o patch isolado e seus recibos estão no allowlist, sem compilação adicional pelo agente.

1. Build/link e startup/recusa sem placa: concluídos pelo root e pelo runner isolado descrito acima. Nenhum resultado foi atribuído ao executável antigo.
2. Placa/driver SDI que anunciem todos os contratos, monitor/analisador ou captura HDR conhecida, receptor PQ/HLG e conteúdo HDR de referência. Medir sinal de 10 bits, EOTF/primárias/metadados, áudio/PTS, carga e stop/restart. Não há evidência física nesta execução; conectar qualquer DeckLink não garante suporte ao formato exigido.
3. Metadados reais do conteúdo para preencher mastering/CLL/FALL. A UI oferece sugestões editáveis e exige confirmação. O programa não deve inventar esses valores.

## Contratos primários

Os símbolos são do SDK Windows já presente em `plugins/decklink/win/decklink-sdk` e do header gerado `build_2026/plugins/decklink/DeckLinkAPI.h`. O formato RGBX10LE e o alinhamento vêm do [manual DeckLink SDK](https://documents.blackmagicdesign.com/UserManuals/DeckLinkSDKManual.pdf?_v=1721631610000). As APIs de metadata, atributos de dispositivo e interfaces ancillary estão nos documentos oficiais [HDR metadata](https://sdk-doc.blackmagicdesign.com/decklink-sdk/HighLevel/hdrmetadata.html), [BMDDeckLinkAttributeID](https://sdk-doc.blackmagicdesign.com/decklink-sdk/DeckLinkAPI/enums/bmddecklinkattributeid.html) e [ancillary](https://sdk-doc.blackmagicdesign.com/decklink-sdk/HighLevel/ancillary.html).

A rota R10L direta do libobs deste checkout não implementa a saída adequada: cairia em BGRA. Por isso não foi usada como falsa precisão. P416 tem texturas RGBA16F, superfícies R16/RG16 e shaders PQ/HLG concretos em `libobs/obs.c`, `obs-video.c` e `data/format_conversion.effect`.
