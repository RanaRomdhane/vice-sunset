// The animated backdrop: a deep-purple sky burning down to a pink-orange
// sunset, palm silhouettes pinned to both edges, a distant skyline with
// flickering windows, and slow drifting haze. Original vector art.

// Small deterministic PRNG so the skyline is the same on every load.
function rng(seed: number): () => number {
  let s = seed >>> 0

  return () => {
    s = (s * 1664525 + 1013904223) >>> 0

    return s / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

// One frond, pointing right from the origin and drooping at the tip:
// a thin spine plus comb-like leaflets (dashed wide strokes).
const FROND_BODY = `
  <path d="M0,0 C80,-52 182,-44 262,42 C182,-8 92,-16 0,9 Z"/>
  <path d="M14,4 C92,-34 178,-24 246,40" fill="none" stroke="currentColor" stroke-width="64" stroke-dasharray="3 7" opacity=".95"/>
  <path d="M120,-14 C176,-14 222,6 256,44" fill="none" stroke="currentColor" stroke-width="30" stroke-dasharray="3 6"/>`

type Palm = {
  // trunk outline (filled)
  trunk: string
  cx: number
  cy: number
  scale: number
  color: string
  sway: number // animation delay seconds
  angles: number[]
}

function palm(p: Palm, idx: string): string {
  const fronds = p.angles
    .map((a, i) => {
      const s = r1(p.scale * (0.82 + ((i * 37) % 23) / 100))
      const flip = a > 90 || a < -90 ? ` scale(1,-1)` : ''

      return `<g transform="rotate(${a}) scale(${s})${flip}">${FROND_BODY}</g>`
    })
    .join('')

  return `
<g fill="${p.color}" color="${p.color}">
  <path d="${p.trunk}"/>
  <g class="sway sway${idx}" style="transform-origin:${p.cx}px ${p.cy}px;animation-delay:-${p.sway}s">
    <g transform="translate(${p.cx} ${p.cy})">${fronds}
      <circle r="${r1(14 * p.scale)}"/>
    </g>
  </g>
</g>`
}

const CROWN_A = [-168, -140, -112, -80, -48, -18, 12, 38, 150, 196, 214]
const CROWN_B = [-160, -126, -92, -58, -24, 8, 34, 158, 204]

function skyline(seed: number, width: number, base: number, maxH: number, color: string, windows: boolean, spire: number | null): string {
  const rand = rng(seed)
  let x = -10
  let out = ''
  let lights = ''

  while (x < width) {
    const w = 36 + rand() * 70
    // taller toward the outer edge (x = 0), lower toward the middle
    const edge = 1 - x / width
    const h = 60 + rand() * maxH * (0.35 + 0.65 * edge)
    const y = base - h
    out += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h + 4)}"/>`

    if (windows) {
      for (let wy = y + 14; wy < base - 10; wy += 22) {
        for (let wx = x + 8; wx < x + w - 8; wx += 16) {
          const roll = rand()

          if (roll < 0.11) {
            const cls = roll < 0.03 ? ' class="flick"' : ''
            const delay = r1(rand() * 6)
            lights += `<rect${cls} x="${r1(wx)}" y="${r1(wy)}" width="5" height="7" style="animation-delay:-${delay}s"/>`
          }
        }
      }
    }
    x += w + rand() * 6
  }

  if (spire !== null) {
    out += `<path d="M${spire - 4},${base - maxH - 40} L${spire},${base - maxH - 150} L${spire + 4},${base - maxH - 40} Z"/>`
    out += `<rect x="${spire - 28}" y="${base - maxH - 44}" width="56" height="${maxH + 48}"/>`
  }

  return `<g fill="${color}">${out}</g>` + (windows ? `<g fill="#ffb877" opacity=".75">${lights}</g>` : '')
}

// Left-edge palms in a 600x1000 box; the right edge reuses them mirrored
// with different skylines so the frame is balanced but not identical.
function palms(prefix: string): string {
  return [
    palm(
      {
        trunk: 'M300,1000 C318,880 350,770 396,694 L408,700 C366,778 340,884 326,1000 Z',
        cx: 402,
        cy: 696,
        scale: 0.78,
        color: '#2f0f55',
        sway: 2.1,
        angles: CROWN_B,
      },
      prefix + 'b',
    ),
    palm(
      {
        trunk: 'M18,1000 C30,820 48,620 64,452 L80,454 C70,624 58,822 52,1000 Z',
        cx: 72,
        cy: 452,
        scale: 0.95,
        color: '#200a3f',
        sway: 4.3,
        angles: CROWN_B,
      },
      prefix + 'c',
    ),
    palm(
      {
        trunk: 'M92,1000 C112,800 172,520 252,334 L270,340 C198,530 148,800 140,1000 Z',
        cx: 262,
        cy: 336,
        scale: 1.12,
        color: '#1a0734',
        sway: 0,
        angles: CROWN_A,
      },
      prefix + 'a',
    ),
  ].join('')
}

