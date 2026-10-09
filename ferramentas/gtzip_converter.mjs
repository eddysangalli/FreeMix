/**
 * FreeMix GT Title Converter
 * Converte pacotes vMix GT Title (.gtzip) para templates broadcast HTML5/SVG/CSS3
 * 100% puro Node.js sem dependências externas.
 */

import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import { convertColor, parseAttributes, parseCoords } from './gt_utils.mjs';

/**
 * Tokenizer / Mini XML Parser para extrair estrutura de document.xml do GT Title
 */
export function parseGtXml(xmlContent) {
  // Limpar BOM e comentários
  let cleanXml = xmlContent.replace(/^\uFEFF/, '').replace(/<!--[\s\S]*?-->/g, '').trim();

  // Dimensões raiz
  const rootCompMatch = cleanXml.match(/<Composition\s+([^>]+)>/i);
  const rootAttrs = rootCompMatch ? parseAttributes(rootCompMatch[1]) : {};
  const width = parseFloat(rootAttrs.Width) || 1920;
  const height = parseFloat(rootAttrs.Height) || 1080;
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<16||height<16||width>8192||height>8192)throw Error("Dimensões do título fora de 16 a 8192 pixels");
  const warnings=[];if(/<!DOCTYPE|<!ENTITY/i.test(cleanXml))throw Error('DTD/entidades externas não permitidas em títulos');
  for(const node of cleanXml.matchAll(/<Brush\s+([^>]+)>?/gi)){const type=parseAttributes(node[1]).Type;if(type&&!['Solid','SolidColor','LinearGradient','Bitmap'].includes(type))warnings.push('Brush não convertido: '+type);}
  for(const tag of [...new Set([...cleanXml.matchAll(/<(Video|Group|Mesh|Effect|Particle|Shader|ImageSequence)\b/gi)].map(m=>m[1]))])warnings.push("Elemento não convertido: "+tag);

  const layers = [];
  const storyboards = [];

  // Extrair Storyboards
  const sbRegex = /<Storyboard(\s+[^>]*)?>([\s\S]*?)<\/Storyboard>/gi;
  let sbMatch;
  while ((sbMatch = sbRegex.exec(cleanXml)) !== null) {
    const sbAttrs = sbMatch[1] ? parseAttributes(sbMatch[1]) : {};
    const sbType = sbAttrs.Type || 'TransitionIn';
    const anims = [];
    const animRegex = /<(Fade|Fly|Zoom|Rotate|None)\s+([^>]+)\/>/gi;
    let aMatch;
    while ((aMatch = animRegex.exec(sbMatch[2])) !== null) {
      const aAttrs = parseAttributes(aMatch[2]);
      anims.push({
        type: aMatch[1],
        target: aAttrs.Object,
        delay: parseFloat(aAttrs.Delay) || 0,
        duration: aAttrs.Duration===undefined?.5:Math.max(0,Math.min(30,parseFloat(aAttrs.Duration)||0)),
        scale:Math.max(.01,Math.min(10,parseFloat(aAttrs.Scale)||.01)),
        angle:Math.max(-360,Math.min(360,parseFloat(aAttrs.Angle)||90)),
        direction: aAttrs.Direction || 'Left',
        interpolation: aAttrs.Interpolation || 'CubicEasingIn'
      });
    }
    for(const node of sbMatch[2].matchAll(/<([A-Za-z][\w]*)\s+([^>]+)\/>/g)){const a=parseAttributes(node[2]);if(a.Object&&!['Fade','Fly','Zoom','Rotate','None'].includes(node[1]))warnings.push('Animação não convertida: '+node[1]+' ('+a.Object+')');}storyboards.push({ type: sbType, animations: anims });
  }

  // Extrair todas as Layers
  // Cada Layer tem Name, Dimensions="W,H,D", Location="X,Y,Z"
  const layerRegex = /<Layer\s+([^>]+)>([\s\S]*?)<\/Layer>/gi;
  let layerMatch;
  while ((layerMatch = layerRegex.exec(cleanXml)) !== null) {
    const lAttrs = parseAttributes(layerMatch[1]);
    const lDim = parseCoords(lAttrs.Dimensions, [width, height, 0]);
    const lLoc = parseCoords(lAttrs.Location, [0, 0, 0]);

    const layer = {
      name: lAttrs.Name || `Layer_${layers.length + 1}`,
      x: lLoc[0],
      y: lLoc[1],
      width: lDim[0],
      height: lDim[1],
      elements: []
    };

    const layerBody = layerMatch[2];
    const tickerRanges=[...layerBody.matchAll(/<Ticker\s+[^>]+>[\s\S]*?<\/Ticker>/gi)].map(m=>[m.index,m.index+m[0].length]);

    // Extrair Rectangles
    const rectRegex = /<Rectangle\s+([^>]+)>([\s\S]*?)<\/Rectangle>/gi;
    let rMatch;
    while ((rMatch = rectRegex.exec(layerBody)) !== null) {
      const rAttrs = parseAttributes(rMatch[1]);
      const rDim = parseCoords(rAttrs.Dimensions, [100, 100, 0]);
      const rLoc = parseCoords(rAttrs.Location, [0, 0, 0]);
      const rRadius = parseCoords(rAttrs.Radius, [0, 0, 0]);
      const rBody = rMatch[2];

      const rect = {
        type: 'Rectangle',
        name: rAttrs.Name || 'Rect',
        x: rLoc[0],
        y: rLoc[1],
        width: rDim[0],
        height: rDim[1],
        radiusX: rRadius[0],
        radiusY: rRadius[1],
        opacity: rAttrs.Opacity !== undefined ? parseFloat(rAttrs.Opacity) : 1,
        strokeThickness: parseFloat(rAttrs.StrokeThickness) || 0,
        fill: parseBrush(rBody, 'Rectangle.Fill'),
        stroke: parseBrush(rBody, 'Rectangle.Stroke')
      };
      rect.order=rMatch.index;layer.elements.push(rect);
    }

    // Extrair TextBlocks
    const tbRegex = /<TextBlock\s+([^>]+)>([\s\S]*?)<\/TextBlock>/gi;
    let tbMatch;
    while ((tbMatch = tbRegex.exec(layerBody)) !== null) {
      if(tickerRanges.some(([start,end])=>tbMatch.index>=start&&tbMatch.index<end))continue;
      const tbAttrs = parseAttributes(tbMatch[1]);
      const tbDim = parseCoords(tbAttrs.Dimensions, [200, 50, 0]);
      const tbLoc = parseCoords(tbAttrs.Location, [0, 0, 0]);
      const tbBody = tbMatch[2];

      const textBlock = {
        type: 'TextBlock',
        name: tbAttrs.Name || 'Text',
        x: tbLoc[0],
        y: tbLoc[1],
        width: tbDim[0],
        height: tbDim[1],
        text: tbAttrs.Text !== undefined ? tbAttrs.Text : '',
        fontFamily: tbAttrs.FontFamily || 'Segoe UI, sans-serif',
        fontSize: parseFloat(tbAttrs.FontSize) || 36,
        fontWeight: tbAttrs.FontWeight || 'normal',
        fontStyle: tbAttrs.FontStyle || 'normal',
        textAlign: (tbAttrs.TextAlign || 'Left').toLowerCase(),
        verticalAlign: (tbAttrs.VerticalAlign || 'Center').toLowerCase(),
        wordWrap: tbAttrs.TextWordWrapping === 'Wrap',
        strokeThickness: parseFloat(tbAttrs.StrokeThickness) || 0,
        fill: parseBrush(tbBody, 'TextBlock.Fill'),
        stroke: parseBrush(tbBody, 'TextBlock.Stroke')
      };
      textBlock.order=tbMatch.index;layer.elements.push(textBlock);
    }

    // Extrair Images
    const imgRegex = /<Image\s+([^>]+)>([\s\S]*?)<\/Image>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(layerBody)) !== null) {
      const imgAttrs = parseAttributes(imgMatch[1]);
      const imgDim = parseCoords(imgAttrs.Dimensions, [100, 100, 0]);
      const imgLoc = parseCoords(imgAttrs.Location, [0, 0, 0]);
      const imgBody = imgMatch[2];

      const bmpMatch = imgBody.match(/<Bitmap\s+Source="([^"]*)"/i);
      const src = bmpMatch ? bmpMatch[1] : '';

      const image = {
        type: 'Image',
        name: imgAttrs.Name || 'Image',
        x: imgLoc[0],
        y: imgLoc[1],
        width: imgDim[0],
        height: imgDim[1],
        sizeMode: imgAttrs.SizeMode || 'Stretch',
        source: src
      };
      image.order=imgMatch.index;layer.elements.push(image);
    }

    // Extrair Tickers
    const tickerRegex = /<Ticker\s+([^>]+)>([\s\S]*?)<\/Ticker>/gi;
    let tickMatch;
    while ((tickMatch = tickerRegex.exec(layerBody)) !== null) {
      const tickAttrs = parseAttributes(tickMatch[1]);
      const tickDim = parseCoords(tickAttrs.Dimensions, [width, 80, 0]);
      const tickLoc = parseCoords(tickAttrs.Location, [0, 0, 0]);
      const tickBody = tickMatch[2];

      const templateTbMatch = tickBody.match(/<TextBlock\s+([^>]+)>/i);
      const tbAttrs = templateTbMatch ? parseAttributes(templateTbMatch[1]) : {};

      const ticker = {
        type: 'Ticker',
        name: tickAttrs.Name || 'Ticker',
        x: tickLoc[0],
        y: tickLoc[1],
        width: tickDim[0],
        height: tickDim[1],
        speed: parseFloat(tickAttrs.Speed) || 4,
        fontFamily: tickAttrs.FontFamily || tbAttrs.FontFamily || 'Segoe UI, sans-serif',
        fontSize: parseFloat(tickAttrs.FontSize) || parseFloat(tbAttrs.FontSize) || 36,
        fontWeight: tickAttrs.FontWeight || tbAttrs.FontWeight || 'bold',
        text: tbAttrs.Text || 'Ticker text',
        fill: parseBrush(tickBody, 'Ticker.Fill')
      };
      ticker.order=tickMatch.index;layer.elements.push(ticker);
    }

    const shapeRegex=/<(Ellipse|Polygon|Path)\s+([^>]+?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;let shapeMatch;while((shapeMatch=shapeRegex.exec(layerBody))){const type=shapeMatch[1],attrs=parseAttributes(shapeMatch[2]),dim=parseCoords(attrs.Dimensions,[100,100,0]),loc=parseCoords(attrs.Location);let geometry='';if(type==='Polygon'){geometry=attrs.Points||'';if(!/^[\d.,+\-\s]+$/.test(geometry)||geometry.trim().split(/[\s,]+/).length<6){warnings.push('Polygon sem Points numéricos: '+(attrs.Name||''));continue;}}if(type==='Path'){geometry=attrs.Data||'';if(!geometry||geometry.length>20000||!/^[MLCQAZHTVSmlcqazhtvs\d.,+\-\s]+$/.test(geometry)){warnings.push('Path não convertido: exige Data SVG compatível ('+(attrs.Name||'')+')');continue;}}layer.elements.push({type,name:attrs.Name||type,x:loc[0],y:loc[1],width:dim[0],height:dim[1],geometry,opacity:attrs.Opacity===undefined?1:Math.max(0,Math.min(1,Number(attrs.Opacity)||0)),strokeThickness:Math.max(0,Math.min(100,Number(attrs.StrokeThickness)||0)),fill:parseBrush(shapeMatch[3]||'',type+'.Fill'),stroke:parseBrush(shapeMatch[3]||'',type+'.Stroke'),order:shapeMatch.index});}layer.elements.sort((a,b)=>a.order-b.order);
    layers.push(layer);
  }

  return { width, height, layers, storyboards, warnings };
}

