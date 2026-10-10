# Gate3 — FAIL preservado; análise do domínio de ganho

Uma rodada autorizada, Native26 congelado31a/cb083, candidato600. A tentativa run-oks3R7 terminou FAIL na assert `Main single gain in tagged SDR ROI`; não foi repetida e não há aprovação beta. Node launcher exit1 decorre da assert; Native54060 e os dois receptores encerraram cooperativamente exit0, crash0/allocation0/Meter0/double0/remaining0. Full2085 Native source+clone/9582signedbase/manifest/signature/plano/cinco dependências/arquivos independentes PASS. Gate3 AL19 e launcherAL11 pós-ensaio conferidos adicionalmente, sem alterações.

Os oito keyers reais1..8 carregaram exatamente nos canais7..14. Eventos VendorEvent reais confirmaram seleção/canal. O screenshot Main oficial baseline contém os oito marcadores, incluindo alpha128 no último; as duas PNGs públicas foram revistas visualmente e copiadas byteidênticas. Esta falha já não é a preparação default/nove keyers da tentativa anterior.

## Achado medido

Na rampa, o primeiro cinza passou de157 para87, o segundo173→96 e o terceiro189→105. Razões em RGB codificado≈0,554/0,555/0,556. O branco255→142 também≈0,557. O estado antes/depois publicou ganho0,5583→0,5167 (cinco frames; captura/conclusão155,7ms), abrangendo essas razões. Não conhecemos o frame exato capturado. Aplicar EOTF sRGB aos mesmos samples gera razões lineares≈0,2827/0,2799/0,2776, distintas do ganho publicado. O harness exigia ganho único na luz linear sem um contrato Native que declarasse esse domínio; reproduzimos sua falha sem mudar limiares/receipt.

Isso **não prova double gain**: a linearização faz a razão aproximar o quadrado do ganho mesmo quando os valores codificados mostram uma aplicação. Não se deve converter silenciosamente o FAIL para PASS. Faltam black/OFF/restore/decodedPTS/PCM/NTSC/context reset.

## Cadeia de fontes (conferida contra HEAD31a; hashes em report.json)

- `libobs/obs-final-gate-render.h:11–18`: solid `(0,0,0,1-gain)`, render_texture atual, blend ONE/INVSRCALPHA; não chama `gs_enable_framebuffer_srgb` nem restaura esse flag. Gate ocorre após composição e rendered callbacks (`obs-video.c:220`). Solid shader retorna `color` sem EOTF/OETF (`data/solid.effect:20`).
- SDR NV12/709 seleciona render_space GS_CS_SRGB e target8bits; 10/16bits/HDR escolhem outros formatos (`obs.c:405`). Fonte async/desenho (`obs-source.c:2482/:4900`) habilita framebuffer-sRGB conforme configuração, depois restaura o flag anterior. Reuso/scaling normalmente termina com false (`obs-video.c:168/:316`), mas o gate herda o estado e não declara domínio.
- D3D11 `FlushOutputViews` escolhe renderTarget ou renderTargetLinear conforme `curFramebufferSrgb` (`d3d11-subsystem.cpp:896`); GS_RGBA usa UNORM normal ou UNORM_SRGB linear-view (`d3d11-subsystem.hpp:115/:128`, `d3d11-texture2d.cpp:216`). Flag false implica blend dos números codificados, coerente com as PNGs; flag true habilita conversão sRGB e blend linear em target8bit. Ausência de telemetria desse flag impede afirmar um contrato global apenas pelo estado JSON.
- Screenshot main (`ScreenshotObj.cpp:134`) chama `obs_render_main_texture`; `obs.c:2250` habilita framebuffer-sRGB e faz sample_srgb de render_texture com Draw, depois restaura flag. Para SDR→SDR, decode/reencode preserva o valor codificado anterior, sem novo fator de ganho. Download copia pixels RGBX8888 à PNG (`ScreenshotObj.cpp:178–197`), não os trata como luz linear.

A interpretação é sustentada por fontes e pixels do caminho atual; não é inspeção do estado GPU em execução, nem garante comportamento com rendered callbacks que deixem flags diferentes, target16F/HDR, rescaling ou outro backend.

## Contrato proposto ANTES de qualquer outra execução

Não há alteração de Native, runner, limiar ou retry nesta entrega. Propor decisão explícita Root entre dois contratos:

1. **Fade SDR em valores codificados**: declarar gainDomain='coded-sdr-rgb', limitar preflight a render_space/formato SDR8 conhecidos, definir/restaurar framebuffer-sRGB=false dentro do gate; medições de PNG devem operar no mesmo domínio, com ganho/frame vinculado. HDR/16F recusados nesta qualificação. Essa opção segue a medição atual, mas exige contrato explícito e validação futura separada.
2. **Fade em luz linear**: declarar gainDomain='linear-srgb', habilitar/restaurar framebuffer-sRGB=true para SDR8; tratar16F/HDR por contrato próprio. Manter a comparação EOTF existente. Isso é mudança de comportamento do Native e também precisa de nova build/qualificação.

Em qualquer opção, use contrato positivo do domínio/target e um ponto de rampa estável com serial/frameSeq/PTS + screenshot bracket. A janela temporal deve entrar no intervalo esperado (inclusive quantização conhecida), não ser compensada alargando tolerância. Continue verificando ganho único/ganho ao quadrado no MESMO domínio e em três cinzas/DSK/Programme, Source excluída, black/OFF/preservaçãoPGM/Preview e áudio unchanged sem alegar silêncio. Default betaOFF e UI geral sem mount até prova completa.