function blurredMidPalms(): string {
  // soft out-of-focus palms behind the conversation, like a shallow depth of field
  return `
<g filter="url(#soft)" opacity=".55">
  ${palm({ trunk: 'M640,1000 C660,900 690,820 720,770 L734,776 C706,826 680,904 668,1000 Z', cx: 728, cy: 772, scale: 0.9, color: '#2a0c46', sway: 3, angles: CROWN_B }, 'm1')}
  ${palm({ trunk: 'M960,1000 C944,900 916,830 884,790 L872,796 C902,836 928,904 936,1000 Z', cx: 878, cy: 792, scale: 0.85, color: '#2a0c46', sway: 5, angles: CROWN_B }, 'm2')}
</g>`
}

const STYLE = (animate: boolean) => `
<style>
  .sway { transform-box: view-box; animation: sway 9s ease-in-out infinite alternate; }
  .swayb, .swaym1 { animation-duration: 11s; }
  .swayc, .swaym2 { animation-duration: 13s; }
  @keyframes sway { from { transform: rotate(-1.6deg); } to { transform: rotate(1.8deg); } }
  .haze { animation: drift 46s ease-in-out infinite alternate; }
  .haze2 { animation: drift 63s ease-in-out infinite alternate-reverse; }
  @keyframes drift { from { transform: translateX(-70px); } to { transform: translateX(90px); } }
  .cloud { animation: cloud 120s linear infinite alternate; }
  @keyframes cloud { from { transform: translateX(-120px); } to { transform: translateX(140px); } }
  .glow { animation: glow 14s ease-in-out infinite alternate; }
  @keyframes glow { from { opacity: .78; } to { opacity: 1; } }
  .flick { animation: flick 7s steps(1) infinite; }
  @keyframes flick { 0%, 62% { opacity: 1; } 63%, 71% { opacity: .15; } 72%, 100% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  ${animate ? '' : '* { animation: none !important; }'}
</style>`

export function sceneSvg(animate: boolean): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
${STYLE(animate)}
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1b0736"/>
    <stop offset=".28" stop-color="#330c66"/>
    <stop offset=".5" stop-color="#5a1688"/>
    <stop offset=".66" stop-color="#8c2186"/>
    <stop offset=".8" stop-color="#d0396f"/>
    <stop offset=".9" stop-color="#ff6a55"/>
    <stop offset="1" stop-color="#ff9c4a"/>
  </linearGradient>
  <radialGradient id="sun" cx=".5" cy="1" r=".75">
    <stop offset="0" stop-color="#ff8a4a" stop-opacity=".85"/>
    <stop offset=".35" stop-color="#ff4f7a" stop-opacity=".45"/>
    <stop offset="1" stop-color="#ff4f7a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="dusk" cx=".5" cy=".62" r=".42">
    <stop offset="0" stop-color="#2a0b44" stop-opacity=".6"/>
    <stop offset="1" stop-color="#2a0b44" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5b1a6e"/>
    <stop offset="1" stop-color="#3a0f55"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="haze" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="40"/></filter>
</defs>

<rect width="1600" height="1000" fill="url(#sky)"/>
<rect class="glow" width="1600" height="1000" fill="url(#sun)"/>

<g class="cloud" fill="#b98ad8" opacity=".35">
  <ellipse cx="1480" cy="205" rx="200" ry="9"/>
  <ellipse cx="120" cy="330" rx="170" ry="11"/>
  <ellipse cx="1320" cy="250" rx="110" ry="5"/>
</g>

<g fill="url(#far)" opacity=".7">
  ${skyline(7, 1600, 1000, 120, 'url(#far)', false, null)}
</g>

${blurredMidPalms()}

<rect width="1600" height="1000" fill="url(#dusk)"/>
<g filter="url(#haze)">
  <ellipse class="haze" cx="800" cy="860" rx="520" ry="90" fill="#7a1f6a" opacity=".55"/>
  <ellipse class="haze2" cx="520" cy="700" rx="380" ry="60" fill="#ff5a7a" opacity=".18"/>
  <ellipse class="haze2" cx="1150" cy="720" rx="360" ry="55" fill="#ff7a5a" opacity=".16"/>
</g>

<g>
  ${skyline(11, 520, 1000, 300, '#3b1260', true, null)}
  ${palms('L')}
</g>
<g transform="translate(1600 0) scale(-1 1)">
  ${skyline(23, 540, 1000, 330, '#3b1260', true, 470)}
  ${palms('R')}
</g>
</svg>`
}