/**
 * Faz parse de Brushes (SolidColor ou LinearGradient)
 */
function parseBrush(xmlSnippet, tagPrefix) {
  const containerRegex = new RegExp(`<${tagPrefix}>([\\s\\S]*?)<\\/${tagPrefix}>`, 'i');
  const containerMatch = xmlSnippet.match(containerRegex);
  if (!containerMatch) return { type: 'Solid', color: '#FFFFFFFF' };

  const content = containerMatch[1];
  const brushMatch = content.match(/<Brush\s+([^>]+)>([\s\S]*?)<\/Brush>|<Brush\s+([^>]+)\/>/i);
  if (!brushMatch) return { type: 'Solid', color: '#FFFFFFFF' };

  const attrsStr = brushMatch[1] || brushMatch[3] || '';
  const innerContent = brushMatch[2] || '';
  const attrs = parseAttributes(attrsStr);

  const brushType = attrs.Type || 'Solid';
  if (brushType === 'LinearGradient') {
    const stops = [];
    const stopRegex = /<GradientStop\s+([^>]+)\/>/gi;
    let sMatch;
    while ((sMatch = stopRegex.exec(innerContent)) !== null) {
      const sAttrs = parseAttributes(sMatch[1]);
      const pos = sAttrs.Position !== undefined ? parseFloat(sAttrs.Position) : 0;
      const col = convertColor(sAttrs.Color || attrs.Color || '#FFFFFFFF');
      stops.push({ position: pos, color: col });
    }
    // Ordenar stops por posição crescente
    stops.sort((a, b) => a.position - b.position);
    if (stops.length === 0) {
      stops.push({ position: 0, color: convertColor(attrs.Color || '#FFFFFFFF') });
      stops.push({ position: 1, color: convertColor(attrs.Color || '#FFFFFFFF') });
    }
    const startPoint = parseCoords(attrs.StartPoint, [0, 0]);
    const endPoint = parseCoords(attrs.EndPoint, [0, 1]);

    return {
      type: 'LinearGradient',
      startPoint,
      endPoint,
      stops
    };
  } else if (brushType === 'Bitmap') {
    const bmpMatch = innerContent.match(/<Bitmap\s+Source="([^"]*)"/i);
    const src = bmpMatch ? bmpMatch[1] : '';
    const filename = src ? path.basename(src.replace(/\\/g, '/')) : '';
    return {
      type: 'Bitmap',
      source: filename,
      rawSource: src
    };
  } else {
    return {
      type: 'Solid',
      color: convertColor(attrs.Color || '#FFFFFFFF')
    };
  }
}

