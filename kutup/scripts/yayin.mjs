// Usage (in kutup/): npm run yayin  ·  rehearsal without deploy: npm run yayin -- --kuru
// Batur's one-step release after merging a PR on GitHub: pull, install, test, back up
// the live data, deploy, run the live smoke test, then print one line to paste to the
// second base. Stops at the first failing step and says whether anything went live.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--kuru");

function stop(reason) {
  console.error(`\n✖ Durdu: ${reason}\nBu pencerenin çıktısını ikinci üsteki Claude'a yapıştır.`);
  process.exit(1);
}

function run(label, command, { capture = false, fail = "hiçbir şey yayınlanmadı." } = {}) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });
  const out = capture ? `${res.stdout || ""}${res.stderr || ""}` : "";
  if (capture) process.stdout.write(out);
  if (res.status !== 0) stop(`${label} başarısız; ${fail}`);
  return out;
}

const git = (args) => spawnSync(`git ${args}`, { cwd: root, shell: true, encoding: "utf8" }).stdout.trim();

const branch = git("rev-parse --abbrev-ref HEAD");
if (branch !== "kutup-platform") stop(`dal "${branch}"; kutup-platform olmalı. Hiçbir şey yayınlanmadı.`);
if (git("status --porcelain")) stop("yerelde commit'lenmemiş değişiklik var (git status). Hiçbir şey yayınlanmadı.");

const before = git("rev-parse --short HEAD");
run("Birleşen PR'lar çekiliyor", "git pull --ff-only origin kutup-platform");
const after = git("rev-parse --short HEAD");
if (!dry) run("Paketler kuruluyor", "npm ci", { fail: "önizleme açıksa kapatıp tekrar dene. Hiçbir şey yayınlanmadı." });
run("Testler", "npm run test:all");

if (dry) {
  console.log(`\n✔ Prova tamam: ${before} → ${after}, testler geçti. Yayın yapılmadı.`);
  process.exit(0);
}

run("Canlı yedek", `node scripts/owner-backup.mjs yayin-${after}`);
const deploy = run("Yayın", "npm run deploy", { capture: true, fail: "canlı sürüm değişmedi." });
const version = deploy.match(/Current Version ID:\s*([0-9a-f-]+)/i)?.[1]?.slice(0, 8) || "?";
const smoke = run("Canlı duman testi", "node tests/live-smoke.mjs", {
  capture: true,
  fail: `yayın yapıldı (Worker ${version}) ama duman testi çalışmadı.`,
});
const push = smoke.split(/\r?\n/).find((line) => /push: members/.test(line))?.trim() || "";
if (!/ALL PASSED/.test(smoke)) {
  stop(`yayın yapıldı (Worker ${version}) ama canlı duman testinde hata var. Site bozuksa ve PR'da göç yoksa: npx wrangler rollback`);
}
console.log(`\n✔ Yayın tamam. İkinci üsse bunu yapıştır:\n\nYayın tamam · ${before} → ${after} · Worker ${version} · canlı duman testi geçti · ${push}`);
