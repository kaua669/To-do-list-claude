#!/usr/bin/env node
// Run this script to generate PWA icons
// Usage: node generate-icons.js
// Requires: npm install canvas (or use the SVG icons directly)

// Alternatively, use this Python script:
// python3 generate_icons.py

const fs = require('fs');
const path = require('path');

// SVG icon content
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#080c14"/>
  <rect x="40" y="40" width="432" height="432" rx="80" fill="url(#bg)"/>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#111827"/>
      <stop offset="100%" style="stop-color:#0e1420"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <!-- Checkmark icon -->
  <path d="M160 256 L220 316 L352 196" stroke="url(#accent)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="140" y="140" width="232" height="232" rx="32" stroke="rgba(99,102,241,0.3)" stroke-width="8" fill="none"/>
</svg>`;

// Save SVG files
fs.mkdirSync('./icons', { recursive: true });
fs.writeFileSync('./icons/icon.svg', svgIcon);
fs.writeFileSync('./icons/icon-192.svg', svgIcon);
fs.writeFileSync('./icons/icon-512.svg', svgIcon);

console.log('✅ SVG icons saved to ./icons/');
console.log('');
console.log('To convert to PNG, you can:');
console.log('1. Use https://realfavicongenerator.net/');
console.log('2. Use Inkscape: inkscape icon.svg --export-png=icon-192.png -w 192 -h 192');
console.log('3. Use ImageMagick: convert -background none icon.svg -resize 192x192 icon-192.png');
console.log('');
console.log('Or place any 192x192 and 512x512 PNG files in the icons/ folder.');
