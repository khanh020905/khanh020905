// Renders every SVG in assets/ from data/stats.json, data/builds.json and data/shots/*.jpg.
// Pure Node, no dependencies. Run: node scripts/render.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, C, L, fontFace, fontsCss, reducedMotion, filters, mulberry32, esc, fmt, fmtK, relTime, corners } from "./lib/theme.mjs";

const OUT = join(ROOT, "assets");
mkdirSync(join(OUT, "builds"), { recursive: true });
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const stats = readJson(join(ROOT, "data", "stats.json"));
const builds = readJson(join(ROOT, "data", "builds.json")) || [];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const monthYear = (iso) => { const d = new Date(iso); return `${MONTHS[d.getUTCMonth()].toUpperCase()} ${d.getUTCFullYear()}`; };

const THEMES = {
  dark: { bg1: "#0b1330", bg2: C.bg, bg3: "#000000", ink: C.text, muted: C.muted, cyan: C.cyan, mag: C.mag, lime: C.lime, line: C.line, grid: C.cyan, gridOp: .38, hzOp: .45, stars: ["#E2E8F0", C.lime, C.mag], scanOp: .05, sunOp: 1 },
  light: { bg1: "#FFFFFF", bg2: L.bg, bg3: L.bg2, ink: L.text, muted: L.muted, cyan: L.cyan, mag: L.mag, lime: L.lime, line: L.line, grid: L.grid, gridOp: .22, hzOp: .18, stars: ["#94A3B8", L.lime, L.mag], scanOp: .025, sunOp: .9 },
};

