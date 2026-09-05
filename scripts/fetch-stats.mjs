// Pulls live numbers from the GitHub GraphQL API into data/stats.json.
// Token: PROFILE_TOKEN (PAT — sees private contributions) → GITHUB_TOKEN → `gh auth token`.
// Exits non-zero on failure so the workflow keeps the previous data/stats.json.
import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib/theme.mjs";

const LOGIN = process.env.PROFILE_LOGIN || "khanh020905";
let token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
if (!token) { try { token = execSync("gh auth token", { encoding: "utf8" }).trim(); } catch { /* none */ } }
if (!token) { console.error("No token: set PROFILE_TOKEN or GITHUB_TOKEN"); process.exit(1); }

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-assets" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL ${res.status}: ${JSON.stringify(json.errors || json).slice(0, 400)}`);
  return json.data;
}

const Q_USER = `query($login:String!){ user(login:$login){ createdAt followers{totalCount} avatarUrl(size:256) name } }`;

const Q_REPOS = `query($login:String!,$after:String){
  user(login:$login){ repositories(first:100, after:$after, ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false, orderBy:{field:PUSHED_AT,direction:DESC}){
    totalCount pageInfo{hasNextPage endCursor}
    nodes{ name stargazerCount pushedAt primaryLanguage{name color} languages(first:6, orderBy:{field:SIZE,direction:DESC}){ edges{ size node{name color} } } }
  } } }`;

const Q_CONTRIB = `query($login:String!,$from:DateTime,$to:DateTime){
  user(login:$login){ contributionsCollection(from:$from,to:$to){
    totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions restrictedContributionsCount
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } }
  } } }`;

const user = (await gql(Q_USER, { login: LOGIN })).user;
const createdAt = new Date(user.createdAt);

// ── repositories (paginated) ─────────────────────────────────────────────
const repos = [];
let after = null;
do {
  const d = (await gql(Q_REPOS, { login: LOGIN, after })).user.repositories;
  repos.push(...d.nodes);
  after = d.pageInfo.hasNextPage ? d.pageInfo.endCursor : null;
} while (after);

const stars = repos.reduce((s, r) => s + r.stargazerCount, 0);
const langBytes = new Map();
for (const r of repos) for (const e of r.languages.edges) {
  const cur = langBytes.get(e.node.name) || { bytes: 0, color: e.node.color, repos: 0 };
  cur.bytes += e.size; cur.repos += 1; langBytes.set(e.node.name, cur);
}
const totalBytes = [...langBytes.values()].reduce((s, l) => s + l.bytes, 0) || 1;
const languages = [...langBytes.entries()]
  .map(([name, l]) => ({ name, color: l.color || "#94A3B8", pct: Math.round((l.bytes / totalBytes) * 1000) / 10, repos: l.repos }))
  .sort((a, b) => b.pct - a.pct).slice(0, 6);
const pushed = repos.find((r) => r.name.toLowerCase() !== LOGIN.toLowerCase());
const lastPush = pushed ? { name: pushed.name, at: pushed.pushedAt } : null;

// ── contributions: "last 12 months" (GitHub's default window) + every year since signup ──
const last12 = (await gql(Q_CONTRIB, { login: LOGIN })).user.contributionsCollection;
const days = new Map();
const yearly = [];
const now = new Date();
for (let y = createdAt.getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
  const from = new Date(Date.UTC(y, 0, 1)).toISOString();
  const to = new Date(Math.min(Date.UTC(y, 11, 31, 23, 59, 59), now.getTime())).toISOString();
  const c = (await gql(Q_CONTRIB, { login: LOGIN, from, to })).user.contributionsCollection;
  yearly.push({ year: y, total: c.contributionCalendar.totalContributions, commits: c.totalCommitContributions + c.restrictedContributionsCount, prs: c.totalPullRequestContributions, issues: c.totalIssueContributions, reviews: c.totalPullRequestReviewContributions });
  for (const w of c.contributionCalendar.weeks) for (const d of w.contributionDays) days.set(d.date, { count: d.contributionCount, weekday: d.weekday });
}
const dayList = [...days.entries()].map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date));

// streaks (a 0-contribution "today" doesn't break the current streak yet)
const todayKey = now.toISOString().slice(0, 10);
let longest = 0, run = 0, longestRange = null, runStart = null;
for (const d of dayList) {
  if (d.count > 0) { if (run === 0) runStart = d.date; run++; if (run > longest) { longest = run; longestRange = [runStart, d.date]; } }
  else if (d.date !== todayKey) run = 0;
}
let current = 0, currentStart = null;
for (let i = dayList.length - 1; i >= 0; i--) {
  const d = dayList[i];
  if (d.count > 0) { current++; currentStart = d.date; }
  else if (d.date === todayKey) continue;
  else break;
}

// activity by weekday + last 52 weeks (weekly sums for the sparkline)
const byWeekday = [0, 0, 0, 0, 0, 0, 0];
for (const d of dayList) byWeekday[d.weekday] += d.count;
const recent = dayList.slice(-364);
const weeks52 = [];
for (let i = 0; i < recent.length; i += 7) weeks52.push(recent.slice(i, i + 7).reduce((s, d) => s + d.count, 0));
const weekLabels = [];
for (let i = 0; i < recent.length; i += 7) weekLabels.push(recent[i]?.date);

const stats = {
  generatedAt: now.toISOString(),
  login: LOGIN,
  createdAt: user.createdAt,
  followers: user.followers.totalCount,
  name: user.name,
  publicRepos: repos.length,
  stars,
  lastPush,
  languages,
  last12: {
    total: last12.contributionCalendar.totalContributions,
    commits: last12.totalCommitContributions + last12.restrictedContributionsCount,
    prs: last12.totalPullRequestContributions,
    issues: last12.totalIssueContributions,
    reviews: last12.totalPullRequestReviewContributions,
  },
  allTime: {
    total: yearly.reduce((s, y) => s + y.total, 0),
    commits: yearly.reduce((s, y) => s + y.commits, 0),
    prs: yearly.reduce((s, y) => s + y.prs, 0),
    issues: yearly.reduce((s, y) => s + y.issues, 0),
  },
  streak: { current, currentStart, longest, longestRange },
  byWeekday,
  weeks52, weekLabels,
  privateIncluded: Boolean(process.env.PROFILE_TOKEN) || last12.restrictedContributionsCount > 0,
};

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(join(ROOT, "data", "stats.json"), JSON.stringify(stats, null, 2));

// avatar for the ID card (kept in the repo so render.mjs never needs the network)
try {
  const a = await fetch(user.avatarUrl, { headers: { "User-Agent": "profile-assets" } });
  if (a.ok) {
    const buf = Buffer.from(await a.arrayBuffer());
    const ext = buf[0] === 0xff ? "jpg" : "png"; // GitHub serves JPEG for most avatars regardless of URL
    for (const old of ["avatar.jpg", "avatar.png"]) { try { unlinkSync(join(ROOT, "data", old)); } catch {} }
    writeFileSync(join(ROOT, "data", `avatar.${ext}`), buf); console.log(`avatar.${ext} updated (${buf.length} B)`);
  }
} catch (e) { console.warn("avatar fetch failed:", e.message); }
console.log(`stats.json: ${stats.last12.total} contributions/12mo · streak ${current}d (longest ${longest}) · ${repos.length} repos · ${stars}★ · top ${languages[0]?.name}`);
