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
  const regex = /([a-zA-Z0-9_\-.:]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(tagStr)) !== null) {
    attrs[match[1]] = match[2];
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

console.log('Módulo de utilitários de cor e parser testado:');
console.log('#FF4B56A7 ->', convertColor('#FF4B56A7'));
console.log('#80FF0000 ->', convertColor('#80FF0000'));
