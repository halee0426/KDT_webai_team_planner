// 우리 SVG 아이콘을 PNG (192, 512)로 변환
// 실행: node scripts/generate-icons.mjs

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/icons/icon.svg');
const outDir = resolve(root, 'public/icons');

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

const sizes = [
  { w: 192, name: 'icon-192.png' },
  { w: 512, name: 'icon-512.png' },
  { w: 180, name: 'apple-touch-icon.png' }, // iOS 표준 사이즈
];

for (const { w, name } of sizes) {
  const out = resolve(outDir, name);
  await sharp(svg, { density: 600 })
    .resize(w, w)
    .png()
    .toFile(out);
  console.log(`✓ ${name} (${w}x${w})`);
}

console.log('\n모든 아이콘 생성 완료!');