/* ═══════════════════════════════ HEADER ═══════════════════════════════ */
function header(t, key) {
  const W = 1200, H = 340, HZ = 215, VP = 600;
  const rnd = mulberry32(20260905);
  const starLayer = (n, rMin, rMax, seedShift) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = Math.round(rnd() * W), y = Math.round(rnd() * (HZ - 25)), r = (rMin + rnd() * (rMax - rMin)).toFixed(1);
      const dur = (1.6 + rnd() * 3).toFixed(2), delay = (-rnd() * 4).toFixed(2);
      const col = rnd() < 0.12 ? t.stars[2] : rnd() < 0.28 ? t.stars[1] : t.stars[0];
      s += `<circle class="st" cx="${x}" cy="${y}" r="${r}" fill="${col}" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`;
    }
    return `<g>${s}</g><g transform="translate(${W},0)">${s}</g>`;
  };
  const layers = [starLayer(34, 0.5, 1.1), starLayer(26, 0.9, 1.6), starLayer(16, 1.3, 2.2)];
  let vlines = "";
  for (let xe = -1400; xe <= W + 1400; xe += 110) vlines += `<line x1="${VP}" y1="${HZ}" x2="${xe}" y2="${H}"/>`;
  let hlines = "";
  const N = 9, CYCLE = 3.2;
  for (let i = 0; i < N; i++) hlines += `<line class="h" x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" style="animation-delay:${(-(i / N) * CYCLE).toFixed(3)}s"/>`;
  let stripes = "";
  for (let i = 0; i < 9; i++) { const y = HZ - 6 - i * (8 + i * 1.6); const h = 2 + i * 0.9; stripes += `<rect x="850" y="${(y - h).toFixed(1)}" width="300" height="${h.toFixed(1)}" fill="#000"/>`; }

  // title sliced into 4 horizontal bands, each band glitches on its own clock
  const bands = [[40, 78], [78, 92], [92, 104], [104, 132]];
  const sliceDx = [-9, 11, -6, 7];
  const sliceClips = bands.map(([a, b], i) => `<clipPath id="band${i}"><rect x="40" y="${a}" width="780" height="${b - a}"/></clipPath>`).join("");
  const titleText = (cls, fill, extra = "") => `<text class="${cls}" x="70" y="112" fill="${fill}"${extra}>KHANH020905</text>`;
  const slices = bands.map((_, i) => `
  <g clip-path="url(#band${i})" class="sl" style="--dx:${sliceDx[i]}px;animation-delay:${(-i * 1.7).toFixed(1)}s">
    ${titleText("gA", t.cyan)}${titleText("gB", t.mag)}${titleText("title", t.ink, ' filter="url(#neonCyan)"')}
  </g>`).join("");

  const hud = stats
    ? `<text x="${W - 58}" y="${H - 34}" text-anchor="end" fill="${t.muted}">STREAK <tspan fill="${t.lime}">${stats.streak.current}D</tspan>  ·  <tspan fill="${t.cyan}">${fmtK(stats.last12.total)}</tspan> CONTRIB / 12MO  ·  <tspan fill="${t.mag}">${stats.publicRepos}</tspan> REPOS  ·  SYNC ${stats.generatedAt.slice(0, 10)}</text>`
    : `<text x="${W - 58}" y="${H - 34}" text-anchor="end" fill="${t.muted}">DUO TECH  ·  CREATIVE WEB</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="KHANH020905 // SYSTEM ONLINE — Creative Developer, UI/UX Designer, Frontend Engineer">
<defs>
<style>
${fontFace}
${fontsCss}
.scene{animation:sceneIn 1.1s ease .25s both}
@keyframes sceneIn{from{opacity:0}to{opacity:1}}
.crt{transform-box:fill-box;transform-origin:50% 50%;animation:crtOn 1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes crtOn{0%{transform:scale(0,.006);opacity:1}30%{transform:scale(1,.006);opacity:1}62%{transform:scale(1,1);opacity:.5}100%{transform:scale(1,1);opacity:0}}
.st{animation:tw 2.4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
.p1{animation:drift 150s linear infinite}.p2{animation:drift 95s linear infinite}.p3{animation:drift 60s linear infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-${W}px)}}
.shoot{opacity:0;animation:shoot1 9s cubic-bezier(.25,.6,.4,1) infinite}
.shoot2{opacity:0;animation:shoot2 12s cubic-bezier(.25,.6,.4,1) infinite}
@keyframes shoot1{0%{transform:translate(160px,18px);opacity:0}3%{opacity:1}20%{transform:translate(760px,175px);opacity:0}100%{transform:translate(760px,175px);opacity:0}}
@keyframes shoot2{0%{transform:translate(1120px,12px);opacity:0}3%{opacity:1}18%{transform:translate(640px,160px);opacity:0}100%{transform:translate(640px,160px);opacity:0}}
.h{stroke:${t.mag};stroke-width:1.2;animation:hmove ${CYCLE}s cubic-bezier(.45,0,1,.55) infinite}
@keyframes hmove{0%{transform:translateY(0);opacity:0}8%{opacity:.9}100%{transform:translateY(${H - HZ}px);opacity:.1}}
.sl{animation:slice 7s steps(1,end) infinite}
@keyframes slice{0%,40%,43.2%,85%,87.6%,100%{transform:translateX(0)}40.4%{transform:translateX(var(--dx))}41.6%{transform:translateX(calc(var(--dx) * -.6))}42.4%{transform:translateX(calc(var(--dx) * .3))}85.4%{transform:translateX(calc(var(--dx) * -1))}86.6%{transform:translateX(calc(var(--dx) * .5))}}
.title{animation:flick 6s steps(1,end) infinite}
@keyframes flick{0%,96.5%,100%{opacity:1}97%{opacity:.55}97.6%{opacity:1}98.2%{opacity:.7}98.6%{opacity:1}}
.gA{animation:glA 5s steps(1,end) infinite;opacity:0}.gB{animation:glB 5s steps(1,end) infinite;opacity:0}
@keyframes glA{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(-6px,3px);opacity:.85}91%{transform:translate(5px,-2px);opacity:.75}93%{transform:translate(-3px,1px);opacity:.6}95%{opacity:0}}
@keyframes glB{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(6px,-3px);opacity:.85}91%{transform:translate(-5px,2px);opacity:.75}93%{transform:translate(3px,-1px);opacity:.6}95%{opacity:0}}
.cur{animation:blink 1.1s steps(1,end) infinite}
@keyframes blink{0%,55%{opacity:1}56%,100%{opacity:0}}
.boot{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);animation:boot 2.6s cubic-bezier(.2,.9,.2,1) .9s forwards}
@keyframes boot{to{transform:scaleX(1)}}
.bootTxt{opacity:0;animation:fadeIn .6s ease 3.4s forwards}
@keyframes fadeIn{to{opacity:1}}
.sweep{animation:sweep 4s linear infinite}
@keyframes sweep{from{transform:translateX(-260px)}to{transform:translateX(${W + 260}px)}}
.sun{animation:sunPulse 5s ease-in-out infinite}
@keyframes sunPulse{0%,100%{opacity:${(t.sunOp * .85).toFixed(2)}}50%{opacity:${t.sunOp}}}
${reducedMotion(`.crt{display:none}.scene{opacity:1}.boot{transform:none}.bootTxt{opacity:1}.h{opacity:.35}.gA,.gB,.shoot,.shoot2{opacity:0}.st{opacity:.7}`)}
</style>
<radialGradient id="bgGrad" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${t.bg1}"/><stop offset=".6" stop-color="${t.bg2}"/><stop offset="1" stop-color="${t.bg3}"/></radialGradient>
<linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.mag}" stop-opacity="0"/><stop offset="1" stop-color="${t.mag}" stop-opacity="${t.hzOp}"/></linearGradient>
<linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg2}" stop-opacity="0"/><stop offset="1" stop-color="${t.bg2}" stop-opacity=".95"/></linearGradient>
<linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.lime}"/><stop offset=".55" stop-color="#FF7A00"/><stop offset="1" stop-color="${C.mag}"/></linearGradient>
<linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="bootGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.cyan}"/><stop offset=".6" stop-color="${t.mag}"/><stop offset="1" stop-color="${t.lime}"/></linearGradient>
<linearGradient id="tail1" gradientUnits="userSpaceOnUse" x1="-130" y1="-46" x2="0" y2="0"><stop offset="0" stop-color="${t.ink}" stop-opacity="0"/><stop offset="1" stop-color="${t.ink}"/></linearGradient>
<linearGradient id="tail2" gradientUnits="userSpaceOnUse" x1="130" y1="-46" x2="0" y2="0"><stop offset="0" stop-color="${t.ink}" stop-opacity="0"/><stop offset="1" stop-color="${t.ink}"/></linearGradient>
<mask id="sunMask"><rect x="850" y="${HZ - 130}" width="300" height="130" fill="#fff"/>${stripes}</mask>
<clipPath id="aboveHz"><rect x="0" y="0" width="${W}" height="${HZ}"/></clipPath>
<clipPath id="belowHz"><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}"/></clipPath>
${sliceClips}
${filters(t.cyan, t.mag)}
</defs>

<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
<g class="scene">
  <g clip-path="url(#aboveHz)">
    <g class="p1">${layers[0]}</g><g class="p2">${layers[1]}</g><g class="p3">${layers[2]}</g>
    <g class="shoot"><line x1="-130" y1="-46" x2="0" y2="0" stroke="url(#tail1)" stroke-width="2" stroke-linecap="round"/><circle r="2.4" fill="${t.ink}"/></g>
    <g class="shoot2"><line x1="130" y1="-46" x2="0" y2="0" stroke="url(#tail2)" stroke-width="2" stroke-linecap="round"/><circle r="2.4" fill="${t.ink}"/></g>
  </g>

  <g clip-path="url(#aboveHz)" filter="url(#softGlow)" class="sun"><circle cx="1000" cy="${HZ}" r="112" fill="url(#sunGrad)" mask="url(#sunMask)"/></g>

  <rect x="0" y="${HZ - 90}" width="${W}" height="90" fill="url(#horizonGlow)"/>
  <line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="${t.cyan}" stroke-width="2" filter="url(#lineGlow)"/>

  <g clip-path="url(#belowHz)">
    <g stroke="${t.grid}" stroke-width="1" opacity="${t.gridOp}">${vlines}</g>
    <g>${hlines}</g>
    <rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#floorFade)"/>
  </g>

  ${corners(18, 18, 1, 1, t.cyan)}${corners(W - 18, 18, -1, 1, t.cyan)}${corners(18, H - 18, 1, -1, t.cyan)}${corners(W - 18, H - 18, -1, -1, t.cyan)}
  <g class="mono" font-size="11" letter-spacing="1.5">
    <text x="58" y="36" fill="${t.muted}">[</text>
    <circle cx="72" cy="32" r="3.5" fill="${t.lime}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
    <circle cx="72" cy="32" r="3.5" fill="none" stroke="${t.lime}" stroke-width="1.2"><animate attributeName="r" values="3.5;11" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/></circle>
    <text x="84" y="36" fill="${t.lime}">ONLINE ]</text>
    <text x="${W - 58}" y="36" text-anchor="end" fill="${t.muted}">LOC: VIET NAM · UTC+7 · DUO TECH</text>
    ${hud}
  </g>

  <g class="orb">
    <g font-size="66" font-weight="900" letter-spacing="2">${slices}</g>
    <g font-size="26" font-weight="700" letter-spacing="4">
      <text x="72" y="152" fill="${t.cyan}" filter="url(#neonMag)">// SYSTEM ONLINE</text>
      <rect class="cur" x="426" y="130" width="14" height="24" fill="${t.mag}"/>
    </g>
    <text x="73" y="186" font-size="14" font-weight="400" letter-spacing="3.2" fill="${t.lime}">CREATIVE DEVELOPER   •   UI/UX DESIGNER   •   FRONTEND ENGINEER</text>
  </g>

  <g class="mono" font-size="10.5" letter-spacing="1.2">
    <text x="70" y="${H - 34}" fill="${t.muted}">BOOT SEQUENCE</text>
    <rect x="180" y="${H - 42}" width="300" height="8" rx="4" fill="${key === "dark" ? "#0f172a" : "#DDE3F0"}" stroke="${t.line}" stroke-width="1"/>
    <rect class="boot" x="180" y="${H - 42}" width="300" height="8" rx="4" fill="url(#bootGrad)"/>
    <text class="bootTxt" x="492" y="${H - 34}" fill="${t.lime}">100% · READY_</text>
  </g>

  <g clip-path="url(#belowHz)" opacity=".35"><rect class="sweep" x="0" y="${HZ - 1}" width="260" height="3" fill="url(#sweepGrad)"/></g>
  <rect width="${W}" height="${H}" fill="url(#scan)" opacity="${(t.scanOp / .05).toFixed(2)}"/>
</g>
<rect class="crt" x="0" y="0" width="${W}" height="${H}" fill="${key === "dark" ? "#E0FCFF" : "#0B1020"}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="none" stroke="${t.line}"/>
</svg>`;
}

