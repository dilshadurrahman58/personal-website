// Prints the CV page (cv/index.html) to cv/dilshadur-cv.pdf, so the
// downloadable PDF always matches the website. The page's print styles
// (the @media print block in cv/styles.css) are the PDF's design.
//
//   cd cv/tools && npm ci && npm run build
//
// Chrome is found automatically on macOS and on GitHub's Ubuntu runners;
// set CHROME_PATH to use another one.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "../..");
const output = process.env.CV_PDF_OUT ? path.resolve(process.env.CV_PDF_OUT) : path.resolve(here, "../dilshadur-cv.pdf");

const findChrome = () => {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error("Chrome not found; set CHROME_PATH");
  return found;
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
};

// a small static server, so the page can fetch its data.json as it does online
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(siteRoot, rel);
  if (!file.startsWith(siteRoot) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/cv/?pdf`;
const scratch = mkdtempSync(path.join(os.tmpdir(), "cv-pdf-"));
const rawPdf = path.join(scratch, "cv.pdf");

// Chrome runs asynchronously: the server above lives in this same process
try {
  await promisify(execFile)(
    findChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
      "--no-pdf-header-footer",
      "--generate-pdf-document-outline",
      `--user-data-dir=${path.join(scratch, "profile")}`,
      // time for the web fonts and the publication list to arrive
      "--virtual-time-budget=15000",
      `--print-to-pdf=${rawPdf}`,
      url,
    ],
    { timeout: 120000, maxBuffer: 16 * 1024 * 1024 },
  );
} finally {
  server.close();
}

// sanity checks: the publication list and the web fonts made it in
const pdf = await PDFDocument.load(readFileSync(rawPdf), { updateMetadata: false });
const raw = readFileSync(rawPdf, "latin1");
if (!/Lora/.test(raw) || !/Inter/.test(raw)) {
  throw new Error("The PDF is missing Lora or Inter; the fonts did not load in time");
}
if (pdf.getPageCount() < 3) {
  throw new Error(`Only ${pdf.getPageCount()} pages; the publication list probably did not load`);
}

pdf.setTitle("Md Dilshadur Rahman, Curriculum Vitae", { showInWindowTitleBar: true });
pdf.setAuthor("Md Dilshadur Rahman");
pdf.setSubject("Curriculum vitae of Md Dilshadur Rahman, postdoctoral researcher in visualization and human-computer interaction");
pdf.setKeywords(["visualization", "human-computer interaction", "annotation", "curriculum vitae"]);
pdf.setCreator("dilshadur.com/cv");
pdf.setProducer("dilshadur.com/cv");
pdf.setLanguage("en-US");
const now = new Date();
pdf.setCreationDate(now);
pdf.setModificationDate(now);

writeFileSync(output, await pdf.save());
rmSync(scratch, { recursive: true, force: true });
console.log(`Wrote ${path.relative(siteRoot, output)}: ${pdf.getPageCount()} pages`);
