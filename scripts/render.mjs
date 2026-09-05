// Renders every SVG in assets/ from data/ (stats.json, builds.json, shots/, icons/, avatar).
// Pure Node, no dependencies. Run: node scripts/render.mjs
// Desktop assets are 1200 wide; *-mobile.svg variants are 640 wide and picked by <picture media="(max-width: 640px)">.
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
const fullDate = (iso) => { const d = new Date(iso); return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()].toUpperCase()} ${d.getUTCFullYear()}`; };
const ascii = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const iconUri = (name) => { const p = join(ROOT, "data", "icons", `${name}.svg`); return existsSync(p) ? `data:image/svg+xml;base64,${readFileSync(p).toString("base64")}` : null; };
const avatarUri = () => { for (const f of ["avatar.jpg", "avatar.png"]) { const p = join(ROOT, "data", f); if (existsSync(p)) { const b = readFileSync(p); return `data:${b[0] === 0xff ? "image/jpeg" : "image/png"};base64,${b.toString("base64")}`; } } return null; };

const THEMES = {
  dark: { bg1: "#0b1330", bg2: C.bg, bg3: "#000000", ink: C.text, muted: C.muted, cyan: C.cyan, mag: C.mag, lime: C.lime, line: C.line, grid: C.cyan, gridOp: .38, hzOp: .45, stars: ["#E2E8F0", C.lime, C.mag], scanOp: .05, sunOp: 1 },
  light: { bg1: "#FFFFFF", bg2: L.bg, bg3: L.bg2, ink: L.text, muted: L.muted, cyan: L.cyan, mag: L.mag, lime: L.lime, line: L.line, grid: L.grid, gridOp: .22, hzOp: .18, stars: ["#94A3B8", L.lime, L.mag], scanOp: .025, sunOp: .9 },
};

const PROFILE = { name: stats?.name || "Lê Nguyên Quốc Khánh", handle: "khanh020905", org: "Duo Tech", base: "Viet Nam · UTC+7", quest: "building cinematic web experiences", classes: ["CREATIVE DEVELOPER", "UI/UX DESIGNER", "FRONTEND ENGINEER"] };

/* ───────────────────────── shared header pieces ───────────────────────── */
function headerCss(t, W, H, HZ, CYCLE) {
  return `
${fontFace}
${fontsCss}
.scene{animation:sceneIn 1.1s ease .25s both}
@keyframes sceneIn{from{opacity:0}to{opacity:1}}
.crt{transform-box:fill-box;transform-origin:50% 50%;opacity:0;animation:crtOn 1s cubic-bezier(.2,.8,.2,1) both}
@keyframes crtOn{0%{transform:scale(0,.006);opacity:1}30%{transform:scale(1,.006);opacity:1}62%{transform:scale(1,1);opacity:.5}100%{transform:scale(1,1);opacity:0}}
.st{animation:tw 2.4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
.p1{animation:drift 150s linear infinite}.p2{animation:drift 95s linear infinite}.p3{animation:drift 60s linear infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-${W}px)}}
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
.boot{transform-box:fill-box;transform-origin:0 50%;animation:boot 2.6s cubic-bezier(.2,.9,.2,1) .9s both}
@keyframes boot{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bootTxt{animation:fadeIn .6s ease 3.4s both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.sweep{animation:sweep 4s linear infinite}
@keyframes sweep{from{transform:translateX(-260px)}to{transform:translateX(${W + 260}px)}}
.sun{animation:sunPulse 5s ease-in-out infinite}
@keyframes sunPulse{0%,100%{opacity:${(t.sunOp * .85).toFixed(2)}}50%{opacity:${t.sunOp}}}
${reducedMotion(`.h{opacity:.35}.st{opacity:.7}`)}`;
}
function headerDefs(t, W, H, HZ, sunX, sunR, sliceClips) {
  let stripes = "";
  for (let i = 0; i < 9; i++) { const y = HZ - 6 - i * (8 + i * 1.6); const h = 2 + i * 0.9; stripes += `<rect x="${sunX - 150}" y="${(y - h).toFixed(1)}" width="300" height="${h.toFixed(1)}" fill="#000"/>`; }
  return `
<radialGradient id="bgGrad" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${t.bg1}"/><stop offset=".6" stop-color="${t.bg2}"/><stop offset="1" stop-color="${t.bg3}"/></radialGradient>
<linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.mag}" stop-opacity="0"/><stop offset="1" stop-color="${t.mag}" stop-opacity="${t.hzOp}"/></linearGradient>
<linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg2}" stop-opacity="0"/><stop offset="1" stop-color="${t.bg2}" stop-opacity=".95"/></linearGradient>
<linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.lime}"/><stop offset=".55" stop-color="#FF7A00"/><stop offset="1" stop-color="${C.mag}"/></linearGradient>
<linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="bootGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.cyan}"/><stop offset=".6" stop-color="${t.mag}"/><stop offset="1" stop-color="${t.lime}"/></linearGradient>
<linearGradient id="tail1" gradientUnits="userSpaceOnUse" x1="-130" y1="-46" x2="0" y2="0"><stop offset="0" stop-color="${t.ink}" stop-opacity="0"/><stop offset="1" stop-color="${t.ink}"/></linearGradient>
<linearGradient id="tail2" gradientUnits="userSpaceOnUse" x1="130" y1="-46" x2="0" y2="0"><stop offset="0" stop-color="${t.ink}" stop-opacity="0"/><stop offset="1" stop-color="${t.ink}"/></linearGradient>
<mask id="sunMask"><rect x="${sunX - 150}" y="${HZ - sunR - 20}" width="300" height="${sunR + 20}" fill="#fff"/>${stripes}</mask>
<clipPath id="aboveHz"><rect x="0" y="0" width="${W}" height="${HZ}"/></clipPath>
<clipPath id="belowHz"><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}"/></clipPath>
${sliceClips}
${filters(t.cyan, t.mag)}`;
}
function starLayers(t, W, HZ, counts) {
  const rnd = mulberry32(20260905);
  return counts.map(([n, rMin, rMax]) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = Math.round(rnd() * W), y = Math.round(rnd() * (HZ - 25)), r = (rMin + rnd() * (rMax - rMin)).toFixed(1);
      const dur = (1.6 + rnd() * 3).toFixed(2), delay = (-rnd() * 4).toFixed(2);
      const col = rnd() < 0.12 ? t.stars[2] : rnd() < 0.28 ? t.stars[1] : t.stars[0];
      s += `<circle class="st" cx="${x}" cy="${y}" r="${r}" fill="${col}" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`;
    }
    return `<g>${s}</g><g transform="translate(${W},0)">${s}</g>`;
  });
}
function gridLines(t, W, H, HZ, VP, N, CYCLE) {
  let v = "";
  for (let xe = -1400; xe <= W + 1400; xe += 110) v += `<line x1="${VP}" y1="${HZ}" x2="${xe}" y2="${H}"/>`;
  let h = "";
  for (let i = 0; i < N; i++) h += `<line class="h" x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" style="animation-delay:${(-(i / N) * CYCLE).toFixed(3)}s"/>`;
  return `<g clip-path="url(#belowHz)"><g stroke="${t.grid}" stroke-width="1" opacity="${t.gridOp}">${v}</g><g>${h}</g><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#floorFade)"/></g>`;
}
function slicedTitle(t, x, y, size, bands, clipX, clipW, dxs) {
  const clips = bands.map(([a, b], i) => `<clipPath id="band${i}"><rect x="${clipX}" y="${a}" width="${clipW}" height="${b - a}"/></clipPath>`).join("");
  const txt = (cls, fill, extra = "") => `<text class="${cls}" x="${x}" y="${y}" fill="${fill}"${extra}>KHANH020905</text>`;
  const slices = bands.map((_, i) => `<g clip-path="url(#band${i})" class="sl" style="--dx:${dxs[i]}px;animation-delay:${(-i * 1.7).toFixed(1)}s">${txt("gA", t.cyan)}${txt("gB", t.mag)}${txt("title", t.ink, ' filter="url(#neonCyan)"')}</g>`).join("");
  return { clips, svg: `<g font-size="${size}" font-weight="900" letter-spacing="2">${slices}</g>` };
}
const onlineDot = (t, x, y, size = 11) => `<g class="mono" font-size="${size}" letter-spacing="1.5"><text x="${x}" y="${y + 4}" fill="${t.muted}">[</text><circle cx="${x + size * 1.3}" cy="${y}" r="3.5" fill="${t.lime}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="${x + size * 1.3}" cy="${y}" r="3.5" fill="none" stroke="${t.lime}" stroke-width="1.2"><animate attributeName="r" values="3.5;11" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/></circle><text x="${x + size * 2.4}" y="${y + 4}" fill="${t.lime}">ONLINE ]</text></g>`;

