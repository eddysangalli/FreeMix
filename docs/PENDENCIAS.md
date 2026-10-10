# FreeMix — PENDENCIAS / fontes060000

Estado em 10/10/2026: **035000 continua selecionado e aprovado no seu ensaio local.** 050500 foi selado e instalado, mas o verificador falhou ao observar a saída da API; esse FAIL foi preservado. Dois fechamentos Native24 tiveram contador zero/crash zero. Diagnóstico e desinstalação passaram numa continuação separada, que não transforma o ensaio completo em PASS.

**060000/Native24/a047860 contém correções posteriores nas fontes; ainda aguarda novo pacote e QA instalada.** Foram reproduzidos bloqueio de HDR sem prazo, perda de edição do retorno Calls após blur/poll e fallback indevido para Programa quando uma fonte desaparece. As fontes corrigidas têm os mesmos bytes dos drafts que passaram12 testes de corridas, eco do estado, fontes ausentes e HTTP real com corpo incompleto. Abrir ou consultar estas telas não inicia transmissão. Nenhuma mesa do operador foi substituída.

Pendências implementáveis atuais: finalizar pacote060000; retorno custom contínuo das Calls com sincronismo; confirmação desktop dos editores; contratos GTZIP fora da matriz documentada; NDI HDR após SDK. Recursos/testes externos não devem ser chamados de código concluído ou aprovação física.

Retorno Calls de entrada/composição: **JPEG640×360 até5fps**, limite de software. Vídeo contínuo25/30fps por fonte ainda precisa implementação e medição; uma frente isolada investiga PTS, buffers limitados e sincronismo com N-1. Programa usa câmera virtual, sem garantia da taxa efetiva neste registro.

Properties/Filters: handoff queued não comprova visibilidade, foco ou z-order desktop. NDI HDR depende de Advanced SDK/licença e implementação. Hardware ASIO/SDI/PTZ/controladores, convidados/TURN/WAN/VPS, receptor/monitorHDR, carga prolongada e Windows limpo continuam gates reais. GTZIP finito não implica suporte universal a templates, imagens, feeds ou3D. Não retomar alpha WebBrowser abortado; ponte nativa permanece beta separada. Assinatura interna Ed25519 não substitui Authenticode.

Provas públicas: [correções e12testes](evidencias/20261010-calls-hdr-timeout/revision2/README.md); [050500 em duas fases](evidencias/20261010-setup050500-two-phase/qa-finalizacao/setup-050500-continuation/report.json). Os recibos antigos permanecem íntegros.

Histórico anterior completo, preservado byte a byte: [arquivo histórico](historico/20261010-pre060000/PENDENCIAS.md). As instruções vigentes são as desta página.
