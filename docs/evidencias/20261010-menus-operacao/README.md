# Menus e operação: correções integradas nas fontes

Calls agora começa pelos convidados e pelos retornos; sem convidados mostra uma instrução de adicionar Call. Destinatários do talkback aparecem com nomes; o último convidado removido encerra a lease antes de esconder os controles. Em desktop, retornos ficam à esquerda e talkback à direita; no celular os blocos empilham sem largura extra. Ajustes técnicos ficam recolhidos.

O navegador isolado encontrou um erro real: o handler genérico de data-route enviava audio_bus ao salvar retorno. A correção restringe esse handler à página Áudio. A prova posterior registra apenas call_return_route e call_rapid_targets esperados. Salvar mostra confirmação somente depois do estado do motor coincidir com o rascunho. Essa última confirmação passou em VM; as capturas de layout foram anteriores à mudança desse texto.

SRT e MultiStream têm três etapas: destino, conteúdo/áudio, conferir/iniciar. A capacidade usa a lista real compartilhada e a mesma regra de vagas; a transmissão principal é separada. Os três passos de cada contexto foram conferidos em navegador. Não foram acionados salvar/iniciar/parar nesse ensaio visual. As capacidades, nomes e endereços dessas imagens são sintéticos, não prova de receptor ou transmissão real.

90 checks relevantes PASS:20 Calls atuais+35 lease/roteamento+7 dispatch genérico+28 saídas/guardas. Os testes VM e as capturas são distintos de Native, áudio, PCM/N-1, Calls com convidados e hardware. O instalador600 e a mesa do operador permaneceram intactos.
