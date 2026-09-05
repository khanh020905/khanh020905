// Screenshots every live site in data/builds.json into data/shots/<slug>.jpg (settled hero, 576×360)
// plus four flipbook frames <slug>-a/-b/-c/-d.jpg (intro 0.5s/1.5s/3s + one scrolled section).
// A failed shot keeps the previous file. Playwright is installed by the workflow (not committed).
// Local dev: PW_MODULE=/path/to/node_modules/playwright PW_EXE=/path/to/chromium node scripts/screenshot.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ROOT } from "./lib/theme.mjs";

const require = createRequire(import.meta.url);
const pw = process.env.PW_MODULE ? require(process.env.PW_MODULE) : require("playwright");

const builds = JSON.parse(readFileSync(join(ROOT, "data", "builds.json"), "utf8"));
const only = process.argv.slice(2);
const outDir = join(ROOT, "data", "shots");
mkdirSync(outDir, { recursive: true });
const metaPath = join(outDir, "meta.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};

const browser = await pw.chromium.launch({ executablePath: process.env.PW_EXE || undefined });
let failed = 0;
for (const b of builds) {
  if (only.length && !only.includes(b.slug)) continue;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.45, colorScheme: "light", locale: "vi-VN" });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const snap = () => page.screenshot({ type: "jpeg", quality: 64, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  try {
    await page.goto(b.url, { waitUntil: "load", timeout: 45000 });
    // flipbook frames: intro at 0.5s / 1.5s / 3s, settled hero (~4.5s, the static base), then one scrolled section
    await page.waitForTimeout(500);  const fa = await snap();
    await page.waitForTimeout(1000); const fb = await snap();
    await page.waitForTimeout(1500); const fc = await snap();
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500); const hero = await snap();
    await page.mouse.wheel(0, 720);  await page.waitForTimeout(1600); const fd = await snap();
    const files = { "": hero, "-a": fa, "-b": fb, "-c": fc, "-d": fd };
    let bytes = 0;
    for (const [suffix, buf] of Object.entries(files)) { writeFileSync(join(outDir, `${b.slug}${suffix}.jpg`), buf); bytes += buf.length; }
    meta[b.slug] = { ok: true, at: new Date().toISOString(), frames: Object.keys(files).length, bytes, ms: Date.now() - t0 };
    console.log(`ok   ${b.slug.padEnd(16)} ${Object.keys(files).length} frames ${(bytes / 1024).toFixed(0)} KB  ${Date.now() - t0} ms`);
  } catch (e) {
    failed++;
    meta[b.slug] = { ...(meta[b.slug] || {}), ok: false, error: String(e.message).slice(0, 160), failedAt: new Date().toISOString() };
    console.error(`FAIL ${b.slug.padEnd(16)} ${String(e.message).slice(0, 120)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();
writeFileSync(metaPath, JSON.stringify(meta, null, 2));
process.exit(failed ? 1 : 0);
