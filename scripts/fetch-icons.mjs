// One-off: downloads the skillicons.dev SVGs used by the circuit board into data/icons/.
// They are static, so they are committed; re-run only when the icon list in render.mjs changes.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/theme.mjs";

// gsap + framer do not exist on skillicons (the API answers "undefined") — render.mjs draws them inline.
export const ICONS = ["ts", "js", "react", "nextjs", "tailwind", "html", "css", "threejs",
  "nodejs", "java", "supabase", "postgres", "cloudflare", "docker", "git", "github", "figma", "vscode", "vercel", "arduino"];

const dir = join(ROOT, "data", "icons");
mkdirSync(dir, { recursive: true });
let bad = 0;
for (const name of ICONS) {
  const res = await fetch(`https://skillicons.dev/icons?i=${name}&theme=dark`);
  const svg = (await res.text()).trim();
  if (!res.ok || !svg.startsWith("<svg") || svg.includes("undefined")) { bad++; console.error(`FAIL ${name}: ${res.status}`); continue; }
  writeFileSync(join(dir, `${name}.svg`), svg);
  console.log(`ok   ${name.padEnd(10)} ${(svg.length / 1024).toFixed(1)} KB`);
}
process.exit(bad ? 1 : 0);
