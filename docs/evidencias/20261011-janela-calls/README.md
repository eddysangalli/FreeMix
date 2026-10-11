# Janela "Chamada de Vídeo" (Calls) — 11/10/2026

Janela nova no molde do vMix (*Video Call* + *Call Manager*): `painel/remoto/calls.html`, `calls.js`, folha `vmix-dialogo.css`.
Novos comandos no programa: `call_create`, `call_reset_password`, `call_link` (`ferramentas/calls-producao.mjs`).

## O que foi conferido
`test-calls.mjs` (cópia do roteiro usado) abre a janela num navegador real, clica com mouse de verdade e confere cada efeito no estado do programa, numa cópia de teste própria (motor Native38 `ed08547`). Resultado: **29 de 29** — veja `RESULTADO-cliques.txt`.

A janela também foi aberta dentro do próprio programa (cópia de teste) e fotografada: `janela-calls-no-programa.png`. Os outros retratos (`1-…` a `4-…`) são do navegador de teste.

## Limites — o que NÃO foi executado
- **Preparar retornos / Parar retornos**: o teste confere que o clique aplica antes o que estava pendente e envia o comando certo, mas o comando é respondido pelo próprio teste, não pelo programa. Executar de verdade publica um retorno por um serviço de internet; isso não foi feito neste ensaio. O código de preparar retornos não mudou nesta rodada.
- **Área de transferência**: o texto copiado é capturado dentro da página; a área de transferência do computador não é tocada.
- **Segure para falar** só foi conferido no caso "falta o microfone do diretor" (explica e não abre nada). Abrir o microfone de verdade não foi ensaiado aqui, para não ligar o microfone do computador num teste.
- Nenhum convidado real entrou numa chamada neste ensaio: estados "CONECTADO" e diagnóstico de rede não foram vistos ao vivo.
- Criar uma chamada faz a fonte da entrada abrir a página do serviço de chamadas, como no uso normal.