/* ═══════════════════════════════ TYPING ═══════════════════════════════ */
function typing() {
  const W = 1200, H = 44;
  const lines = [
    "$ whoami  →  Creative Developer / UI-UX Designer",
    "$ build --cinematic web experiences --with GSAP & Three.js",
    "$ stack: React · Next.js · TypeScript · Tailwind",
    "$ status: AVAILABLE_FOR_HIRE ✓",
  ];
  const SLOT = 5, TYPE = 2.4, T = SLOT * lines.length;
  const typePct = ((TYPE / T) * 100).toFixed(2), endPct = ((SLOT / T) * 100 - 0.01).toFixed(2), nextPct = ((SLOT / T) * 100).toFixed(2);
  const rows = lines.map((l, i) =>
    `<text class="orb ln${i === 0 ? " first" : ""}" x="${W / 2}" y="28" text-anchor="middle" font-size="15" font-weight="600" letter-spacing="1" fill="${C.cyan}" style="animation-delay:${i * SLOT}s;animation-timing-function:steps(${l.length + 2},end)">${esc(l)} _</text>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lines.join(" | "))}">
<defs><style>
${fontFace}
${fontsCss}
.ln{opacity:0;animation:typeLine ${T}s infinite;clip-path:inset(0 100% 0 0)}
@keyframes typeLine{0%{opacity:1;clip-path:inset(0 100% 0 0)}${typePct}%{opacity:1;clip-path:inset(0 0% 0 0)}${endPct}%{opacity:1;clip-path:inset(0 0% 0 0)}${nextPct}%,100%{opacity:0;clip-path:inset(0 0% 0 0)}}
${reducedMotion(`.ln{opacity:0!important}.ln.first{opacity:1!important;clip-path:none!important}`)}
</style></defs>
<rect width="${W}" height="${H}" fill="none"/>
${rows}
</svg>`;
}

/* ═══════════════════════════════ DIVIDER ═══════════════════════════════ */
function divider() {
  const W = 1200, H = 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="">
<defs>
<style>.dot{animation:run 3.6s cubic-bezier(.4,0,.2,1) infinite}@keyframes run{from{transform:translateX(-160px)}to{transform:translateX(${W + 160}px)}}${reducedMotion(".dot{display:none}")}</style>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".5" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="gl" x="-5%" y="-300%" width="110%" height="700%"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<rect x="0" y="4" width="${W}" height="2" fill="url(#g)" opacity=".9"/>
<rect x="0" y="4" width="${W}" height="2" fill="url(#g)" filter="url(#gl)" opacity=".8"/>
<rect class="dot" x="0" y="2.5" width="160" height="5" rx="2.5" fill="url(#s)"/>
</svg>`;
}

/* ═══════════════════════════════ SKILL TREE ═══════════════════════════════ */
function skills() {
  const rows = [
    { tag: "RX", name: "React / Next.js", lvl: "MASTER", pct: 95, col: C.lime },
    { tag: "GS", name: "GSAP / Animation", lvl: "EXPERT", pct: 92, col: C.cyan },
    { tag: "JS", name: "JavaScript", lvl: "EXPERT", pct: 90, col: C.cyan },
    { tag: "UX", name: "UI/UX Design", lvl: "EXPERT", pct: 90, col: C.cyan },
    { tag: "TS", name: "TypeScript", lvl: "EXPERT", pct: 88, col: C.cyan },
    { tag: "3D", name: "Three.js / WebGL", lvl: "ADVANCED", pct: 82, col: C.mag },
    { tag: "JV", name: "Java", lvl: "ADVANCED", pct: 80, col: C.mag },
  ];
  const W = 960, ROW = 46, TOP = 22, H = TOP + rows.length * ROW + 10, BX = 420, BW = 430, BH = 12;
  let body = "", clips = "";
  rows.forEach((r, i) => {
    const y = TOP + i * ROW, cy = y + ROW / 2, fw = Math.round(BW * r.pct / 100), d = (0.15 + i * 0.13).toFixed(2), lw = r.lvl.length * 8.4 + 16;
    clips += `<clipPath id="c${i}"><rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="6"/></clipPath>`;
    body += `
<g class="row" style="animation-delay:${(i * 0.08).toFixed(2)}s">
  <rect x="18" y="${cy - 16}" width="44" height="32" rx="6" fill="${r.col}" fill-opacity=".12" stroke="${r.col}" stroke-opacity=".8" stroke-width="1.2"/>
  <text class="orb" x="40" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="900" fill="${r.col}">${r.tag}</text>
  <text class="orb" x="80" y="${cy + 5}" font-size="14.5" font-weight="700" fill="${C.text}">${r.name}</text>
  <rect x="300" y="${cy - 10}" width="${lw}" height="20" rx="4" fill="${C.bg}" stroke="${r.col}" stroke-opacity=".7" stroke-width="1"/>
  <text class="mono" x="${300 + lw / 2}" y="${cy + 4}" text-anchor="middle" font-size="10.5" font-weight="700" letter-spacing="1.2" fill="${r.col}">${r.lvl}</text>
  <rect x="${BX}" y="${cy - BH / 2}" width="${BW}" height="${BH}" rx="6" fill="${C.panel}" stroke="${C.line}" stroke-width="1"/>
  <g class="fill" style="animation-delay:${d}s">
    <rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="6" fill="url(#bar)"/>
    <rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="6" fill="url(#bar)" filter="url(#barGlow)" opacity=".7"/>
  </g>
  <g clip-path="url(#c${i})"><rect class="shine" x="${BX}" y="${cy - BH / 2}" width="70" height="${BH}" fill="url(#shine)" style="animation-delay:${(1.8 + i * 0.13).toFixed(2)}s"/></g>
  <text class="orb pct" x="${W - 22}" y="${cy + 6}" text-anchor="end" font-size="17" font-weight="900" fill="${r.col}" style="animation-delay:${(0.9 + i * 0.13).toFixed(2)}s">${r.pct}%</text>
</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skill tree: ${rows.map((r) => `${r.name} ${r.pct}%`).join(", ")}">
<defs>
<style>
${fontFace}
${fontsCss}
.row{opacity:0;animation:rowIn .5s ease forwards}
@keyframes rowIn{to{opacity:1}}
.fill{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);animation:grow 1.3s cubic-bezier(.2,.85,.2,1) forwards}
@keyframes grow{to{transform:scaleX(1)}}
.pct{opacity:0;animation:rowIn .6s ease forwards}
.shine{opacity:0;animation:shine 3.2s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(-80px);opacity:0}10%{opacity:.9}45%{transform:translateX(${BW}px);opacity:0}100%{transform:translateX(${BW}px);opacity:0}}
${reducedMotion(".row,.pct{opacity:1}.fill{transform:none}.shine{display:none}")}
</style>
<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".55" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="barGlow" x="-5%" y="-150%" width="110%" height="400%"><feGaussianBlur stdDeviation="4"/></filter>
${clips}
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffffff" opacity=".035"/></pattern>
</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
<rect x="18" y="8" width="2" height="${H - 16}" fill="url(#bar)" opacity=".6"/>
${body}
<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}

