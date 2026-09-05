// app/globals.css 의 OKLCH 토큰을 hex로 뽑는다.
// dataviz 팔레트 검증기가 hex만 받기 때문이다 (DESIGN-RULES §11).
//   node scripts/tokens-to-hex.mjs            → 전체 토큰
//   node scripts/tokens-to-hex.mjs chart      → 이름에 chart 가 든 것만, 쉼표로 이어서
import { readFileSync } from 'node:fs';

const srgb = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

/** OKLCH → sRGB hex. 색역 밖은 채널별로 자른다 (브라우저가 앉히는 자리와 사실상 같다) */
export function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(1, Math.max(0, srgb(v))) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const seen = new Map();
for (const m of css.matchAll(/^\s*--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/gm)) {
  if (!seen.has(m[1])) seen.set(m[1], oklchToHex(+m[2], +m[3], +m[4]));
}

const filter = process.argv[2];
const rows = [...seen].filter(([k]) => !filter || k.includes(filter));
if (filter) console.log(rows.map(([, v]) => v).join(','));
for (const [k, v] of rows) console.error(`${k.padEnd(20)} ${v}`);
