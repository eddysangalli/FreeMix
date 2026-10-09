# HTML com versões horizontal e vertical

O sincronizador aceita fontes `browser_source` com URL `file:` dentro de `painel/gc`, UUIDs distintos e dimensões horizontal/vertical. A URL de cada fonte deve conter `#` seguido do JSON codificado com `encodeURIComponent`, incluindo `n` (nome único dos eventos) e `d` (dados iniciais).

O autor coloca um manifesto ao lado da página, chamado `pagina.html.freemix.json` ou `manifest.json` na mesma pasta:

```json
{
  "freemixCompatibility": {
    "version": 1,
    "animation": true,
    "clock": true,
    "style": true,
    "styleFields": [
      {"key":"foreground","type":"color","default":"#ffffff"},
      {"key":"fontSize","type":"number","min":70,"max":140,"default":100}
    ]
  },
  "fields": [{"key":"title","type":"text","default":"Título"}]
}
```

A página declara `window.FreeMixGCCompatibility = {version:1,animation:true,clock:true,style:true}` e implementa `window.GC` com `configure(timeline)`, `play(data)`, `stop()` e `update(data)`. Ela carrega `gc.js` compartilhado depois de inicializar essas funções.

`configure` recebe `clockStartedAt`, `animationStartedAt` (Unix em milissegundos) e `style` com os campos declarados. O autor usa `Date.now() - clockStartedAt` para o relógio e sincroniza `Animation.currentTime` com `Date.now() - animationStartedAt`. `update` deve preservar a fase e o relógio; o botão de reinício envia um novo epoch. As versões compartilham campos declarados nas duas páginas, sem impor a mesma posição/layout.

Declaração é um contrato do autor, não inspeção automática de scripts de terceiros. Não marque `clock` ou `style` como verdadeiros sem implementar essas funções. GTZIP convertido declara somente animações; os avisos de conversão continuam no manifesto. Modelos próprios FreeMix implementam também relógio e estilo. Sincronização local não promete precisão de genlock nem conversão universal de HTML/GTZIP proprietário.
