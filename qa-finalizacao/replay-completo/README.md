# QA do replay contínuo

Execute a partir da raiz do repositório. FFmpeg/FFprobe ficam em runtime ou nas variáveis FREEMIX_FFMPEG e FREEMIX_FFPROBE. Para QA de navegador, instale Playwright separadamente ou informe FREEMIX_PLAYWRIGHT_MODULE; FREEMIX_BROWSER permite indicar Edge/Chromium. Nenhuma chamada ao motor real nesses quatro testes: inventário é simulado, mídia/HTTP/browser são reais. Recibos executados estão em docs/evidencias-replay-continuo. O ensaio nativo adicional usa raiz QA criada pelo instalador e não deve ser executado sobre a mesa do operador.