/* ═══════════════════════════════ HEADER (desktop) ═══════════════════════════════ */
function header(t, key) {
  const W = 1200, H = 340, HZ = 215, VP = 600, CYCLE = 3.2;
  const layers = starLayers(t, W, HZ, [[34, .5, 1.1], [26, .9, 1.6], [16, 1.3, 2.2]]);
  const title = slicedTitle(t, 70, 112, 66, [[40, 78], [78, 92], [92, 104], [104, 132]], 40, 780, [-9, 11, -6, 7]);
  const hud = stats
    ? `<text x="${W - 58}" y="${H - 34}" text-anchor="end" fill="${t.muted}">STREAK <tspan fill="${t.lime}">${stats.streak.current}D</tspan>  ·  <tspan fill="${t.cyan}">${fmtK(stats.last12.total)}</tspan> CONTRIB / 12MO  ·  <tspan fill="${t.mag}">${stats.publicRepos}</tspan> REPOS  ·  SYNC ${stats.generatedAt.slice(0, 10)}</text>`
    : `<text x="${W - 58}" y="${H - 34}" text-anchor="end" fill="${t.muted}">DUO TECH  ·  CREATIVE WEB</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="KHANH020905 // SYSTEM ONLINE — Creative Developer, UI/UX Designer, Frontend Engineer">
<defs><style>${headerCss(t, W, H, HZ, CYCLE)}
.shoot{opacity:0;animation:shoot1 9s cubic-bezier(.25,.6,.4,1) infinite}.shoot2{opacity:0;animation:shoot2 12s cubic-bezier(.25,.6,.4,1) infinite}
@keyframes shoot1{0%{transform:translate(160px,18px);opacity:0}3%{opacity:1}20%{transform:translate(760px,175px);opacity:0}100%{transform:translate(760px,175px);opacity:0}}
@keyframes shoot2{0%{transform:translate(1120px,12px);opacity:0}3%{opacity:1}18%{transform:translate(640px,160px);opacity:0}100%{transform:translate(640px,160px);opacity:0}}
</style>${headerDefs(t, W, H, HZ, 1000, 112, title.clips)}</defs>
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
  ${gridLines(t, W, H, HZ, VP, 9, CYCLE)}
  ${corners(18, 18, 1, 1, t.cyan)}${corners(W - 18, 18, -1, 1, t.cyan)}${corners(18, H - 18, 1, -1, t.cyan)}${corners(W - 18, H - 18, -1, -1, t.cyan)}
  ${onlineDot(t, 58, 32)}
  <g class="mono" font-size="11" letter-spacing="1.5"><text x="${W - 58}" y="36" text-anchor="end" fill="${t.muted}">LOC: VIET NAM · UTC+7 · DUO TECH</text>${hud}</g>
  <g class="orb">
    ${title.svg}
    <g font-size="26" font-weight="700" letter-spacing="4"><text x="72" y="152" fill="${t.cyan}" filter="url(#neonMag)">// SYSTEM ONLINE</text><rect class="cur" x="426" y="130" width="14" height="24" fill="${t.mag}"/></g>
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

/* ═══════════════════════════════ HEADER (mobile, 640 wide) ═══════════════════════════════ */
function headerMobile(t) {
  const W = 640, H = 520, HZ = 356, VP = 320, CYCLE = 3.2;
  const layers = starLayers(t, W, HZ, [[26, .5, 1.1], [18, .9, 1.6], [12, 1.3, 2.2]]);
  const title = slicedTitle(t, 36, 150, 52, [[100, 128], [128, 140], [140, 150], [150, 170]], 20, 600, [-7, 9, -5, 6]);
  const hud = stats
    ? `<text x="36" y="${H - 30}" fill="${t.muted}">STREAK <tspan fill="${t.lime}">${stats.streak.current}D</tspan> · <tspan fill="${t.cyan}">${fmtK(stats.last12.total)}</tspan> CONTRIB · <tspan fill="${t.mag}">${stats.publicRepos}</tspan> REPOS · SYNC ${stats.generatedAt.slice(5, 10)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="KHANH020905 // SYSTEM ONLINE — Creative Developer, UI/UX Designer, Frontend Engineer">
<defs><style>${headerCss(t, W, H, HZ, CYCLE)}
.shoot{opacity:0;animation:shoot1 9s cubic-bezier(.25,.6,.4,1) infinite}
@keyframes shoot1{0%{transform:translate(60px,20px);opacity:0}3%{opacity:1}20%{transform:translate(560px,250px);opacity:0}100%{transform:translate(560px,250px);opacity:0}}
</style>${headerDefs(t, W, H, HZ, 520, 110, title.clips)}</defs>
<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
<g class="scene">
  <g clip-path="url(#aboveHz)">
    <g class="p1">${layers[0]}</g><g class="p2">${layers[1]}</g><g class="p3">${layers[2]}</g>
    <g class="shoot"><line x1="-130" y1="-46" x2="0" y2="0" stroke="url(#tail1)" stroke-width="2" stroke-linecap="round"/><circle r="2.4" fill="${t.ink}"/></g>
  </g>
  <g clip-path="url(#aboveHz)" filter="url(#softGlow)" class="sun"><circle cx="520" cy="${HZ}" r="110" fill="url(#sunGrad)" mask="url(#sunMask)"/></g>
  <rect x="0" y="${HZ - 90}" width="${W}" height="90" fill="url(#horizonGlow)"/>
  <line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="${t.cyan}" stroke-width="2" filter="url(#lineGlow)"/>
  ${gridLines(t, W, H, HZ, VP, 8, CYCLE)}
  ${corners(16, 16, 1, 1, t.cyan, 22)}${corners(W - 16, 16, -1, 1, t.cyan, 22)}${corners(16, H - 16, 1, -1, t.cyan, 22)}${corners(W - 16, H - 16, -1, -1, t.cyan, 22)}
  ${onlineDot(t, 44, 44, 14)}
  <g class="mono" font-size="14" letter-spacing="1.5"><text x="${W - 44}" y="49" text-anchor="end" fill="${t.muted}">UTC+7 · DUO TECH</text>${hud}</g>
  <g class="orb">
    ${title.svg}
    <g font-size="22" font-weight="700" letter-spacing="3"><text x="38" y="194" fill="${t.cyan}" filter="url(#neonMag)">// SYSTEM ONLINE</text><rect class="cur" x="336" y="175" width="12" height="20" fill="${t.mag}"/></g>
    <text x="39" y="234" font-size="15" font-weight="400" letter-spacing="2.4" fill="${t.lime}">CREATIVE DEVELOPER  •  UI/UX DESIGNER</text>
    <text x="39" y="260" font-size="15" font-weight="400" letter-spacing="2.4" fill="${t.lime}">FRONTEND ENGINEER</text>
  </g>
  <g class="mono" font-size="13" letter-spacing="1.2">
    <text x="36" y="${H - 58}" fill="${t.muted}">BOOT</text>
    <rect x="86" y="${H - 67}" width="280" height="9" rx="4.5" fill="#0f172a" stroke="${t.line}" stroke-width="1"/>
    <rect class="boot" x="86" y="${H - 67}" width="280" height="9" rx="4.5" fill="url(#bootGrad)"/>
    <text class="bootTxt" x="378" y="${H - 58}" fill="${t.lime}">100% · READY_</text>
  </g>
  <g clip-path="url(#belowHz)" opacity=".35"><rect class="sweep" x="0" y="${HZ - 1}" width="260" height="3" fill="url(#sweepGrad)"/></g>
  <rect width="${W}" height="${H}" fill="url(#scan)"/>
</g>
<rect class="crt" x="0" y="0" width="${W}" height="${H}" fill="#E0FCFF"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="none" stroke="${t.line}"/>
</svg>`;
}

/* ═══════════════════════════════ TYPING ═══════════════════════════════ */
function typing(mobile = false) {
  const W = mobile ? 640 : 1200, H = mobile ? 40 : 44, size = mobile ? 17 : 15;
  const lines = mobile
    ? ["$ whoami  →  Creative Developer", "$ build --cinematic web experiences", "$ stack: React · Next.js · TypeScript", "$ status: AVAILABLE_FOR_HIRE ✓"]
    : ["$ whoami  →  Creative Developer / UI-UX Designer", "$ build --cinematic web experiences --with GSAP & Three.js", "$ stack: React · Next.js · TypeScript · Tailwind", "$ status: AVAILABLE_FOR_HIRE ✓"];
  const SLOT = 5, TYPE = 2.4, T = SLOT * lines.length;
  const typePct = ((TYPE / T) * 100).toFixed(2), endPct = ((SLOT / T) * 100 - 0.01).toFixed(2), nextPct = ((SLOT / T) * 100).toFixed(2);
  const rows = lines.map((l, i) =>
    `<text class="orb ln${i === 0 ? " first" : ""}" x="${W / 2}" y="${mobile ? 26 : 28}" text-anchor="middle" font-size="${size}" font-weight="600" letter-spacing="1" fill="${C.cyan}" style="animation-delay:${i * SLOT}s;animation-timing-function:steps(${l.length + 2},end)">${esc(l)} _</text>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lines.join(" | "))}">
