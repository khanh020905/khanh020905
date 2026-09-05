// Screenshots every live site in data/builds.json into data/shots/<slug>.jpg (640×400).
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: "light", locale: "vi-VN" });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await page.goto(b.url, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3500); // let intro animations settle
    const buf = await page.screenshot({ type: "jpeg", quality: 74, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    writeFileSync(join(outDir, `${b.slug}.jpg`), buf);
    meta[b.slug] = { ok: true, at: new Date().toISOString(), bytes: buf.length, ms: Date.now() - t0 };
    console.log(`ok   ${b.slug.padEnd(16)} ${(buf.length / 1024).toFixed(0)} KB  ${Date.now() - t0} ms`);
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
