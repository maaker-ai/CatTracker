const { chromium } = require("@playwright/test");
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// 6.7" iPhone: 1290 x 2796
const W = 1290;
const H = 2796;
const PORT = 3099;

const ALL_LOCALES = [
  "en", "zh-Hans", "zh-Hant", "ja", "ko", "de", "fr", "es", "ru", "it", "ar", "id",
];

const slides = [
  { id: 1, name: "01-dashboard" },
  { id: 2, name: "02-log" },
  { id: 3, name: "03-timeline" },
  { id: 4, name: "04-profile" },
  { id: 5, name: "05-settings" },
];

function waitForServer(port, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(`http://localhost:${port}/export?slide=1&lang=en`, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    }
    function retry() {
      if (Date.now() - start > timeoutMs) return reject(new Error(`Server not ready after ${timeoutMs}ms`));
      setTimeout(check, 500);
    }
    check();
  });
}

async function main() {
  const arg = process.argv[2];
  const locales = arg ? arg.split(",").map((s) => s.trim()) : ALL_LOCALES;

  for (const loc of locales) {
    if (!ALL_LOCALES.includes(loc)) {
      console.error(`Unknown locale: ${loc}`);
      process.exit(1);
    }
  }

  const storeDir = __dirname;
  const projectRoot = path.resolve(storeDir, "..");
  const baseOutputDir = path.join(projectRoot, "app-store", "screenshots");

  // Build & start production server
  console.log("Building screenshots-store (production)...");
  execSync("npx next build", { cwd: storeDir, stdio: "inherit" });

  console.log(`Starting production server on port ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: storeDir,
    stdio: "ignore",
    detached: true,
  });

  let browser;
  try {
    await waitForServer(PORT);
    console.log("Server ready.\n");

    const totalSlides = locales.length * slides.length;
    let completed = 0;

    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--single-process",
        "--no-sandbox",
        "--js-flags=--max-old-space-size=256",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const locale of locales) {
      const outputDir = path.join(baseOutputDir, locale, "iphone-67");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      console.log(`=== Locale: ${locale} (${locales.indexOf(locale) + 1}/${locales.length}) ===`);

      for (const slide of slides) {
        completed++;

        await page.goto(
          `http://localhost:${PORT}/export?slide=${slide.id}&lang=${locale}`,
          { waitUntil: "networkidle" }
        );
        await page.waitForTimeout(800);

        const outputPath = path.join(outputDir, `${slide.name}-${W}x${H}.png`);
        await page.screenshot({
          path: outputPath,
          clip: { x: 0, y: 0, width: W, height: H },
        });

        console.log(`  [${completed}/${totalSlides}] ${slide.name}`);
      }
    }

    console.log(`\nDone! ${totalSlides} screenshots exported to ${baseOutputDir}`);
  } finally {
    if (browser) await browser.close();
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
