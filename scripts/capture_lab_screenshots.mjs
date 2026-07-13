/**
 * Capture real lab screenshots (no PII — synthetic seed only).
 * Usage (from repo root, with web running on :3000 OR use startServer):
 *   node scripts/capture_lab_screenshots.mjs
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const { chromium } = require("playwright");
const OUT = path.join(ROOT, "assets", "screenshots");
const BASE = process.env.DEMO_URL || "http://127.0.0.1:3000";

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let child = null;
  const shouldStart = process.env.START_WEB !== "0";
  if (shouldStart) {
    child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev", "--", "-p", "3000"],
      {
        cwd: path.join(ROOT, "apps", "web"),
        stdio: "ignore",
        shell: true,
      }
    );
  }

  try {
    await waitForServer(BASE);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForSelector("h1.brand", { timeout: 60000 });
    // Auto-run on mount; wait for analysis panels or click the CTA if still idle.
    const cta = page.locator("button").filter({ hasText: /demo|Analisando|Reexecutar|Carregar/i }).first();
    if (await cta.count()) {
      try {
        await cta.click({ timeout: 5000 });
      } catch {
        // already running / already analyzed
      }
    }
    await page.waitForSelector("#inbox strong", { timeout: 60000 });
    await page.waitForTimeout(1200);

    const shots = [
      ["01-support-intelligence-cockpit.png", null],
      ["02-topic-classifier.png", "#topics"],
      ["03-sla-dashboard.png", "#sla"],
      ["04-refund-risk-board.png", "#refund-risk"],
      ["05-root-cause-explorer.png", "#root-cause"],
      ["06-weekly-support-memo.png", "#memo"],
      ["07-action-backlog.png", "#actions"],
      ["08-claims-honesty.png", "#claims"],
    ];

    // Full cockpit first
    await page.screenshot({
      path: path.join(OUT, shots[0][0]),
      fullPage: true,
    });

    for (const [name, sel] of shots.slice(1)) {
      if (sel) {
        const el = page.locator(sel);
        await el.scrollIntoViewIfNeeded();
        await el.screenshot({ path: path.join(OUT, name) });
      }
    }

    // Manifest for portfolio handoff
    const manifest = {
      captured_at: new Date().toISOString(),
      base_url: BASE,
      note: "Synthetic seed only — no real customer PII.",
      files: shots.map(([f]) => `assets/screenshots/${f}`),
    };
    await writeFile(
      path.join(OUT, "CAPTURE_MANIFEST.json"),
      JSON.stringify(manifest, null, 2)
    );
    await browser.close();
    console.log("screenshots written to", OUT);
  } finally {
    if (child) child.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