/**
 * Converte Brush para regra CSS (background ou fill)
 */
function brushToCss(brush) {
  if (!brush) return 'transparent';
  if (brush.type === 'Bitmap') return 'transparent';
  if (brush.type === 'Solid') {
    return brush.color;
  }
  if (brush.type === 'LinearGradient') {
    // Calcular ângulo aproximado a partir de startPoint e endPoint
    const dx = brush.endPoint[0] - brush.startPoint[0];
    const dy = brush.endPoint[1] - brush.startPoint[1];
    let angleDeg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    if (angleDeg < 0) angleDeg += 360;

    const stopStrings = brush.stops.map(s => `${s.color} ${(s.position * 100).toFixed(1)}%`);
    return `linear-gradient(${angleDeg}deg, ${stopStrings.join(', ')})`;
  }
  return 'transparent';
}

/**
 * Gera documento HTML5/CSS3/JS independente compatível com OBS Browser Source e FreeMix
 */
export function generateHtml(gtData, templateTitle = 'FreeMix GT Template', assetFiles = {}) {
  const { width, height, layers, storyboards } = gtData;
  const warnings=gtData.warnings||(gtData.warnings=[]);
  const family=value=>String(value||"Arial").replace(/[^\p{L}\p{N} _-]/gu," ").trim()||"Arial";
  const fontRules=Object.entries(assetFiles).filter(([f])=>/\.(ttf|otf|woff2?)$/i.test(f)).map(([f,url])=>`@font-face{font-family:"${family(path.basename(f,path.extname(f)))}";src:url("${encodeURI(url).replaceAll("\"","%22").replaceAll("'","%27")}");font-display:swap;}`).join("\n");

  // Mapear animações de Storyboard
  const inStoryboard = storyboards.find(s => s.type === 'TransitionIn') || storyboards[0] || { animations: [] };
  const outStoryboard = storyboards.find(s => s.type === 'TransitionOut') || { animations: [] };

  // Identificar campos dinâmicos (TextBlocks e Tickers)
  const fields = [];
  layers.forEach(l => {
    l.elements.forEach(el => {
      if (el.type === 'TextBlock') {
        const isClock = el.text.includes('{0:');
        fields.push({
          id: el.name,
          label: el.name,
          type: isClock ? 'clock' : 'text',
          default: el.text,
          isClock
        });
      } else if (el.type === 'Ticker') {
        fields.push({
          id: el.name,
          label: el.name,
          type: 'ticker',
          default: el.text
        });
      } else if (el.type === 'Image') {
        fields.push({
          id: el.name,
          label: el.name,
          type: 'image',
          default: el.source ? path.basename(el.source.replace(/\\/g, '/')) : ''
        });
      }
    });
  });

  // Gerar CSS para cada elemento e camadas
  let cssRules = [];
  let htmlElements = [];

  layers.forEach(layer => {
    // Encontrar se layer ou seus filhos têm animação
    const lInAnim = inStoryboard.animations.find(a => a.target === layer.name);
    const lOutAnim = outStoryboard.animations.find(a => a.target === layer.name);

    let layerClasses = ['gt-layer'];
    let layerStyles = [
      `position: absolute`,
      `left: ${layer.x}px`,
      `top: ${layer.y}px`,
      `width: ${layer.width}px`,
      `height: ${layer.height}px`,
      `pointer-events: none`
    ];

    let layerHtml = `<div id="layer-${escapeId(layer.name)}" class="${layerClasses.join(' ')}" style="${layerStyles.join('; ')}" data-name="${escapeHtml(layer.name)}">`;

    layer.elements.forEach(el => {
      const elInAnim = inStoryboard.animations.find(a => a.target === el.name) || lInAnim;
      const elOutAnim = outStoryboard.animations.find(a => a.target === el.name) || lOutAnim;

      const safeId = escapeId(`${layer.name}_${el.name}`);
      let elemStyles = [
        `position: absolute`,
        `left: ${el.x}px`,
        `top: ${el.y}px`,
        `width: ${el.width}px`,
        `height: ${el.height}px`
      ];

      if(['Ellipse','Polygon','Path'].includes(el.type)){elemStyles.push('opacity: '+el.opacity);const fill=el.fill?.type==='Solid'?convertColor(el.fill.color):'transparent',stroke=el.stroke?.type==='Solid'?convertColor(el.stroke.color):'transparent';if(el.fill&&el.fill.type!=='Solid')warnings.push('Brush da forma '+el.name+' não convertido: '+el.fill.type);const shape=el.type==='Ellipse'?'<ellipse cx="'+el.width/2+'" cy="'+el.height/2+'" rx="'+el.width/2+'" ry="'+el.height/2+'"/>':el.type==='Polygon'?'<polygon points="'+escapeHtml(el.geometry)+'"/>':'<path d="'+escapeHtml(el.geometry)+'"/>';layerHtml+=`<svg id="obj-${safeId}" class="gt-object" data-name="${escapeHtml(el.name)}" style="${elemStyles.join('; ')}" viewBox="0 0 ${el.width} ${el.height}"><g fill="${escapeHtml(fill)}" stroke="${escapeHtml(stroke)}" stroke-width="${el.strokeThickness}">${shape}</g></svg>`;}else if (el.type === 'Rectangle') {
        if (el.fill && el.fill.type === 'Bitmap') {
          const filename = el.fill.source;
          const localImgPath = encodeURI(assetFiles[filename] || filename).replaceAll("'",'%27').replaceAll('(', '%28').replaceAll(')', '%29');
          elemStyles.push(`background-image: url('${localImgPath}')`);
          elemStyles.push(`background-size: 100% 100%`);
          elemStyles.push(`background-repeat: no-repeat`);
          elemStyles.push(`background-position: center`);
          elemStyles.push(`background-color: transparent`);
        } else {
          elemStyles.push(`background: ${brushToCss(el.fill)}`);
        }
        elemStyles.push(`opacity: ${el.opacity}`);
        if (el.radiusX || el.radiusY) {
          elemStyles.push(`border-radius: ${el.radiusX}px / ${el.radiusY}px`);
        }
        if (el.strokeThickness && el.stroke && el.stroke.type === 'Solid') {
          elemStyles.push(`border: ${el.strokeThickness}px solid ${brushToCss(el.stroke)}`);
          elemStyles.push(`box-sizing: border-box`);
        }
        layerHtml += `\n    <div id="obj-${safeId}" class="gt-object gt-rect" style="${elemStyles.join('; ')}" data-name="${escapeHtml(el.name)}"></div>`;
      } else if (el.type === 'TextBlock') {
        elemStyles.push(`display: flex`);
        elemStyles.push(`align-items: ${el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center'}`);
        elemStyles.push(`justify-content: ${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center'}`);
        elemStyles.push(`font-family: '${family(el.fontFamily)}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`);
        elemStyles.push(`font-size: ${el.fontSize}px`);
        elemStyles.push(`font-weight: ${el.fontWeight}`);
        elemStyles.push(`color: ${brushToCss(el.fill)}`);
        elemStyles.push(`overflow: hidden`);
        elemStyles.push(`white-space: ${el.wordWrap ? 'normal' : 'nowrap'}`);
        if (el.strokeThickness && el.stroke) {
          elemStyles.push(`-webkit-text-stroke: ${el.strokeThickness}px ${brushToCss(el.stroke)}`);
        }

        const isClock = el.text.includes('{0:');
        layerHtml += `\n    <div id="field-${escapeId(el.name)}" class="gt-object gt-text ${isClock ? 'gt-clock' : ''}" style="${elemStyles.join('; ')}" data-name="${escapeHtml(el.name)}" data-format="${escapeHtml(el.text)}">${isClock ? '--:--' : escapeHtml(el.text)}</div>`;
      } else if (el.type === 'Image') {
        const filename = el.source ? path.basename(el.source.replace(/\\/g, '/')) : '';
        const localImgPath = encodeURI(assetFiles[filename] || filename).replaceAll("'",'%27').replaceAll('(', '%28').replaceAll(')', '%29');
        elemStyles.push(`background-image: url('${localImgPath}')`);
        elemStyles.push(`background-size: ${el.sizeMode === 'Stretch' ? '100% 100%' : 'contain'}`);
        elemStyles.push(`background-repeat: no-repeat`);
        elemStyles.push(`background-position: center`);

        layerHtml += `\n    <div id="img-${escapeId(el.name)}" class="gt-object gt-image" style="${elemStyles.join('; ')}" data-name="${escapeHtml(el.name)}"></div>`;
      } else if (el.type === 'Ticker') {
        elemStyles.push(`overflow: hidden`);
        elemStyles.push(`display: flex`);
        elemStyles.push(`align-items: center`);
        elemStyles.push(`font-family: '${family(el.fontFamily)}', sans-serif`);
        elemStyles.push(`font-size: ${el.fontSize}px`);
        elemStyles.push(`font-weight: ${el.fontWeight}`);
        elemStyles.push(`color: ${brushToCss(el.fill)}`);

        layerHtml += `\n    <div id="ticker-${escapeId(el.name)}" class="gt-object gt-ticker-wrapper" style="${elemStyles.join('; ')}" data-name="${escapeHtml(el.name)}">
      <div class="gt-ticker-content" style="display: inline-block; white-space: nowrap; animation: ticker-scroll ${Math.max(10, 60 / el.speed)}s linear infinite;">${escapeHtml(el.text)}</div>
    </div>`;
      }

      // Adicionar animação se houver
      generateKeyframeRules(cssRules, safeId, el.name, elInAnim, elOutAnim, width, height);
    });

    layerHtml += `\n  </div>`;
    htmlElements.push(layerHtml);
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1.0">
  <title>${escapeHtml(templateTitle)} - FreeMix Broadcast GC</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: transparent;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    #gc-root {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      transform-origin: top left;
    }
    
    /* Animações Padrão de Transição In / Out */
    @keyframes ticker-scroll {
      0% { transform: translateX(${width}px); }
      100% { transform: translateX(-100%); }
    }

    ${fontRules}
    ${cssRules.join('\n\n    ')}
  </style>
</head>
<body>
  <div id="gc-root" class="animate-in">
    ${htmlElements.join('\n\n    ')}
  </div>

  <script>
    /**
     * Motor de Runtime do FreeMix Broadcast Title
     * Fornece API padronizada para Overlays, Title Editor e Data Sources
     */
    window.FreeMixTitle = {
      data: ${JSON.stringify(fields, null, 2).replaceAll('<','\\u003c')},
      
      // Atualizar campos de texto / imagens dinamicamente
      updateFields(dataObj) {
        if (!dataObj) return;
        for (const [key, val] of Object.entries(dataObj)) {
          const fieldEl = document.querySelector('[data-name="' + key + '"]');
          if (fieldEl) {
            if (fieldEl.classList.contains('gt-text')) {
              fieldEl.textContent = val;
            } else if (fieldEl.classList.contains('gt-image')) {
              fieldEl.style.backgroundImage = 'url("' + val + '")';
            } else if (fieldEl.classList.contains('gt-ticker-wrapper')) {
              const tc = fieldEl.querySelector('.gt-ticker-content');
              if (tc) tc.textContent = val;
            }
          }
        }
      },

      // Disparar Animação de Entrada
      transitionIn() {
        const root = document.getElementById('gc-root');
        root.classList.remove('animate-out');
        root.classList.add('animate-in');
      },

      // Disparar Animação de Saída
      transitionOut() {
        const root = document.getElementById('gc-root');
        root.classList.remove('animate-in');
        root.classList.add('animate-out');
      },

      // Conectar a uma Data Source (CSV, JSON, URL)
      async loadDataSource(url) {
        try {
          const res = await fetch(url);
          const json = await res.json();
          this.updateFields(json);
        } catch (err) {
          console.warn('[FreeMixTitle] Erro ao carregar DataSource:', err);
        }
      }
    };

    // Suporte ao relógio em tempo real caso existam campos de hora
    function initClocks() {
      const clocks = document.querySelectorAll('.gt-clock');
      if (clocks.length === 0) return;
      function tick() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        clocks.forEach(c => {
          c.textContent = hh + ':' + mm;
        });
      }
      tick();
      setInterval(tick, 1000);
    }
    initClocks();

    // Integração com o protocolo nativo de GC do FreeMix (painel/gc/gc.js)
    window.FreeMixGCCompatibility={version:1,animation:true,clock:false,style:false};
    let timeline={};
    window.GC = {
      configure(t){timeline=t||{};},
      play(data) {
        if (data) window.FreeMixTitle.updateFields(data);
        window.FreeMixTitle.transitionIn();
        const epoch=timeline.animationStartedAt;if(Number.isFinite(epoch)&&epoch>0){requestAnimationFrame(()=>document.getAnimations().filter(a=>a.animationName!=='ticker-scroll').forEach(a=>a.currentTime=Math.max(0,Date.now()-epoch)));}
      },
      stop() {
        window.FreeMixTitle.transitionOut();
      },
      update(data) {
        if (data) window.FreeMixTitle.updateFields(data);
      }
    };

    // Ouvinte para mensagens vindas do painel pai (postMessage)
    window.addEventListener('message', (event) => {
      if (!event.data || !event.data.action) return;
      if (event.data.action === 'UPDATE_FIELDS') {
        window.FreeMixTitle.updateFields(event.data.payload);
      } else if (event.data.action === 'TRANSITION_IN') {
        window.FreeMixTitle.transitionIn();
      } else if (event.data.action === 'TRANSITION_OUT') {
        window.FreeMixTitle.transitionOut();
      }
    });
  </script>
  <script src="../../gc.js" onerror="this.onerror=null;this.src='../gc.js'"></script>
</body>
</html>`;
}

/**
 * Constrói keyframes CSS para animações Fly e Fade do GT Title
 */
function generateKeyframeRules(cssRules,safeId,objName,inAnim,outAnim,width=1920,height=1080){
 const curves={Linear:'linear',CubicEasingIn:'cubic-bezier(.55,.055,.675,.19)',CubicEasingOut:'cubic-bezier(.215,.61,.355,1)',CubicEasingInOut:'cubic-bezier(.645,.045,.355,1)'};
 for(const[phase,a]of[['in',inAnim],['out',outAnim]]){if(!a||a.type==='None')continue;let hidden='opacity:0;',visible='opacity:1;transform:none;';if(a.type==='Fly'){const axis=['Left','Right'].includes(a.direction)?'X':'Y',distance=axis==='X'?width:height,sign=['Left','Top'].includes(a.direction)?'-':'';hidden+='transform:translate'+axis+'('+sign+distance+'px);';}else if(a.type==='Zoom'){hidden+='transform:scale('+a.scale+');';}else if(a.type==='Rotate'){hidden+='transform:rotate('+a.angle+'deg);';}const name='anim-'+phase+'-'+safeId;cssRules.push('@keyframes '+name+'{from{'+(phase==='in'?hidden:visible)+'}to{'+(phase==='in'?visible:hidden)+'}}.animate-'+phase+' [data-name="'+escapeHtml(objName)+'"]{transform-origin:center;animation:'+name+' '+a.duration+'s '+(curves[a.interpolation]||'ease')+' '+Math.max(0,Math.min(30,a.delay||0))+'s both;}');}
}

function escapeId(str) {
  return String(str).replace(/[^a-zA-Z0-9_\-]/g, '_');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Função Principal de Conversão
 * @param {string} gtzipPath Caminho para o arquivo .gtzip
 * @param {string} outputDir Pasta de destino onde o pacote HTML5 será salvo
 */
export function convertGtzipFile(gtzipPath, outputDir) {
  if (!fs.existsSync(gtzipPath)) {
    throw new Error(`Arquivo GTZIP não encontrado: ${gtzipPath}`);
  }

  const baseName = path.basename(gtzipPath, '.gtzip');
  const folderName = baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  if (!folderName) throw new Error('O nome do título não contém caracteres válidos');
  const targetFolder = path.join(outputDir, folderName);
  if (fs.existsSync(targetFolder) && fs.lstatSync(targetFolder).isSymbolicLink()) throw new Error('Destino do título é um link');

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Extrair conteúdo temporário
  const tempExtract = fs.mkdtempSync(path.join(path.resolve(targetFolder), '_raw_extracted-'));
  const entries=cp.execFileSync('tar.exe',['-tf',gtzipPath],{encoding:'utf8',windowsHide:true}).split(/\r?\n/).filter(Boolean);
  if(entries.some(entry=>{const n=entry.replaceAll('\\','/');return n.startsWith('/')||n.includes(':')||n.split('/').includes('..');}))throw new Error('Pacote de títulos contém caminho fora da pasta de extração');
  const detail=cp.execFileSync('tar.exe',['-tvf',gtzipPath],{encoding:'utf8',windowsHide:true});
  if(detail.split(/\r?\n/).some(line=>/^[lh]/.test(line)))throw new Error('Links não são permitidos nos títulos');

  cp.execFileSync('tar.exe',['-xf',gtzipPath,'-C',tempExtract],{windowsHide:true});

  // Ler document.xml
  const docPath = path.join(tempExtract, 'document.xml');
  if (!fs.existsSync(docPath)) {
    throw new Error(`Arquivo document.xml não encontrado dentro do GTZIP.`);
  }

  const xmlContent = fs.readFileSync(docPath, 'utf8');
  const gtData = parseGtXml(xmlContent);

  // Mapear recursos pelo resources.xml (converte GUIDs para nomes reais de imagem)
  const resPath = path.join(tempExtract, 'resources.xml');
  const guidMap = {};
  if (fs.existsSync(resPath)) {
    const resXml = fs.readFileSync(resPath, 'utf8');
    const resRegex = /<resource\s+filename="([^"]*)">\s*<source\s+guid="([^"]*)"/gi;
    let rm;
    while ((rm = resRegex.exec(resXml)) !== null) {
      const origFilename = path.basename(rm[1].replace(/\\/g, '/'));
      const guid = rm[2].trim();
      guidMap[guid] = origFilename;
    }
  }

  // Mapear arquivos extraídos (imagens, thumbnail)
  const extractedFiles = fs.readdirSync(tempExtract);
  const allowedAsset=f=>/\.(png|jpe?g|webp|bmp|gif|ttf|otf|woff2?)$/i.test(f);
  const assetMap = {};

  for (const f of extractedFiles) {
    const fullPath = path.join(tempExtract, f);
    const stat = fs.lstatSync(fullPath);
    if (stat.isSymbolicLink()) throw new Error('Recurso do título é um link');
    if (stat.isDirectory()) {
      // Subpastas com arquivos de imagem
      const subFiles = fs.readdirSync(fullPath);
      for (const sf of subFiles) {
        if (!fs.lstatSync(path.join(fullPath, sf)).isFile()) continue;
        if(!allowedAsset(sf)){gtData.warnings.push('Recurso não copiado: '+sf);continue;}
        const destName = `${f}_${sf}`;
        fs.copyFileSync(path.join(fullPath, sf), path.join(targetFolder, destName));
        assetMap[sf] = destName;
      }
    } else if (f.toLowerCase() === 'thumbnail.png') {
      fs.copyFileSync(fullPath, path.join(targetFolder, 'thumbnail.png'));
    } else if (guidMap[f]) {
      // Arquivo mapeado por GUID do resources.xml!
      const realName = guidMap[f];
      if(!allowedAsset(realName)){gtData.warnings.push("Recurso não copiado: "+realName);continue;}
      fs.copyFileSync(fullPath, path.join(targetFolder, realName));
      assetMap[realName] = realName;
    } else if (/\.(png|jpe?g|webp|bmp|gif|ttf|otf|woff2?)$/i.test(f)) {
      fs.copyFileSync(fullPath, path.join(targetFolder, f));
      assetMap[f] = f;
    }
  }

  // Gerar HTML
  const htmlContent = generateHtml(gtData, baseName, assetMap);
  fs.writeFileSync(path.join(targetFolder, 'index.html'), htmlContent, 'utf8');

  // Gerar manifest.json
  const manifest = {
    title: baseName,
    sourceFormat: 'vMix GT Title (.gtzip)',
    resolution: { width: gtData.width, height: gtData.height },
    thumbnail: 'thumbnail.png',
    entrypoint: 'index.html',
    freemixCompatibility: {version:1,animation:true,clock:false,style:false},
    layersCount: gtData.layers.length,
    storyboards: gtData.storyboards.map(s => ({ type: s.type, count: s.animations.length })),
    warnings: gtData.warnings,
    resources: Object.keys(assetMap),
    fields: []
  };

  gtData.layers.forEach(l => {
    l.elements.forEach(el => {
      if (el.type === 'TextBlock' || el.type === 'Ticker' || el.type === 'Image') {
        const defaultVal = el.text || (el.source ? path.basename(el.source.replace(/\\/g, '/')) : '') || '';
        manifest.fields.push({
          name: el.name,
          type: el.type,
          default: defaultVal,
          font: el.fontFamily,
          size: el.fontSize
        });
      }
    });
  });

  fs.writeFileSync(path.join(targetFolder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Gerar descritor .json para o catálogo do FreeMix (gerar-catalogo-gc.mjs)
  const slug = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const gcDescriptor = {
    id: `gt_${slug}`,
    name: baseName,
    // Neutral names: no other product's name in the interface (project rule).
    collection: "Importados",
    category: "Importados",
    htmlFile: "index.html",
    thumbnail: "thumbnail.png",
    fields: manifest.fields.map(f => ({
      key: f.name,
      label: f.name,
      type: 'text',
      default: f.default
    }))
  };
  fs.writeFileSync(path.join(targetFolder, `${slug}.json`), JSON.stringify(gcDescriptor, null, 2), 'utf8');

  // Limpar pasta temporária
  const cleanupRelative=path.relative(path.resolve(targetFolder),path.resolve(tempExtract));
  if(!cleanupRelative.startsWith('_raw_extracted-')||cleanupRelative.includes(path.sep)||path.isAbsolute(cleanupRelative))throw new Error('Pasta temporária fora do título');
  fs.rmSync(tempExtract, { recursive: true, force: true });

  console.log(`[CONVERTIDO COM SUCESSO] -> ${targetFolder}`);
  return { folder: targetFolder, manifest, gcDescriptor };
}
