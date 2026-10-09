# FreeMix Studio

Código do FreeMix baseado no OBS Studio 32.2.2, com interface de mesa de produção, saídas independentes, composições, GC, Calls, replay, áudio e automação.

Entrega local de referência: **0.1.0-local.20261009153453**. As funcionalidades e seus limites estão em [CONTINUAR.md](CONTINUAR.md). A lista concreta para terminar cada pendência está em [PENDENCIAS-REAIS.md](PENDENCIAS-REAIS.md).

Experimento [vídeo com alpha em uma entrada Web Browser](VIDEO-ALPHA-UMA-ENTRADA.md): **abortado pelo operador após reprovação com vídeo real no vMix**, por lentidão, travamentos e atraso local. Provas Edge/sintéticas foram preservadas como histórico e não homologam a rota. Serviço e envio de teste encerrados; sem áudio e sem teste WAN. Não altera a release nativa acima. [Análise dos bridges e bonding](ANALISE-BRIDGES-CHARGEXDEV.md).

## Código incluído

- `fork/`: série completa de onze patches sobre um commit upstream fixado, incluindo todas as alterações nativas da entrega.
- `ferramentas/`: API local, controle, áudio, saídas, Calls, bonding, recuperação, instalador, atualização e ZIP de diagnóstico.
- `painel/`: mesa, configuração, 156 presets de composição e biblioteca de títulos.
- `servidor/`: kit Linux para feed HTTPS, TURN e receptor, preparado para implantação explícita.
- `licenses/` e `docs/provenance/`: licenças, fontes locais de componentes modificados e referências/hashes das dependências.
- `docs/evidencias-ultima-rodada/`: recibos dos ensaios locais, com escopo e limites.

## Reconstrução e uso

Leia [BUILD-FROM-SOURCE.md](docs/BUILD-FROM-SOURCE.md). Os patches têm manifesto e verificação de hashes; um teste em índice isolado confere que reproduzem a árvore nativa local.

O Git guarda fontes e documentação. Binários, runtimes, builds, configurações do operador, gravações e chaves privadas não fazem parte do checkout. Os ZIPs locais assinados são descritos em [docs/releases/](docs/releases/). A fonte externa grande do Advanced Scene Switcher fica identificada pela proveniência/hash e acompanha o portátil completo.

Na máquina de desenvolvimento original, abra a instalação por `ABRIR-FREEMIX.cmd` na raiz do workspace, após salvar e fechar o FreeMix correspondente. Num portátil extraído, use `FreeMix Studio.cmd`. O launcher inicia motor e API juntos. Um clone deste repositório, sem os componentes compilados, não é um portátil pronto para executar.

`src/` e `plugins/obs-freemix/` são protótipos anteriores preservados como referência; o motor desta entrega é a série OBS em `fork/`. Documentos antigos de arquitetura/roadmap descrevem também intenções históricas e devem ser lidos junto do estado atual.

Transmitir abre MultiStream; Externo reúne SRT, NDI, OMT e SDI. O SRT tem conexão por modo/IP/porta/latência e ajustes avançados recolhidos. H.264 4:4:4 e alpha empacotado foram comprovados em loopback; o receptor OBS precisa do shader fornecido e Crop/Pad. Internet e Full HD continuam com validação pendente.

## Estado e pendências

Há provas locais para saídas/codecs, áudio, composições, recuperação, controles, NDI/OMT, replay e estabilidade no escopo descrito pelos relatórios. Isso não equivale a homologação de internet, placas, interfaces de áudio, todos os drivers ou todos os serviços de transmissão.

HDR completo, modelos GTZIP ainda não suportados e acabamento das telas têm trabalho restante. Calls externos, bonding WAN, vídeo/áudio/controladores físicos, destinos reais e Windows limpo precisam de uma rodada de validação dirigida. VPS/domínio e licenças são dependências explícitas. Critérios e trabalho para fechar cada item: [PENDENCIAS-REAIS.md](PENDENCIAS-REAIS.md).

O botão e `COLETAR-LOGS.cmd` geram diagnóstico local sanitizado, encaminhado manualmente por e-mail/WhatsApp. Nenhum envio automático de logs, serviço público ou transmissão externa é iniciado por este repositório.

## Licença

O fork do OBS mantém a licença GPL e os avisos correspondentes. Os componentes de terceiros mantêm suas licenças e termos próprios; consulte `LICENSE`, `licenses/` e os registros de proveniência antes de redistribuir.

Correção de estabilidade: fechamento reentrante de janelas CEF e limpeza do muxer SRT entre reconexões. Provas dirigidas acompanham docs/evidencias-encerramento. O vMix desta instalação rejeitou o perfil 4:4:4/alpha packed. Packed 4:2:0 chegou e foi recomposto manualmente com quatro entradas auxiliares; o receptor web adicional busca simplificar essa operação para uma entrada.

SRT: o novo modo lado a lado também usa H.264 4:2:0; Fill e Key separados usam duas portas. Recepção FFmpeg local validada em três modos, alpha 0/128/255; recomposição no vMix e sincronismo entre conexões permanecem testes externos. Veja SRT-VMIX.md.