<defs><style>
${fontFace}
${fontsCss}
.ln{opacity:0;animation:typeLine ${T}s infinite;clip-path:inset(0 100% 0 0)}
.ln.first{opacity:1;clip-path:none}
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

/* ═══════════════════════════════ ID CARD ═══════════════════════════════ */
function qrPattern(x0, y0, n, cell, color, seed) {
  const rnd = mulberry32(seed);
  const finder = (fx, fy) => [[fx, fy, 7], [fx + 1, fy + 1, 5, true], [fx + 2, fy + 2, 3]];
  let out = "";
  const isFinder = (i, j) => (i < 8 && j < 8) || (i < 8 && j >= n - 8) || (i >= n - 8 && j < 8);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (isFinder(i, j)) continue;
    const timing = (i === 6 || j === 6) ? (i + j) % 2 === 0 : rnd() < 0.44;
    if (timing) out += `<rect x="${x0 + j * cell}" y="${y0 + i * cell}" width="${cell}" height="${cell}" fill="${color}"/>`;
  }
  for (const [fx, fy] of [[0, 0], [0, n - 7], [n - 7, 0]]) for (const [a, b, s, hole] of finder(fx, fy)) {
    out += `<rect x="${x0 + b * cell}" y="${y0 + a * cell}" width="${s * cell}" height="${s * cell}" fill="${hole ? C.bg : color}"/>`;
  }
  return out;
}
function barcode(x0, y0, w, h, color, seed) {
  const rnd = mulberry32(seed);
  let out = "", x = x0;
  while (x < x0 + w - 3) { const bw = 1 + Math.floor(rnd() * 3), gap = 1 + Math.floor(rnd() * 3); out += `<rect x="${x}" y="${y0}" width="${bw}" height="${h}" fill="${color}"/>`; x += bw + gap; }
  return out;
}
function idCard(s, mobile = false) {
  const av = avatarUri();
  const total = s?.allTime?.total ?? 0;
  const level = Math.floor(Math.sqrt(total) / 2), lo = (level * 2) ** 2, hi = ((level + 1) * 2) ** 2, xp = total - lo, xpNeed = hi - lo, xpPct = Math.min(1, xp / xpNeed);
  const issued = s?.createdAt ? fullDate(s.createdAt) : "08 MAR 2025";
  const idNo = s?.createdAt ? `TID-${s.createdAt.slice(0, 10).replace(/-/g, "")}` : "TID-20250308";
  const W = mobile ? 640 : 1200, H = mobile ? 760 : 400;
  const chip = (x, y) => `<g><rect x="${x}" y="${y}" width="54" height="40" rx="6" fill="url(#gold)"/><path d="M${x + 18} ${y} V${y + 40} M${x + 36} ${y} V${y + 40} M${x} ${y + 13} H${x + 54} M${x} ${y + 27} H${x + 54}" stroke="#7c5a12" stroke-width="1.2" fill="none"/><rect x="${x + 18}" y="${y + 13}" width="18" height="14" rx="2" fill="none" stroke="#7c5a12" stroke-width="1.2"/></g>`;
  const chipRow = (x, y, centered) => {
    const items = PROFILE.classes.map((c, i) => [c, [C.cyan, C.mag, C.lime][i]]);
    let out = "", cx = x; const widths = items.map(([c]) => Math.round(c.length * 6.6 + 18));
    if (centered) cx = x - (widths.reduce((a, b) => a + b, 0) + 8 * (items.length - 1)) / 2;
    items.forEach(([c, col], i) => { const w = widths[i]; out += `<rect x="${cx}" y="${y}" width="${w}" height="22" rx="5" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-opacity=".8"/><text class="mono" x="${cx + w / 2}" y="${y + 15}" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1.2" fill="${col}">${c}</text>`; cx += w + 8; });
    return out;
  };
  const kv = (x, y, k, v, col = C.text, size = 11) => `<text class="mono" x="${x}" y="${y}" font-size="${size}" letter-spacing="1.4" fill="${C.muted}">${k}</text><text class="mono" x="${x + (mobile ? 118 : 96)}" y="${y}" font-size="${size + 1}" letter-spacing=".4" fill="${col}">${esc(v)}</text>`;
  const avatar = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="${C.cyan}" stroke-opacity=".25" stroke-width="1"/>
  <circle class="ring" cx="${cx}" cy="${cy}" r="${r + 9}" fill="none" stroke="url(#ringGrad)" stroke-width="2" stroke-dasharray="14 10 4 10"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="14s" repeatCount="indefinite"/></circle>
  <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${C.panel}" stroke="${C.cyan}" stroke-width="1.5" filter="url(#softGlow)"/>
  ${av ? `<image x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avClip)" href="${av}"/>` : `<text class="orb" x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="${r * .8}" font-weight="900" fill="${C.cyan}">QK</text>`}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#scanCard)" clip-path="url(#avClip)"/>
  <g><rect x="${cx - 40}" y="${cy + r + 18}" width="80" height="22" rx="11" fill="${C.bg}" stroke="${C.lime}" stroke-opacity=".8"/><circle cx="${cx - 22}" cy="${cy + r + 29}" r="3.5" fill="${C.lime}"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle><text class="mono" x="${cx + 6}" y="${cy + r + 33}" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1.5" fill="${C.lime}">ONLINE</text></g>`;
  const levelBlock = (x, y, barW) => `
  <text class="orb" x="${x}" y="${y}" font-size="26" font-weight="900" fill="${C.lime}" filter="url(#neonLime)">LVL ${level}</text>
  <rect x="${x + 112}" y="${y - 15}" width="${barW}" height="10" rx="5" fill="${C.panel}" stroke="${C.line}"/>
  <g class="xp"><rect x="${x + 112}" y="${y - 15}" width="${Math.round(barW * xpPct)}" height="10" rx="5" fill="url(#xpGrad)"/><rect x="${x + 112}" y="${y - 15}" width="${Math.round(barW * xpPct)}" height="10" rx="5" fill="url(#xpGrad)" filter="url(#blur4)" opacity=".7"/></g>
  <text class="mono" x="${x + 112 + barW + 12}" y="${y - 6}" font-size="10.5" letter-spacing="1" fill="${C.muted}">${fmt(xp)} / ${fmt(xpNeed)} XP</text>`;
  const mini = s ? [["CONTRIB", fmt(s.allTime.total), C.cyan], ["REPOS", fmt(s.publicRepos), C.mag], ["STREAK", `${s.streak.current}D`, C.lime], ["FOLLOWERS", fmt(s.followers), C.text], ["STARS", fmt(s.stars), C.lime]] : [];
  const miniRow = (x, y, gap) => mini.map(([k, v, col], i) => `<text class="mono" x="${x + i * gap}" y="${y}" font-size="9.5" letter-spacing="1.6" fill="${C.muted}">${k}</text><text class="orb" x="${x + i * gap}" y="${y + 20}" font-size="16" font-weight="900" fill="${col}">${v}</text>`).join("");
  const defs = `
<defs><style>
${fontFace}
${fontsCss}
.holo{animation:holo 7s ease-in-out infinite}
@keyframes holo{0%{transform:translateX(-420px) skewX(-22deg)}55%{transform:translateX(${W + 420}px) skewX(-22deg)}100%{transform:translateX(${W + 420}px) skewX(-22deg)}}
.in{animation:fadeUp .7s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.xp{transform-box:fill-box;transform-origin:0 50%;animation:grow 1.2s cubic-bezier(.2,.85,.2,1) .6s both}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
${reducedMotion(".holo{display:none}")}
</style>
<linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1531"/><stop offset=".5" stop-color="${C.bg}"/><stop offset="1" stop-color="#140a2a"/></linearGradient>
<linearGradient id="cardEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".5" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<linearGradient id="holoGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".3" stop-color="${C.cyan}" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset=".7" stop-color="${C.mag}" stop-opacity=".16"/><stop offset="1" stop-color="${C.lime}" stop-opacity="0"/></linearGradient>
<linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.mag}"/></linearGradient>
<linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".6" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e08a"/><stop offset=".5" stop-color="#c9a227"/><stop offset="1" stop-color="#f3d370"/></linearGradient>
<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="14" fill="#fff" opacity=".035"/></pattern>
<pattern id="scanCard" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".14"/></pattern>
<clipPath id="card"><rect x="${mobile ? 16 : 20}" y="${mobile ? 16 : 20}" width="${W - (mobile ? 32 : 40)}" height="${H - (mobile ? 32 : 40)}" rx="18"/></clipPath>
<clipPath id="avClip"><circle cx="${mobile ? 320 : 190}" cy="${mobile ? 150 : 196}" r="${mobile ? 78 : 88}"/></clipPath>
<filter id="neonLime" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/><feFlood flood-color="${C.lime}" flood-opacity=".6"/><feComposite in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
${filters()}
</defs>`;
  const cardBg = `
<rect x="${mobile ? 16 : 20}" y="${mobile ? 16 : 20}" width="${W - (mobile ? 32 : 40)}" height="${H - (mobile ? 32 : 40)}" rx="18" fill="url(#cardGrad)" stroke="url(#cardEdge)" stroke-width="1.5"/>
<rect x="${mobile ? 16 : 20}" y="${mobile ? 16 : 20}" width="${W - (mobile ? 32 : 40)}" height="${H - (mobile ? 32 : 40)}" rx="18" fill="url(#hatch)"/>
<g clip-path="url(#card)"><rect class="holo" x="0" y="-60" width="260" height="${H + 120}" fill="url(#holoGrad)"/></g>`;
  const label = (x, y, txt, anchor = "start") => `<text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" letter-spacing="2.2" fill="${C.muted}">${txt}</text>`;

  if (!mobile) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Operator ID card: ${esc(PROFILE.name)} (@${PROFILE.handle}) — ${PROFILE.classes.join(", ")} — level ${level}">
${defs}
<rect width="${W}" height="${H}" fill="none"/>
${cardBg}
<g class="in" style="animation-delay:.1s">${avatar(190, 196, 88)}</g>
<g class="in" style="animation-delay:.25s">
  ${label(330, 70, `OPERATOR ID  ·  ${idNo}  ·  ISSUED ${issued}`)}
  <text class="orb" x="328" y="116" font-size="34" font-weight="900" fill="${C.text}" filter="url(#neonCyan)">${esc(ascii(PROFILE.name).toUpperCase())}</text>
  <text x="330" y="140" font-family="-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="13" fill="${C.muted}">${esc(PROFILE.name)}  ·  @${PROFILE.handle}</text>
  ${chipRow(330, 156, false)}
  ${kv(330, 214, "ORG", PROFILE.org)}${kv(560, 214, "BASE", PROFILE.base)}
  ${kv(330, 240, "QUEST", PROFILE.quest, C.cyan)}
  ${kv(330, 266, "CLEARANCE", "AVAILABLE FOR HIRE", C.lime)}${kv(720, 266, "CLASS", "S", C.mag)}
  ${levelBlock(330, 312, 300)}
  ${miniRow(330, 344, 118)}
</g>
<g class="in" style="animation-delay:.4s">
  ${chip(880, 62)}
  ${qrPattern(1006, 50, 21, 5.6, C.cyan, 20250308)}
  ${label(1065, 190, "SCAN · TID", "middle")}
  ${barcode(880, 222, 270, 62, C.text, 20260905)}
  ${label(1015, 306, `${PROFILE.handle.toUpperCase()}  ·  VALID THRU ∞`, "middle")}
  <rect x="880" y="330" width="86" height="20" rx="4" fill="none" stroke="${C.mag}" stroke-opacity=".8"/><text class="mono" x="923" y="344" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="2" fill="${C.mag}">HOLO-ID</text>
  ${label(1150, 344, "TYPE: CREATIVE DEV", "end")}
</g>
${corners(30, 30, 1, 1, C.cyan, 16)}${corners(W - 30, 30, -1, 1, C.cyan, 16)}${corners(30, H - 30, 1, -1, C.cyan, 16)}${corners(W - 30, H - 30, -1, -1, C.cyan, 16)}
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Operator ID card: ${esc(PROFILE.name)} (@${PROFILE.handle}) — ${PROFILE.classes.join(", ")} — level ${level}">
${defs}
<rect width="${W}" height="${H}" fill="none"/>
${cardBg}
<g class="in" style="animation-delay:.1s">${avatar(320, 150, 78)}</g>
<g class="in" style="animation-delay:.25s">
  ${label(320, 300, `OPERATOR ID  ·  ${idNo}`, "middle")}
  <text class="orb" x="320" y="338" text-anchor="middle" font-size="27" font-weight="900" fill="${C.text}" filter="url(#neonCyan)">${esc(ascii(PROFILE.name).toUpperCase())}</text>
  <text x="320" y="362" text-anchor="middle" font-family="-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="14" fill="${C.muted}">${esc(PROFILE.name)}  ·  @${PROFILE.handle}</text>
  ${chipRow(320, 380, true)}
  ${kv(44, 440, "ORG", PROFILE.org, C.text, 12)}${kv(340, 440, "BASE", PROFILE.base, C.text, 12)}
  ${kv(44, 468, "QUEST", PROFILE.quest, C.cyan, 12)}
  ${kv(44, 496, "CLEARANCE", "AVAILABLE FOR HIRE", C.lime, 12)}
  ${levelBlock(44, 548, 230)}
  ${miniRow(44, 584, 118)}
</g>
<g class="in" style="animation-delay:.4s">
  ${chip(44, 632)}
  ${barcode(112, 626, 356, 52, C.text, 20260905)}
  ${qrPattern(490, 616, 21, 5, C.cyan, 20250308)}
  ${label(290, 704, `${PROFILE.handle.toUpperCase()}  ·  ISSUED ${issued}  ·  VALID THRU ∞`, "middle")}
</g>
${corners(26, 26, 1, 1, C.cyan, 14)}${corners(W - 26, 26, -1, 1, C.cyan, 14)}${corners(26, H - 26, 1, -1, C.cyan, 14)}${corners(W - 26, H - 26, -1, -1, C.cyan, 14)}
</svg>`;
}

/* ═══════════════════════════════ CIRCUIT BOARD (tech stack) ═══════════════════════════════ */
const STACK = [
  { key: "core", label: "CORE", color: C.cyan, icons: ["ts", "js", "react", "nextjs", "tailwind", "html", "css"] },
  { key: "motion", label: "MOTION & 3D", color: C.mag, icons: ["gsap", "framer", "threejs"] },
  { key: "backend", label: "BACKEND & DATA", color: C.lime, icons: ["nodejs", "java", "supabase", "postgres", "cloudflare", "docker"] },
  { key: "tools", label: "TOOLS & DEPLOY", color: "#E2E8F0", icons: ["git", "github", "figma", "vscode", "vercel", "arduino"] },
];
const ICON_LABEL = { ts: "TypeScript", js: "JavaScript", react: "React", nextjs: "Next.js", tailwind: "Tailwind", html: "HTML", css: "CSS", gsap: "GSAP", framer: "Framer", threejs: "Three.js", nodejs: "Node.js", java: "Java", supabase: "Supabase", postgres: "Postgres", cloudflare: "Cloudflare", docker: "Docker", git: "Git", github: "GitHub", figma: "Figma", vscode: "VS Code", vercel: "Vercel", arduino: "Arduino" };

function stackCss() {
  return `
${fontFace}
${fontsCss}
.node{animation:fadeIn .6s ease both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.cpu{animation:cpu 3s ease-in-out infinite}
@keyframes cpu{0%,100%{opacity:.55}50%{opacity:1}}
${reducedMotion("")}`;
}
function stackDefs() {
  return `
<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${C.cyan}" opacity=".16"/></pattern>
<linearGradient id="cpuEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".5" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<radialGradient id="cpuCore" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".35"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
<filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
${filters()}`;
}
// Icons skillicons doesn't have, drawn inline (viewBox 0 0 256 256, same frame as the skillicons files)
const INLINE_ICONS = {
  gsap: `<rect width="256" height="256" rx="60" fill="#0AE448"/><text x="128" y="150" text-anchor="middle" font-family="'Orbitron','Segoe UI',Arial,sans-serif" font-size="64" font-weight="900" fill="#0E100F" letter-spacing="2">GSAP</text>`,
  framer: `<rect width="256" height="256" rx="60" fill="#0B0B0F"/><path fill="#fff" d="M64 40h128v58H128zM64 98h64l64 58H64zM64 156h64v60z"/>`,
};
function nodeSvg(icon, x, y, color, size, i) {
  const half = size / 2, is = Math.round(size * .56), uri = iconUri(icon), inline = INLINE_ICONS[icon];
  const ix = x - is / 2, iy = y - half + Math.round(size * .1);
  const art = uri ? `<image x="${ix}" y="${iy}" width="${is}" height="${is}" href="${uri}"/>`
    : inline ? `<g transform="translate(${ix} ${iy}) scale(${(is / 256).toFixed(4)})">${inline}</g>`
    : `<text class="orb" x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="900" fill="${color}">${icon.toUpperCase()}</text>`;
  return `<g class="node" style="animation-delay:${(0.2 + i * 0.05).toFixed(2)}s">
  <rect x="${x - half}" y="${y - half}" width="${size}" height="${size}" rx="${Math.round(size * .18)}" fill="${C.panel}" stroke="${color}" stroke-opacity=".55" stroke-width="1.2"/>
  ${art}
  <text class="mono" x="${x}" y="${y + half - Math.round(size * .1)}" text-anchor="middle" font-size="${size >= 72 ? 10.5 : 8.5}" letter-spacing=".3" fill="${C.muted}">${ICON_LABEL[icon] || icon}</text>
</g>`;
}
function pulse(pathId, color, i, dur) {
  return `<circle r="6" fill="${color}" opacity=".35" filter="url(#pulseGlow)"><animateMotion dur="${dur}s" begin="${(-i * 0.61).toFixed(2)}s" repeatCount="indefinite"><mpath href="#${pathId}"/></animateMotion></circle><circle r="2.6" fill="${color}"><animateMotion dur="${dur}s" begin="${(-i * 0.61).toFixed(2)}s" repeatCount="indefinite"><mpath href="#${pathId}"/></animateMotion></circle>`;
}
function cpuSvg(x, y, w, h) {
  let pins = "";
  for (let i = 0; i < 6; i++) { const px = x + 18 + i * ((w - 36) / 5); pins += `<rect x="${px - 3}" y="${y - 8}" width="6" height="8" fill="${C.line}"/><rect x="${px - 3}" y="${y + h}" width="6" height="8" fill="${C.line}"/>`; }
  for (let i = 0; i < 4; i++) { const py = y + 18 + i * ((h - 36) / 3); pins += `<rect x="${x - 8}" y="${py - 3}" width="8" height="6" fill="${C.line}"/><rect x="${x + w}" y="${py - 3}" width="8" height="6" fill="${C.line}"/>`; }
  return `${pins}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.panel}" stroke="url(#cpuEdge)" stroke-width="1.6"/>
  <rect class="cpu" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#cpuCore)"/>
  <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="6" fill="none" stroke="${C.line}"/>
  <text class="orb" x="${x + w / 2}" y="${y + h / 2 - 2}" text-anchor="middle" font-size="20" font-weight="900" letter-spacing="2" fill="${C.cyan}" filter="url(#neonCyan)">KHANH</text>
  <text class="mono" x="${x + w / 2}" y="${y + h / 2 + 18}" text-anchor="middle" font-size="9.5" letter-spacing="2" fill="${C.muted}">CORE · v2026.09</text>`;
}
function stackBoard() {
  const W = 1200, H = 480, SIZE = 66, BL = 470, BR = 730, CX = 520, CW = 160, CY = 180, CH = 120;
  const place = {
    core: [["ts", 100, 80], ["js", 200, 80], ["react", 300, 80], ["nextjs", 400, 80], ["tailwind", 150, 175], ["html", 250, 175], ["css", 350, 175]],
    motion: [["gsap", 200, 370], ["framer", 300, 370], ["threejs", 400, 370]],
    backend: [["nodejs", 810, 80], ["java", 910, 80], ["supabase", 1010, 80], ["postgres", 860, 175], ["cloudflare", 960, 175], ["docker", 1060, 175]],
    tools: [["git", 810, 320], ["github", 910, 320], ["figma", 1010, 320], ["vscode", 860, 415], ["vercel", 960, 415], ["arduino", 1060, 415]],
  };
  let paths = "", nodes = "", pulses = "", i = 0;
  for (const g of STACK) for (const [icon, x, y] of place[g.key]) {
    const left = x < 600, up = y > 300, half = SIZE / 2;
    const ch = up ? y - 48 : y + 48, entry = (g.key === "core" || g.key === "backend") ? 230 : 250;
    const d = left ? `M${x} ${up ? y - half : y + half} V${ch} H${BL} V${entry} H${CX}` : `M${x} ${up ? y - half : y + half} V${ch} H${BR} V${entry} H${CX + CW}`;
    paths += `<path id="t${i}" d="${d}" fill="none" stroke="${g.color}" stroke-opacity=".3" stroke-width="1.6" stroke-linejoin="round"/>`;
    pulses += pulse(`t${i}`, g.color, i, 2.6 + (i % 4) * 0.35);
    nodes += nodeSvg(icon, x, y, g.color, SIZE, i);
    i++;
  }
  const glabel = (x, y, g, anchor = "start") => `<text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="10.5" font-weight="700" letter-spacing="2.4" fill="${g.color}">${esc(g.label)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`Tech stack circuit board: ${STACK.map((g) => `${g.label}: ${g.icons.map((k) => ICON_LABEL[k]).join(", ")}`).join(" · ")}`)}">
<defs><style>${stackCss()}</style>${stackDefs()}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
<rect width="${W}" height="${H}" rx="12" fill="url(#dots)"/>
<g stroke-width="2.4" stroke-opacity=".35"><path d="M${BL} 128 V322" stroke="${C.cyan}" fill="none"/><path d="M${BR} 128 V367" stroke="${C.lime}" fill="none"/></g>
${paths}
${glabel(67, 40, STACK[0])}${glabel(167, 421, STACK[1])}${glabel(777, 40, STACK[2])}${glabel(1093, 466, STACK[3], "end")}
${pulses}
${cpuSvg(CX, CY, CW, CH)}
${nodes}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}
function stackBoardMobile() {
  const W = 640, SIZE = 78, SPINE = 320, cols = [96, 245, 395, 544];
  const rows = [];
  for (const g of STACK) { const ic = [...g.icons]; let first = true; while (ic.length) { rows.push({ g, icons: ic.splice(0, 4), first }); first = false; } }
  const ROW = 118, TOP = 200, H = TOP + rows.length * ROW + 10;
  let paths = "", nodes = "", pulses = "", labels = "", i = 0, lastCh = 0;
  rows.forEach((r, ri) => {
    const y = TOP + ri * ROW, ch = y - 60; lastCh = ch;
    const xs = r.icons.map((_, k) => cols[r.icons.length === 4 ? k : k + (4 - r.icons.length === 1 ? 0 : 0)]);
    const xsC = r.icons.length === 4 ? cols : r.icons.length === 3 ? [170, 320, 470] : r.icons.length === 2 ? [245, 395] : [320];
    r.icons.forEach((icon, k) => {
      const x = xsC[k];
      paths += `<path id="t${i}" d="M${SPINE} 110 V${ch} H${x} V${y - SIZE / 2}" fill="none" stroke="${r.g.color}" stroke-opacity=".28" stroke-width="1.6" stroke-linejoin="round"/>`;
      pulses += pulse(`t${i}`, r.g.color, i, 3 + (i % 4) * 0.35);
      nodes += nodeSvg(icon, x, y, r.g.color, SIZE, i);
      i++;
    });
    if (r.first) labels += `<text class="mono" x="24" y="${ch - 10}" font-size="12" font-weight="700" letter-spacing="2.4" fill="${r.g.color}">${esc(r.g.label)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`Tech stack circuit board: ${STACK.map((g) => `${g.label}: ${g.icons.map((k) => ICON_LABEL[k]).join(", ")}`).join(" · ")}`)}">
<defs><style>${stackCss()}</style>${stackDefs()}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
<rect width="${W}" height="${H}" rx="12" fill="url(#dots)"/>
<path d="M${SPINE} 110 V${lastCh}" fill="none" stroke="${C.cyan}" stroke-opacity=".35" stroke-width="2.4"/>
${paths}
${labels}
${pulses}
${cpuSvg(240, 30, 160, 80)}
${nodes}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}

/* ═══════════════════════════════ SKILL TREE ═══════════════════════════════ */
const SKILLS = [
  { tag: "RX", name: "React / Next.js", lvl: "MASTER", pct: 95, col: C.lime },
  { tag: "GS", name: "GSAP / Animation", lvl: "EXPERT", pct: 92, col: C.cyan },
  { tag: "JS", name: "JavaScript", lvl: "EXPERT", pct: 90, col: C.cyan },
  { tag: "UX", name: "UI/UX Design", lvl: "EXPERT", pct: 90, col: C.cyan },
  { tag: "TS", name: "TypeScript", lvl: "EXPERT", pct: 88, col: C.cyan },
  { tag: "3D", name: "Three.js / WebGL", lvl: "ADVANCED", pct: 82, col: C.mag },
  { tag: "JV", name: "Java", lvl: "ADVANCED", pct: 80, col: C.mag },
];
function skillsCss(BW) {
  return `
${fontFace}
${fontsCss}
.row{animation:rowIn .5s ease both}
@keyframes rowIn{from{opacity:0}to{opacity:1}}
.fill{transform-box:fill-box;transform-origin:0 50%;animation:grow 1.3s cubic-bezier(.2,.85,.2,1) both}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.pct{animation:rowIn .6s ease both}
.shine{opacity:0;animation:shine 3.2s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(-80px);opacity:0}10%{opacity:.9}45%{transform:translateX(${BW}px);opacity:0}100%{transform:translateX(${BW}px);opacity:0}}
${reducedMotion(".shine{display:none}")}`;
}
const skillsDefs = (clips) => `
<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".55" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="barGlow" x="-5%" y="-150%" width="110%" height="400%"><feGaussianBlur stdDeviation="4"/></filter>
${clips}
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffffff" opacity=".035"/></pattern>`;
function barSvg(i, BX, cy, BW, BH, fw, delay) {
  return `<rect x="${BX}" y="${cy - BH / 2}" width="${BW}" height="${BH}" rx="${BH / 2}" fill="${C.panel}" stroke="${C.line}" stroke-width="1"/>
  <g class="fill" style="animation-delay:${delay}s"><rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="${BH / 2}" fill="url(#bar)"/><rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="${BH / 2}" fill="url(#bar)" filter="url(#barGlow)" opacity=".7"/></g>
  <g clip-path="url(#c${i})"><rect class="shine" x="${BX}" y="${cy - BH / 2}" width="70" height="${BH}" fill="url(#shine)" style="animation-delay:${(1.8 + i * 0.13).toFixed(2)}s"/></g>`;
}
function skills() {
  const W = 960, ROW = 46, TOP = 22, H = TOP + SKILLS.length * ROW + 10, BX = 420, BW = 430, BH = 12;
  let body = "", clips = "";
  SKILLS.forEach((r, i) => {
    const cy = TOP + i * ROW + ROW / 2, fw = Math.round(BW * r.pct / 100), lw = r.lvl.length * 8.4 + 16;
    clips += `<clipPath id="c${i}"><rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="6"/></clipPath>`;
    body += `<g class="row" style="animation-delay:${(i * 0.08).toFixed(2)}s">
  <rect x="18" y="${cy - 16}" width="44" height="32" rx="6" fill="${r.col}" fill-opacity=".12" stroke="${r.col}" stroke-opacity=".8" stroke-width="1.2"/>
  <text class="orb" x="40" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="900" fill="${r.col}">${r.tag}</text>
  <text class="orb" x="80" y="${cy + 5}" font-size="14.5" font-weight="700" fill="${C.text}">${r.name}</text>
  <rect x="300" y="${cy - 10}" width="${lw}" height="20" rx="4" fill="${C.bg}" stroke="${r.col}" stroke-opacity=".7" stroke-width="1"/>
  <text class="mono" x="${300 + lw / 2}" y="${cy + 4}" text-anchor="middle" font-size="10.5" font-weight="700" letter-spacing="1.2" fill="${r.col}">${r.lvl}</text>
  ${barSvg(i, BX, cy, BW, BH, fw, (0.15 + i * 0.13).toFixed(2))}
  <text class="orb pct" x="${W - 22}" y="${cy + 6}" text-anchor="end" font-size="17" font-weight="900" fill="${r.col}" style="animation-delay:${(0.9 + i * 0.13).toFixed(2)}s">${r.pct}%</text>
</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skill tree: ${SKILLS.map((r) => `${r.name} ${r.pct}%`).join(", ")}">
<defs><style>${skillsCss(BW)}</style>${skillsDefs(clips)}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
<rect x="18" y="8" width="2" height="${H - 16}" fill="url(#bar)" opacity=".6"/>
${body}
<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}
function skillsMobile() {
  const W = 640, ROW = 70, TOP = 18, H = TOP + SKILLS.length * ROW + 8, BX = 24, BW = W - 48, BH = 14;
  let body = "", clips = "";
  SKILLS.forEach((r, i) => {
    const y = TOP + i * ROW, ty = y + 26, cy = y + 50, fw = Math.round(BW * r.pct / 100), lw = r.lvl.length * 9.4 + 18;
    clips += `<clipPath id="c${i}"><rect x="${BX}" y="${cy - BH / 2}" width="${fw}" height="${BH}" rx="7"/></clipPath>`;
    body += `<g class="row" style="animation-delay:${(i * 0.08).toFixed(2)}s">
  <rect x="24" y="${ty - 19}" width="46" height="28" rx="6" fill="${r.col}" fill-opacity=".12" stroke="${r.col}" stroke-opacity=".8" stroke-width="1.2"/>
  <text class="orb" x="47" y="${ty}" text-anchor="middle" font-size="13" font-weight="900" fill="${r.col}">${r.tag}</text>
  <text class="orb" x="84" y="${ty}" font-size="18" font-weight="700" fill="${C.text}">${r.name}</text>
  <rect x="${W - 24 - 62 - lw - 10}" y="${ty - 17}" width="${lw}" height="24" rx="5" fill="${C.bg}" stroke="${r.col}" stroke-opacity=".7" stroke-width="1"/>
  <text class="mono" x="${W - 24 - 62 - 10 - lw / 2}" y="${ty - 1}" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="1.2" fill="${r.col}">${r.lvl}</text>
  <text class="orb pct" x="${W - 24}" y="${ty + 1}" text-anchor="end" font-size="20" font-weight="900" fill="${r.col}" style="animation-delay:${(0.9 + i * 0.13).toFixed(2)}s">${r.pct}%</text>
  ${barSvg(i, BX, cy, BW, BH, fw, (0.15 + i * 0.13).toFixed(2))}
</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skill tree: ${SKILLS.map((r) => `${r.name} ${r.pct}%`).join(", ")}">
<defs><style>${skillsCss(BW)}</style>${skillsDefs(clips)}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
${body}
<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}

/* ═══════════════════════════════ LIVE STATS ═══════════════════════════════ */
function statsCss(CIRC, off) {
  return `
${fontFace}
${fontsCss}
.in{animation:fadeUp .6s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.grow{transform-box:fill-box;transform-origin:0 50%;animation:grow 1.1s cubic-bezier(.2,.85,.2,1) both}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ring{stroke-dasharray:${CIRC};animation:ring 1.6s cubic-bezier(.2,.8,.2,1) .4s both}
@keyframes ring{from{stroke-dashoffset:${CIRC}}to{stroke-dashoffset:${off}}}
.spark{stroke-dasharray:2400;animation:draw 2.4s ease-out .3s both}
@keyframes draw{from{stroke-dashoffset:2400}to{stroke-dashoffset:0}}
.area{animation:fadeIn 1s ease 1.6s both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.big{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.82}}
${reducedMotion("")}`;
}
const statsDefs = () => `
<linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.mag}"/></linearGradient>
<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".55"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>
<linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}"/><stop offset=".6" stop-color="${C.mag}"/><stop offset="1" stop-color="${C.lime}"/></linearGradient>
<filter id="neonLime" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/><feFlood flood-color="${C.lime}" flood-opacity=".7"/><feComposite in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
${filters()}`;
function statsPieces(s, mobile) {
  const ratio = Math.min(1, s.streak.current / Math.max(1, s.streak.longest));
  const R = 62, CIRC = (2 * Math.PI * R).toFixed(1), off = (2 * Math.PI * R * (1 - ratio)).toFixed(1);
  const mostActive = DAYS[s.byWeekday.indexOf(Math.max(...s.byWeekday))];
  const F = mobile ? 1.25 : 1; // mobile text scale
  const tiles = (x0, y0, tw, gapX, th) => [["COMMITS", fmt(s.last12.commits), C.cyan], ["PULL REQUESTS", fmt(s.last12.prs), C.mag], ["STARS EARNED", fmt(s.stars), C.lime], ["PUBLIC REPOS", fmt(s.publicRepos), C.text]]
    .map(([label, val, col], i) => { const x = x0 + (i % 2) * (tw + gapX), y = y0 + Math.floor(i / 2) * (th + 8); return `<g class="in" style="animation-delay:${(0.5 + i * 0.12).toFixed(2)}s"><rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="7" fill="${C.panel}" stroke="${C.line}"/><rect x="${x}" y="${y + 8}" width="3" height="${th - 16}" rx="1.5" fill="${col}"/><text class="mono" x="${x + 14}" y="${y + 16 * F}" font-size="${9 * F}" letter-spacing="1.6" fill="${C.muted}">${label}</text><text class="orb" x="${x + 14}" y="${y + th - 7}" font-size="${17 * F}" font-weight="900" fill="${col}">${val}</text></g>`; }).join("");
  const ring = (cx, cy) => `<g class="in" style="animation-delay:.3s">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.panel}" stroke-width="10"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.line}" stroke-width="1" stroke-dasharray="2 6"/>
  <circle class="ring" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
  <circle class="ring" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" filter="url(#blur4)" opacity=".6"/>
  <path d="M${cx} ${cy - 76} l4 9 l-4 -3 l-4 3 z" fill="${C.lime}"/>
  <text class="orb" x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="40" font-weight="900" fill="${C.cyan}" filter="url(#neonCyan)">${s.streak.current}</text>
  <text class="mono" x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="${9.5 * F}" letter-spacing="2" fill="${C.muted}">DAY STREAK</text>
  <text class="mono" x="${cx}" y="${cy + 90}" text-anchor="middle" font-size="${10.5 * F}" letter-spacing="1" fill="${C.muted}">LONGEST <tspan fill="${C.mag}" font-weight="700">${s.streak.longest}</tspan>${s.streak.longestRange ? `  ·  ${shortDate(s.streak.longestRange[0])} → ${shortDate(s.streak.longestRange[1])}` : ""}</text>
  <text class="mono" x="${cx}" y="${cy + 108}" text-anchor="middle" font-size="${10.5 * F}" letter-spacing="1" fill="${C.muted}">${s.streak.currentStart ? `SINCE ${shortDate(s.streak.currentStart)}` : "NO ACTIVE STREAK"}  ·  SYNC ${s.generatedAt.slice(0, 10)}</text></g>`;
  const langs = (x0, y0, bx, bw, px, rowH) => s.languages.slice(0, 5).map((l, i) => { const y = y0 + i * rowH, w = Math.max(6, Math.round(bw * l.pct / Math.max(1, s.languages[0].pct))); return `<g class="in" style="animation-delay:${(0.4 + i * 0.1).toFixed(2)}s"><text class="orb" x="${x0}" y="${y + 4}" font-size="${12 * F}" font-weight="700" fill="${C.text}">${esc(l.name)}</text><rect x="${bx}" y="${y - 5}" width="${bw}" height="8" rx="4" fill="${C.panel}" stroke="${C.line}"/><g class="grow" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s"><rect x="${bx}" y="${y - 5}" width="${w}" height="8" rx="4" fill="${l.color}"/><rect x="${bx}" y="${y - 5}" width="${w}" height="8" rx="4" fill="${l.color}" filter="url(#blur4)" opacity=".7"/></g><text class="mono" x="${px}" y="${y + 4}" text-anchor="end" font-size="${11 * F}" fill="${C.lime}">${l.pct}%</text></g>`; }).join("");
  const spark = (X0, X1, Y0, Y1) => {
    const pts = s.weeks52, max = Math.max(1, ...pts);
    const px = (i) => (X0 + (i / Math.max(1, pts.length - 1)) * (X1 - X0)).toFixed(1), py = (v) => (Y1 - (v / max) * (Y1 - Y0)).toFixed(1);
    const line = pts.map((v, i) => `${i ? "L" : "M"}${px(i)} ${py(v)}`).join(" "), area = `${line} L${X1} ${Y1} L${X0} ${Y1} Z`;
    let ticks = "", lastM = -1;
    s.weekLabels.forEach((d, i) => { if (!d) return; const m = new Date(d).getUTCMonth(); if (m !== lastM) { lastM = m; if (i > 0 && (!mobile || m % 2 === 0)) ticks += `<line x1="${px(i)}" y1="${Y1}" x2="${px(i)}" y2="${Y1 + 5}" stroke="${C.line}"/><text class="mono" x="${px(i)}" y="${Y1 + 17}" text-anchor="middle" font-size="${9 * F}" fill="${C.muted}">${MONTHS[m]}</text>`; } });
    const dots = pts.map((v, i) => (v === max ? `<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="${C.lime}" filter="url(#blur4)"/><circle cx="${px(i)}" cy="${py(v)}" r="2.5" fill="${C.lime}"/>` : "")).join("");
    return { max, svg: `<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="${C.line}"/>${ticks}<path class="area" d="${area}" fill="url(#areaGrad)"/><path class="spark" d="${line}" fill="none" stroke="url(#sparkGrad)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path class="spark" d="${line}" fill="none" stroke="url(#sparkGrad)" stroke-width="2.2" filter="url(#blur4)" opacity=".7"/><g class="area">${dots}</g>` };
  };
  const big = (x, y) => `<g class="in" style="animation-delay:.1s"><text class="orb big" x="${x}" y="${y}" font-size="56" font-weight="900" fill="${C.lime}" filter="url(#neonLime)">${fmt(s.last12.total)}</text><text class="mono" x="${x + 2}" y="${y + 24}" font-size="${11 * F}" letter-spacing="1" fill="${C.muted}">ALL-TIME <tspan fill="${C.text}">${fmt(s.allTime.total)}</tspan>  ·  SINCE ${monthYear(s.createdAt)}${s.privateIncluded ? "" : "  ·  PUBLIC ONLY"}</text></g>`;
  const active = (x, y, anchor = "start") => `<g class="in" style="animation-delay:1s"><text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${10.5 * F}" letter-spacing="1" fill="${C.muted}">MOST ACTIVE <tspan fill="${C.cyan}">${mostActive.toUpperCase()}</tspan>  ·  LAST PUSH <tspan fill="${C.lime}">${relTime(s.lastPush?.at, Date.parse(s.generatedAt))}</tspan>${s.lastPush ? ` → ${esc(s.lastPush.name)}` : ""}</text></g>`;
  const label = (x, y, txt, anchor = "start") => `<text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${10 * F}" letter-spacing="2" fill="${C.muted}">${txt}</text>`;
  const aria = `GitHub stats: ${fmt(s.last12.total)} contributions in the last 12 months, ${s.streak.current}-day current streak, ${s.streak.longest}-day longest streak, ${s.publicRepos} public repos, ${s.stars} stars, top language ${s.languages[0]?.name}`;
  return { CIRC, off, tiles, ring, langs, spark, big, active, label, aria };
}
function statsPanel(s) {
  const W = 1200, H = 380;
  if (!s) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="stats pending"><defs><style>${fontFace}${fontsCss}</style></defs><rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/><text class="orb" x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="18" font-weight="700" fill="${C.muted}">STATS SYNC PENDING — first workflow run will fill this in</text></svg>`;
  const P = statsPieces(s, false), sp = P.spark(36, 1164, 270, 350);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${P.aria}">
<defs><style>${statsCss(P.CIRC, P.off)}</style>${statsDefs()}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
${corners(14, 14, 1, 1, C.cyan, 18)}${corners(W - 14, 14, -1, 1, C.cyan, 18)}${corners(14, H - 14, 1, -1, C.cyan, 18)}${corners(W - 14, H - 14, -1, -1, C.cyan, 18)}
${P.label(36, 42, "CONTRIBUTIONS · LAST 12 MONTHS")}${P.label(780, 42, "TOP LANGUAGES · BY CODE SIZE")}${P.label(36, 262, "ACTIVITY · 52 WEEKS")}
<text class="mono" x="1164" y="262" text-anchor="end" font-size="10" letter-spacing="2" fill="${C.muted}">PEAK <tspan fill="${C.lime}">${sp.max}</tspan> / WEEK</text>
${P.big(34, 104)}
${P.tiles(36, 150, 168, 12, 42)}
${P.ring(560, 122)}
${P.langs(780, 62, 880, 220, 1164, 30)}
${P.active(780, 224)}
${sp.svg}
<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}
function statsMobile(s) {
  const W = 640, H = 900;
  if (!s) return statsPanel(null);
  const P = statsPieces(s, true), sp = P.spark(24, 616, 760, 840);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${P.aria}">
<defs><style>${statsCss(P.CIRC, P.off)}</style>${statsDefs()}</defs>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
${corners(14, 14, 1, 1, C.cyan, 18)}${corners(W - 14, 14, -1, 1, C.cyan, 18)}${corners(14, H - 14, 1, -1, C.cyan, 18)}${corners(W - 14, H - 14, -1, -1, C.cyan, 18)}
${P.label(24, 44, "CONTRIBUTIONS · LAST 12 MONTHS")}
${P.big(22, 106)}
${P.tiles(24, 154, 288, 16, 50)}
${P.ring(320, 350)}
${P.label(24, 500, "TOP LANGUAGES · BY CODE SIZE")}
${P.langs(24, 530, 200, 340, 616, 34)}
${P.active(24, 706)}
${P.label(24, 748, "ACTIVITY · 52 WEEKS")}
<text class="mono" x="616" y="748" text-anchor="end" font-size="12.5" letter-spacing="2" fill="${C.muted}">PEAK <tspan fill="${C.lime}">${sp.max}</tspan> / WEEK</text>
${sp.svg}
<rect width="${W}" height="${H}" rx="12" fill="url(#scan)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${C.line}"/>
</svg>`;
}

/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */
function footerBase(t, W, H, HZ, VP, N, CYCLE, body) {
  let v = "";
  for (let xe = -1400; xe <= W + 1400; xe += 110) v += `<line x1="${VP}" y1="${HZ}" x2="${xe}" y2="${H}"/>`;
  let h = "";
  for (let i = 0; i < N; i++) h += `<line class="h" x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" style="animation-delay:${(-(i / N) * CYCLE).toFixed(3)}s"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wake up, Samurai. We have code to ship. — end of transmission">
<defs><style>
${fontFace}
${fontsCss}
.h{stroke:${t.mag};stroke-width:1.1;animation:hmove ${CYCLE}s cubic-bezier(.45,0,1,.55) infinite}
@keyframes hmove{0%{transform:translateY(0);opacity:0}8%{opacity:.8}100%{transform:translateY(${H - HZ}px);opacity:.05}}
.cur{animation:blink 1.1s steps(1,end) infinite}
@keyframes blink{0%,55%{opacity:1}56%,100%{opacity:0}}
.q{animation:fadeIn 1.2s ease .3s both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
${reducedMotion(".h{opacity:.3}")}
</style>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg2}" stop-opacity="0"/><stop offset="1" stop-color="${t.bg2}" stop-opacity=".97"/></linearGradient>
<linearGradient id="hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.cyan}" stop-opacity="0"/><stop offset=".3" stop-color="${t.cyan}"/><stop offset=".7" stop-color="${t.mag}"/><stop offset="1" stop-color="${t.mag}" stop-opacity="0"/></linearGradient>
<clipPath id="below"><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}"/></clipPath>
${filters(t.cyan, t.mag)}
</defs>
<rect width="${W}" height="${H}" fill="${t.bg2}"/>
<line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="url(#hz)" stroke-width="2" filter="url(#lineGlow)"/>
<g clip-path="url(#below)"><g stroke="${t.grid}" stroke-width="1" opacity="${(t.gridOp * .75).toFixed(2)}">${v}</g><g>${h}</g><rect x="0" y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#fade)"/></g>
${body}
<rect width="${W}" height="${H}" fill="url(#scan)" opacity="${(t.scanOp / .05).toFixed(2)}"/>
</svg>`;
}
function footer(t) {
  const W = 1200, H = 200;
  return footerBase(t, W, H, 44, 600, 6, 3.2, `
<g class="q"><text class="serif" x="600" y="92" text-anchor="middle" font-size="19" font-style="italic" fill="${t.ink}">“Wake up, Samurai. We have code to ship.”</text><text class="mono" x="600" y="112" text-anchor="middle" font-size="10" letter-spacing="2" fill="${t.lime}">— KHANH020905</text></g>
<rect x="430" y="130" width="340" height="40" rx="6" fill="${t.bg2}" fill-opacity=".85" stroke="${t.line}"/>
<g class="orb" font-size="15" font-weight="700" letter-spacing="3"><text x="600" y="156" text-anchor="middle" fill="${t.cyan}" filter="url(#neonCyan)">&gt; END OF TRANSMISSION</text><rect class="cur" x="741" y="142" width="9" height="17" fill="${t.mag}"/></g>
<text class="mono" x="600" y="190" text-anchor="middle" font-size="10" letter-spacing="2" fill="${t.muted}">© ${new Date().getUTCFullYear()} KHANH020905  ·  CRAFTED WITH NEON &amp; CAFFEINE  ·  SEE YOU IN THE GRID</text>`);
}
function footerMobile(t) {
  const W = 640, H = 300;
  return footerBase(t, W, H, 40, 320, 5, 3.2, `
<g class="q"><text class="serif" x="320" y="96" text-anchor="middle" font-size="21" font-style="italic" fill="${t.ink}">“Wake up, Samurai.</text><text class="serif" x="320" y="124" text-anchor="middle" font-size="21" font-style="italic" fill="${t.ink}">We have code to ship.”</text><text class="mono" x="320" y="150" text-anchor="middle" font-size="12" letter-spacing="2" fill="${t.lime}">— KHANH020905</text></g>
<rect x="150" y="172" width="340" height="44" rx="6" fill="${t.bg2}" fill-opacity=".85" stroke="${t.line}"/>
<g class="orb" font-size="16" font-weight="700" letter-spacing="3"><text x="320" y="201" text-anchor="middle" fill="${t.cyan}" filter="url(#neonCyan)">&gt; END OF TRANSMISSION</text><rect class="cur" x="470" y="186" width="9" height="18" fill="${t.mag}"/></g>
<text class="mono" x="320" y="250" text-anchor="middle" font-size="11.5" letter-spacing="2" fill="${t.muted}">© ${new Date().getUTCFullYear()} KHANH020905 · CRAFTED WITH NEON &amp; CAFFEINE</text>
<text class="mono" x="320" y="272" text-anchor="middle" font-size="11.5" letter-spacing="2" fill="${t.muted}">SEE YOU IN THE GRID</text>`);
}

/* ═══════════════════════════════ BUILD CARDS ═══════════════════════════════ */
function buildCard(b) {
  const W = 400, H = 300, IX = 16, IY = 16, IW = 368, IH = 222;
  const shotPath = join(ROOT, "data", "shots", `${b.slug}.jpg`);
  const shot = existsSync(shotPath) ? readFileSync(shotPath).toString("base64") : null;
  const host = new URL(b.url).host;
  let tagX = W - 18, chips = "";
  for (const tag of [...b.tags].reverse()) {
    const w = Math.round(tag.length * 6.6 + 16); tagX -= w;
    chips += `<rect x="${tagX}" y="253" width="${w}" height="19" rx="4" fill="${C.panel}" stroke="${C.line}"/><text class="mono" x="${tagX + w / 2}" y="266.5" text-anchor="middle" font-size="10" letter-spacing=".5" fill="${C.cyan}">${esc(tag)}</text>`;
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
.in{animation:fadeIn .8s ease .1s both}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
${reducedMotion(".edge{stroke-dasharray:none}")}
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
<g><rect x="26" y="26" width="52" height="20" rx="10" fill="${C.bg}" fill-opacity=".85" stroke="${C.lime}" stroke-opacity=".8"/><circle cx="38" cy="36" r="3" fill="${C.lime}"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle><text class="mono" x="47" y="40" font-size="9.5" font-weight="700" letter-spacing="1.5" fill="${C.lime}">LIVE</text></g>
<text class="orb" x="18" y="268" font-size="17" font-weight="700" fill="${C.text}">${esc(b.name)}</text>
${chips}
<text class="mono" x="18" y="288" font-size="11" letter-spacing=".4" fill="${C.muted}">${esc(host)} ↗</text>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="${C.line}"/>
<rect class="edge" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="url(#edgeGrad)" stroke-width="2.5" stroke-linecap="round"/>
<rect class="edge" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="url(#edgeGrad)" stroke-width="2.5" filter="url(#blur3)" opacity=".7"/>
</svg>`;
}

/* ═══════════════════════════════ WRITE ═══════════════════════════════ */
const files = {
  "header.svg": header(THEMES.dark, "dark"),
  "header-light.svg": header(THEMES.light, "light"),
  "header-mobile.svg": headerMobile(THEMES.dark),
  "typing.svg": typing(false),
  "typing-mobile.svg": typing(true),
  "divider.svg": divider(),
  "idcard.svg": idCard(stats, false),
  "idcard-mobile.svg": idCard(stats, true),
  "stack.svg": stackBoard(),
  "stack-mobile.svg": stackBoardMobile(),
  "skills.svg": skills(),
  "skills-mobile.svg": skillsMobile(),
  "stats.svg": statsPanel(stats),
  "stats-mobile.svg": statsMobile(stats),
  "footer.svg": footer(THEMES.dark),
  "footer-light.svg": footer(THEMES.light),
  "footer-mobile.svg": footerMobile(THEMES.dark),
};
for (const b of builds) files[`builds/${b.slug}.svg`] = buildCard(b);
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, name), svg);
  console.log(name.padEnd(26), (svg.length / 1024).toFixed(1).padStart(6) + " KB");
}
