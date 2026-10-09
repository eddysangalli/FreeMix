# Externo: configuração direta de NDI, OMT e SDI

2026-10-09. Alteração limitada à interface de saídas. Nenhuma saída nativa foi iniciada, nenhum perfil do operador foi alterado e nenhum motor foi reiniciado nesta rodada.

## Arquivos de produto

- `obs-vmix/painel/remoto/saidas.html`: navegação Monitores/câmera virtual, NDI, OMT, SDI; instruções de alpha/PA16; destinos extras preservados no acesso normal.
- `obs-vmix/painel/remoto/saidas.js`: retirado o texto geral incorreto de rede sempre em 8 bits.
- `obs-vmix/painel/remoto/saidas-external-ui.js`: controles reais dos contratos existentes, estado e hidratação por protocolo/envio, rascunhos separados em sessionStorage, proteção de campos durante envio e leitura de câmera virtual.

O novo módulo precisa acompanhar o HTML no espelho e no pacote. Não houve alteração nativa desta frente. A raiz acrescenta `precisionBits`, `groups`, `backend` e `outputCreated` ao readback de cada emissor. Em motor anterior, precisão OMT configurada e ausente aparece como não informada e exige escolha explícita, sem afirmar que a saída era SDR8.

## Acessos

- Engrenagem Externo: `/saidas?context=external`.
- NDI: `/saidas?context=external&transport=ndi`.
- OMT/alpha/PA16: `/saidas?context=external&transport=omt`.
- SDI: `/saidas?context=external&transport=sdi`.
- Transmissões extras/mixes: `/saidas` continua abrindo o editor anterior.

Abrir qualquer aba apenas consulta. O botão Preparar teste PA16 muda o formulário, sem ligar nada. O envio só começa em Ligar NDI/OMT. Reiniciar usa a configuração confirmada do motor; rascunhos pendentes exigem parar e ligar após conferir os campos. Recarregar descarta explicitamente o rascunho daquele envio.

## Teste do usuário: OMT transparente

1. Crie/escolha uma imagem PNG transparente, GC ou composição sem fundo opaco. A câmera comum é opaca; selecionar alpha não remove seu fundo.
2. Abra OMT, escolha um dos envios, selecione Entrada/composição própria e escolha essa entrada.
3. Escolha o áudio desejado. A escolha de vídeo não muda automaticamente a origem de áudio.
4. Clique Preparar teste OMT alpha/PA16 ou selecione PA16. O alpha16 fica integrado nessa rota. Dê um nome único ao envio.
5. Clique Ligar OMT quando quiser enviar. No receptor compatível, escolha esse nome e componha sobre outra imagem para conferir a transparência.
6. Para comparar SDR8, pare o envio, escolha BGRA8 e ligue novamente. PA16 preserva precisão adicional do render/composição, mas conteúdo originalmente em 8 bits conserva seu limite. PA16 é SDR nesta rota; HDR não foi anunciado.

Fill+Key separado continua SDR8. PA16 usa um único envio com alpha16. SDI apresenta apenas dispositivos/modos/keyers reais, com início desabilitado se não houver placa.

## Evidência desta rodada

`testar-saidas-external-ui.mjs`: Edge real em viewport 1080x960 e 400x820, respostas API interceptadas por mock em 127.0.0.1:18221, sem servidor ou motor real. `resultado-saidas-external-ui.json`: 21 checks PASS, incluindo hidratação do envio2 PA16, preservação de rascunho em refresh/troca de protocolo/envio, payload explícito, proteção durante envio, fallback de precisão desconhecida, SDI ausente, projetor, câmera virtual, editor anterior, ausência de overflow e de erros de navegador.

Capturas inspecionadas: `saidas-externo-omt-pa16.png` e `saidas-externo-mobile.png`. Esta prova cobre interface e contrato. As provas de transporte/frames nativos permanecem nos recibos anteriores; não foram repetidas nem inferidas do mock.

## Prova dirigida com o motor real

`resultado-saidas-external-real.json`: 17 checks PASS na raiz `C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-Menus-20261009`, WebSocket14610/API18310, motor identificado como PID80436 e caminho privado conferido antes das ações. A API estava conectada quando a prova começou. Somente os três arquivos de interface foram copiados para essa raiz; nenhum binário foi substituído nem reiniciado.

Lidos OMT senderId0 e senderId1 reais: precisionBits8, groups string, backend e outputCreated por envio. O envio1 já estava ativo quando a prova começou; foi preservado. O envio2 estava e permaneceu parado. A janela CEF própria abriu por `open_panel`, e `get_interface` confirmou visibilidade e independência. Edge carregou a mesma página e API reais: leitura dos dois emissores, rascunho preservado em refresh, preparação de PA16/alpha16 e seleção da entrada transparente TITLE26 com botão Ligar habilitado. Não houve clique em Ligar nem pedido de start/stop/restart. O estado nativo final do envio2 prova active=false/outputCreated=false.

Captura real: `saidas-externo-omt-real.png`. A janela QA ficou aberta para conferência da raiz; não foi encerrada nem interferiu na instância do operador. A prova valida estado/UI reais e janela nativa; não repete a validação dos frames PA16 do recibo de vídeo anterior.