/* ═══════════════════════════════ LIVE STATS ═══════════════════════════════ */
function statsPanel(s) {
  const W = 1200, H = 380;
  if (!s) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="stats pending"><defs><style>${fontFace}${fontsCss}</style></defs><rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/><text class="orb" x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="18" font-weight="700" fill="${C.muted}">STATS SYNC PENDING — first workflow run will fill this in</text></svg>`;
  }
  const ratio = Math.min(1, s.streak.current / Math.max(1, s.streak.longest));
  const R = 62, CIRC = (2 * Math.PI * R).toFixed(1), off = (2 * Math.PI * R * (1 - ratio)).toFixed(1);
  const mostActive = DAYS[s.byWeekday.indexOf(Math.max(...s.byWeekday))];
  const tiles = [
    ["COMMITS", fmt(s.last12.commits), C.cyan], ["PULL REQUESTS", fmt(s.last12.prs), C.mag],
    ["STARS EARNED", fmt(s.stars), C.lime], ["PUBLIC REPOS", fmt(s.publicRepos), C.text],
  ].map(([label, val, col], i) => {
    const x = 36 + (i % 2) * 180, y = 150 + Math.floor(i / 2) * 50;
    return `<g class="in" style="animation-delay:${(0.5 + i * 0.12).toFixed(2)}s">
      <rect x="${x}" y="${y}" width="168" height="42" rx="7" fill="${C.panel}" stroke="${C.line}"/>
      <rect x="${x}" y="${y + 8}" width="3" height="26" rx="1.5" fill="${col}"/>
      <text class="mono" x="${x + 14}" y="${y + 16}" font-size="9" letter-spacing="1.6" fill="${C.muted}">${label}</text>
      <text class="orb" x="${x + 14}" y="${y + 35}" font-size="17" font-weight="900" fill="${col}">${val}</text>
    </g>`;
  }).join("");

  const langs = s.languages.slice(0, 5).map((l, i) => {
    const y = 62 + i * 30, w = Math.max(6, Math.round(220 * l.pct / Math.max(1, s.languages[0].pct)));
    return `<g class="in" style="animation-delay:${(0.4 + i * 0.1).toFixed(2)}s">
      <text class="orb" x="780" y="${y + 4}" font-size="12" font-weight="700" fill="${C.text}">${esc(l.name)}</text>
      <rect x="880" y="${y - 5}" width="220" height="8" rx="4" fill="${C.panel}" stroke="${C.line}"/>
      <g class="grow" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s"><rect x="880" y="${y - 5}" width="${w}" height="8" rx="4" fill="${l.color}"/><rect x="880" y="${y - 5}" width="${w}" height="8" rx="4" fill="${l.color}" filter="url(#blur4)" opacity=".7"/></g>
      <text class="mono" x="1164" y="${y + 4}" text-anchor="end" font-size="11" fill="${C.lime}">${l.pct}%</text>
    </g>`;
  }).join("");

  // 52-week sparkline
  const X0 = 36, X1 = 1164, Y0 = 270, Y1 = 350, pts = s.weeks52, max = Math.max(1, ...pts);
  const px = (i) => (X0 + (i / Math.max(1, pts.length - 1)) * (X1 - X0)).toFixed(1);
  const py = (v) => (Y1 - (v / max) * (Y1 - Y0)).toFixed(1);
  const line = pts.map((v, i) => `${i ? "L" : "M"}${px(i)} ${py(v)}`).join(" ");
  const area = `${line} L${X1} ${Y1} L${X0} ${Y1} Z`;
  const peak = pts.indexOf(max);
  let ticks = "", lastM = -1;
  s.weekLabels.forEach((d, i) => { if (!d) return; const m = new Date(d).getUTCMonth(); if (m !== lastM) { lastM = m; if (i > 0) ticks += `<line x1="${px(i)}" y1="${Y1}" x2="${px(i)}" y2="${Y1 + 5}" stroke="${C.line}"/><text class="mono" x="${px(i)}" y="${Y1 + 17}" text-anchor="middle" font-size="9" fill="${C.muted}">${MONTHS[m]}</text>`; } });
  const dots = pts.map((v, i) => (v === max ? `<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="${C.lime}" filter="url(#blur4)"/><circle cx="${px(i)}" cy="${py(v)}" r="2.5" fill="${C.lime}"/>` : "")).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats: ${fmt(s.last12.total)} contributions in the last 12 months, ${s.streak.current}-day current streak, ${s.streak.longest}-day longest streak, ${s.publicRepos} public repos, ${s.stars} stars, top language ${s.languages[0]?.name}">
<defs>
<style>
${fontFace}
${fontsCss}
.in{opacity:0;animation:fadeUp .6s ease forwards}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.grow{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);animation:grow 1.1s cubic-bezier(.2,.85,.2,1) forwards}
@keyframes grow{to{transform:scaleX(1)}}
.ring{stroke-dasharray:${CIRC};stroke-dashoffset:${CIRC};animation:ring 1.6s cubic-bezier(.2,.8,.2,1) .4s forwards}
@keyframes ring{to{stroke-dashoffset:${off}}}
.spark{stroke-dasharray:2400;stroke-dashoffset:2400;animation:draw 2.4s ease-out .3s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.area{opacity:0;animation:fadeIn 1s ease 1.6s forwards}
@keyframes fadeIn{to{opacity:1}}
.big{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.82}}
${reducedMotion(".in,.area{opacity:1}.grow{transform:none}.ring{stroke-dashoffset:" + off + "}.spark{stroke-dashoffset:0}")}
</style>
<linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.mag}"/></linearGradient>
<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".55"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>
<linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".6" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<filter id="neonLime" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/><feFlood flood-color="${C.lime}" flood-opacity=".7"/><feComposite in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
${filters()}
</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
${corners(14, 14, 1, 1, C.cyan, 18)}${corners(W - 14, 14, -1, 1, C.cyan, 18)}${corners(14, H - 14, 1, -1, C.cyan, 18)}${corners(W - 14, H - 14, -1, -1, C.cyan, 18)}

<!-- left: contributions -->
<g class="mono" font-size="10" letter-spacing="2" fill="${C.muted}">
  <text x="36" y="42">CONTRIBUTIONS · LAST 12 MONTHS</text>
  <text x="780" y="42">TOP LANGUAGES · BY CODE SIZE</text>
  <text x="36" y="262">ACTIVITY · 52 WEEKS</text>
  <text x="1164" y="262" text-anchor="end">PEAK <tspan fill="${C.lime}">${max}</tspan> / WEEK</text>
</g>
<g class="in" style="animation-delay:.1s">
  <text class="orb big" x="34" y="104" font-size="56" font-weight="900" fill="${C.lime}" filter="url(#neonLime)">${fmt(s.last12.total)}</text>
  <text class="mono" x="36" y="128" font-size="11" letter-spacing="1" fill="${C.muted}">ALL-TIME <tspan fill="${C.text}">${fmt(s.allTime.total)}</tspan>  ·  SINCE ${monthYear(s.createdAt)}${s.privateIncluded ? "" : "  ·  PUBLIC ONLY"}</text>
</g>
${tiles}

<!-- center: streak ring -->
<g class="in" style="animation-delay:.3s">
  <circle cx="560" cy="122" r="${R}" fill="none" stroke="${C.panel}" stroke-width="10"/>
  <circle cx="560" cy="122" r="${R}" fill="none" stroke="${C.line}" stroke-width="1" stroke-dasharray="2 6"/>
  <circle class="ring" cx="560" cy="122" r="${R}" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 560 122)"/>
  <circle class="ring" cx="560" cy="122" r="${R}" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 560 122)" filter="url(#blur4)" opacity=".6"/>
  <path d="M560 46 l4 9 l-4 -3 l-4 3 z" fill="${C.lime}"/>
  <text class="orb" x="560" y="132" text-anchor="middle" font-size="40" font-weight="900" fill="${C.cyan}" filter="url(#neonCyan)">${s.streak.current}</text>
  <text class="mono" x="560" y="152" text-anchor="middle" font-size="9.5" letter-spacing="2" fill="${C.muted}">DAY STREAK</text>
  <text class="mono" x="560" y="212" text-anchor="middle" font-size="10.5" letter-spacing="1" fill="${C.muted}">LONGEST <tspan fill="${C.mag}" font-weight="700">${s.streak.longest}</tspan>${s.streak.longestRange ? `  ·  ${shortDate(s.streak.longestRange[0])} → ${shortDate(s.streak.longestRange[1])}` : ""}</text>
  <text class="mono" x="560" y="230" text-anchor="middle" font-size="10.5" letter-spacing="1" fill="${C.muted}">${s.streak.currentStart ? `SINCE ${shortDate(s.streak.currentStart)}` : "NO ACTIVE STREAK"}  ·  SYNC ${s.generatedAt.slice(0, 10)}</text>
</g>

<!-- right: languages -->
${langs}
<g class="in" style="animation-delay:1s">
  <text class="mono" x="780" y="224" font-size="10.5" letter-spacing="1" fill="${C.muted}">MOST ACTIVE <tspan fill="${C.cyan}">${mostActive.toUpperCase()}</tspan>  ·  LAST PUSH <tspan fill="${C.lime}">${relTime(s.lastPush?.at, Date.parse(s.generatedAt))}</tspan>${s.lastPush ? ` → ${esc(s.lastPush.name)}` : ""}</text>
</g>

<!-- bottom: sparkline -->
<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="${C.line}"/>
${ticks}
<path class="area" d="${area}" fill="url(#areaGrad)"/>
<path class="spark" d="${line}" fill="none" stroke="url(#sparkGrad)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
<path class="spark" d="${line}" fill="none" stroke="url(#sparkGrad)" stroke-width="2.2" filter="url(#blur4)" opacity=".7"/>
<g class="area">${dots}</g>

<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}

/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */
function footer(t, key) {
  const W = 1200, H = 200, HZ = 44, VP = 600;
  let vlines = "";
  for (let xe = -1400; xe <= W + 1400; xe += 110) vlines += `<line x1="${VP}" y1="${HZ}" x2="${xe}" y2="${H}"/>`;
  let hlines = "";
  const N = 6, CYCLE = 3.2;
  for (let i = 0; i < N; i++) hlines += `<line class="h" x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" style="animation-delay:${(-(i / N) * CYCLE).toFixed(3)}s"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wake up, Samurai. We have code to ship. — end of transmission">
<defs>
<style>
${fontFace}
${fontsCss}
.h{stroke:${t.mag};stroke-width:1.1;animation:hmove ${CYCLE}s cubic-bezier(.45,0,1,.55) infinite}
@keyframes hmove{0%{transform:translateY(0);opacity:0}8%{opacity:.8}100%{transform:translateY(${H - HZ}px);opacity:.05}}
.cur{animation:blink 1.1s steps(1,end) infinite}
@keyframes blink{0%,55%{opacity:1}56%,100%{opacity:0}}
.q{opacity:0;animation:fadeIn 1.2s ease .3s forwards}
@keyframes fadeIn{to{opacity:1}}
${reducedMotion(".q{opacity:1}.h{opacity:.3}")}
</style>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg2}" stop-opacity="0"/><stop offset="1" stop-color="${t.bg2}" stop-opacity=".97"/></linearGradient>
<linearGradient id="hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.cyan}" stop-opacity="0"/><stop offset=".3" stop-color="${t.cyan}"/><stop offset=".7" stop-color="${t.mag}"/><stop offset="1" stop-color="${t.mag}" stop-opacity="0"/></linearGradient>
<clipPath id="below"><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}"/></clipPath>
${filters(t.cyan, t.mag)}
</defs>
<rect width="${W}" height="${H}" fill="${t.bg2}"/>
<line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="url(#hz)" stroke-width="2" filter="url(#lineGlow)"/>
<g clip-path="url(#below)">
  <g stroke="${t.grid}" stroke-width="1" opacity="${(t.gridOp * .75).toFixed(2)}">${vlines}</g>
  <g>${hlines}</g>
  <rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#fade)"/>
