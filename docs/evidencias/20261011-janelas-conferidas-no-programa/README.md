# As seis janelas novas, conferidas com o programa de verdade — 11/10/2026

Janelas: Configurações de streaming (`/transmitir`), Chamada de Vídeo (`/calls`), Saídas externas (`/externo`), Configuração de gravação (`/gravar`), MultiGravação (`/multicorder`), Configurações do Replay (`/replay?view=settings`).

## Como foi conferido
Uma cópia de teste própria do programa (pasta e portas próprias, motor Native38 `ed08547`, painel e ferramentas deste repositório) fica aberta; cada roteiro abre a janela num navegador real, clica com mouse de verdade e lê o efeito **no estado do programa e no disco**. `RESULTADO-cliques.txt` é a saída da bateria completa; as pastas `retratos-*` têm os retratos de cada passo; os roteiros estão em `roteiros/`.

| Janela | Verificações | O que foi real |
|---|---|---|
| Streaming | 19 | destinos 1 e 2 no ar em servidores RTMP locais de teste, parar, iniciar tudo, destino que não responde |
| Chamada de Vídeo | 29 | criar chamada, redefinir senha, retorno por convidado, talkback para quem, salvar |
| Saídas externas | 17 | NDI 1 e OMT 2 enviando e parando (nome de teste, rede local), câmera virtual liga/desliga, tela cheia aceita |
| Gravação | 15 | salvar formato/qualidade/codec/pasta e **gravar de verdade** um MP4 tolerante a falhas na pasta escolhida |
| MultiGravação | 12 | **gravar de verdade** uma entrada em MPEG-2 TS, duração andando, parar, arquivo no disco |
| Replay | 12 | gravação de replay de uma entrada iniciada e parada, retenção, áudio, opções da câmera |

Também conferido na janela real do programa (não no navegador): a janela de gravação abre no tamanho pedido e **o botão Cancelar fecha a janela** (`scripts/qa/clicar-janela.ps1` clica dentro da janela do programa sem mover o mouse).

## Limites — o que NÃO foi provado aqui
- **Calls:** "Preparar retornos" só como comando enviado (executar publica um retorno por serviço de internet); nenhum convidado real; microfone do diretor não foi aberto.
- **Streaming:** só servidores RTMP locais de teste; nenhuma plataforma real.
- **Externo:** ninguém recebeu o NDI/OMT do outro lado (só o estado "enviando" do programa); SDI/DeckLink e SRT continuam no editor avançado e não foram tocados; "tela cheia" foi conferida como pedido aceito.
- **Gravação / MultiGravação / Replay:** imagem de teste é uma cor lisa; nenhuma câmera física. MultiGravação em MKV com imagem parada é recusada pelo motor (limite registrado em `docs/CONTINUAR.md`).
- **Fechar a janela dentro do programa** foi conferido clicando em uma janela (gravação); as outras usam o mesmo caminho (`fechar-janela.js`), sem clique individual na janela real.
- Tudo rodou numa cópia de teste. **Nada disto estava na mesa do operador no momento do ensaio.**
