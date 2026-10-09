import fs from 'fs';
import path from 'path';
import cp from 'child_process';

/**
 * Converte cor Hex ARGB (#AARRGGBB) do formato WPF/XAML para CSS rgba()
 * @param {string} hexArgb Ex: "#FF4B56A7" ou "#80FFFFFF"
 * @returns {string} Ex: "rgba(75, 86, 167, 1)"
 */
export function convertColor(hexArgb) {
  if (!hexArgb) return 'transparent';
  let str = hexArgb.trim();
  if (str.startsWith('#')) str = str.substring(1);
  if (str.length === 6) {
    // RRGGBB
    const r = parseInt(str.substring(0, 2), 16);
    const g = parseInt(str.substring(2, 4), 16);
    const b = parseInt(str.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  } else if (str.length === 8) {
    // AARRGGBB
    const a = (parseInt(str.substring(0, 2), 16) / 255).toFixed(3);
    const r = parseInt(str.substring(2, 4), 16);
    const g = parseInt(str.substring(4, 6), 16);
    const b = parseInt(str.substring(6, 8), 16);
    return `rgba(${r}, ${g}, ${b}, ${parseFloat(a)})`;
  }
  return hexArgb;
}

/**
 * Faz parse de atributos simples de uma tag XML
 */
export function parseAttributes(tagStr) {
  const attrs = {};
  const regex = /([a-zA-Z0-9_\-.:]+)\s*=\s*(["'])([\s\S]*?)\2/g;
  let match;
  while ((match = regex.exec(tagStr)) !== null) {
    attrs[match[1]] = match[3].replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);/gi,s=>{const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"};if(named[s])return named[s];const n=s[2].toLowerCase()==='x'?parseInt(s.slice(3,-1),16):parseInt(s.slice(2,-1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';});
  }
  return attrs;
}

/**
 * Parse de Dimensions="W,H,D" ou Location="X,Y,Z"
 */
export function parseCoords(str, def = [0, 0, 0]) {
  if (!str) return def;
  const parts = str.split(',').map(s => parseFloat(s.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}