</g>
<g class="q">
  <text class="serif" x="600" y="92" text-anchor="middle" font-size="19" font-style="italic" fill="${t.ink}">“Wake up, Samurai. We have code to ship.”</text>
  <text class="mono" x="600" y="112" text-anchor="middle" font-size="10" letter-spacing="2" fill="${t.lime}">— KHANH020905</text>
</g>
<rect x="430" y="130" width="340" height="40" rx="6" fill="${t.bg2}" fill-opacity=".85" stroke="${t.line}"/>
<g class="orb" font-size="15" font-weight="700" letter-spacing="3">
  <text x="600" y="156" text-anchor="middle" fill="${t.cyan}" filter="url(#neonCyan)">&gt; END OF TRANSMISSION</text>
  <rect class="cur" x="741" y="142" width="9" height="17" fill="${t.mag}"/>
</g>
<text class="mono" x="600" y="190" text-anchor="middle" font-size="10" letter-spacing="2" fill="${t.muted}">© ${new Date().getUTCFullYear()} KHANH020905  ·  CRAFTED WITH NEON &amp; CAFFEINE  ·  SEE YOU IN THE GRID</text>
<rect width="${W}" height="${H}" fill="url(#scan)" opacity="${(t.scanOp / .05).toFixed(2)}"/>
</svg>`;
}

/* ═══════════════════════════════ BUILD CARDS ═══════════════════════════════ */
function buildCard(b) {
  const W = 400, H = 300, IX = 16, IY = 16, IW = 368, IH = 226;
  const shotPath = join(ROOT, "data", "shots", `${b.slug}.jpg`);
  const shot = existsSync(shotPath) ? readFileSync(shotPath).toString("base64") : null;
  const host = new URL(b.url).host;
  let tagX = W - 18, chips = "";
  for (const tag of [...b.tags].reverse()) {
    const w = Math.round(tag.length * 6.3 + 16); tagX -= w;
    chips += `<rect x="${tagX}" y="256" width="${w}" height="18" rx="4" fill="${C.panel}" stroke="${C.line}"/><text class="mono" x="${tagX + w / 2}" y="268.5" text-anchor="middle" font-size="9.5" letter-spacing=".5" fill="${C.cyan}">${esc(tag)}</text>`;
    tagX -= 6;
  }
  const image = shot
    ? `<image x="${IX}" y="${IY}" width="${IW}" height="${IH}" preserveAspectRatio="xMidYMin slice" clip-path="url(#img)" href="data:image/jpeg;base64,${shot}"/>
       <rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" clip-path="url(#img)" fill="url(#shade)"/>
       <rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" clip-path="url(#img)" fill="url(#scan)"/>`
    : `<rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10" fill="${C.panel}"/><rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10" fill="url(#grid)"/>
       <text class="mono" x="${W / 2}" y="${IY + IH / 2 + 4}" text-anchor="middle" font-size="11" letter-spacing="2" fill="${C.muted}">SCREENSHOT PENDING</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(b.name)} — ${esc(host)}">
<defs>
<style>
${fontFace}
${fontsCss}
.edge{stroke-dasharray:240 1200;animation:dash 7s linear infinite}
@keyframes dash{to{stroke-dashoffset:-1440}}
.in{opacity:0;animation:fadeIn .8s ease .1s forwards}
@keyframes fadeIn{to{opacity:1}}
${reducedMotion(".edge{stroke-dasharray:none}.in{opacity:1}")}
</style>
<clipPath id="img"><rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10"/></clipPath>
<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".75"/></linearGradient>
<linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".5" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${C.cyan}" stroke-opacity=".18"/></pattern>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".12"/></pattern>
<filter id="blur3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="${C.bg}"/>
<g class="in">${image}</g>
<g>
  <rect x="26" y="26" width="52" height="20" rx="10" fill="${C.bg}" fill-opacity=".85" stroke="${C.lime}" stroke-opacity=".8"/>
  <circle cx="38" cy="36" r="3" fill="${C.lime}"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
  <text class="mono" x="47" y="40" font-size="9.5" font-weight="700" letter-spacing="1.5" fill="${C.lime}">LIVE</text>
</g>
<text class="orb" x="18" y="270" font-size="15" font-weight="700" fill="${C.text}">${esc(b.name)}</text>
${chips}
<text class="mono" x="18" y="288" font-size="10" letter-spacing=".5" fill="${C.muted}">${esc(host)} ↗</text>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="${C.line}"/>
<rect class="edge" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="url(#edgeGrad)" stroke-width="2.5" stroke-linecap="round"/>
<rect class="edge" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="url(#edgeGrad)" stroke-width="2.5" filter="url(#blur3)" opacity=".7"/>
</svg>`;
}

/* ═══════════════════════════════ WRITE ═══════════════════════════════ */
const files = {
  "header.svg": header(THEMES.dark, "dark"),
  "header-light.svg": header(THEMES.light, "light"),
  "typing.svg": typing(),
  "divider.svg": divider(),
  "skills.svg": skills(),
  "stats.svg": statsPanel(stats),
  "footer.svg": footer(THEMES.dark, "dark"),
  "footer-light.svg": footer(THEMES.light, "light"),
};
for (const b of builds) files[`builds/${b.slug}.svg`] = buildCard(b);
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, name), svg);
  console.log(name.padEnd(26), (svg.length / 1024).toFixed(1).padStart(6) + " KB");
}
