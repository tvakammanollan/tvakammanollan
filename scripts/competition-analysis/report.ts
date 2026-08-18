import { writeFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer";
import type { AnalysisResult, CompetitorAnalysis } from "./types.ts";

function stars(score: number): string {
  return "●".repeat(score) + "○".repeat(5 - score);
}

function scoreColor(score: number): string {
  if (score >= 4) return "#16a34a";
  if (score >= 3) return "#ca8a04";
  return "#dc2626";
}

function dimensionRow(label: string, dim: CompetitorAnalysis["seo"]): string {
  return `
    <div class="dim-row">
      <div class="dim-label">${label}</div>
      <div class="dim-score" style="color:${scoreColor(dim.score)}">${stars(dim.score)}</div>
      <div class="dim-notes">${dim.notes}</div>
    </div>`;
}

function competitorCard(c: CompetitorAnalysis): string {
  return `
    <div class="competitor-card">
      <div class="card-header">
        <div>
          <h3 class="card-name">${c.name}</h3>
          <a class="card-url" href="${c.url}">${c.url}</a>
        </div>
        <div class="overall-score" style="background:${scoreColor(c.overallScore)}">
          ${c.overallScore.toFixed(1)}
        </div>
      </div>
      <p class="card-desc">${c.description}</p>
      <div class="dimensions">
        ${dimensionRow("SEO & Synlighet", c.seo)}
        ${dimensionRow("Features & Innehåll", c.features)}
        ${dimensionRow("UX & Design", c.ux)}
        ${dimensionRow("Prissättning", c.pricing)}
      </div>
      <div class="card-sw">
        <div class="strengths">
          <strong>Styrkor</strong>
          <ul>${c.seo.strengths.concat(c.features.strengths).slice(0, 3).map((s) => `<li>${s}</li>`).join("")}</ul>
        </div>
        <div class="weaknesses">
          <strong>Svagheter</strong>
          <ul>${c.seo.weaknesses.concat(c.features.weaknesses).slice(0, 3).map((w) => `<li>${w}</li>`).join("")}</ul>
        </div>
      </div>
    </div>`;
}

function matrixTable(competitors: CompetitorAnalysis[]): string {
  const rows = competitors
    .sort((a, b) => b.overallScore - a.overallScore)
    .map(
      (c) => `
      <tr>
        <td class="mat-name"><a href="${c.url}">${c.name}</a></td>
        <td style="color:${scoreColor(c.seo.score)}">${stars(c.seo.score)}</td>
        <td style="color:${scoreColor(c.features.score)}">${stars(c.features.score)}</td>
        <td style="color:${scoreColor(c.ux.score)}">${stars(c.ux.score)}</td>
        <td style="color:${scoreColor(c.pricing.score)}">${stars(c.pricing.score)}</td>
        <td class="mat-total" style="color:${scoreColor(c.overallScore)}">${c.overallScore.toFixed(1)}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="matrix">
      <thead>
        <tr>
          <th>Konkurrent</th>
          <th>SEO</th>
          <th>Features</th>
          <th>UX</th>
          <th>Pris</th>
          <th>Totalt</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildHtml(data: AnalysisResult): string {
  const date = new Date(data.generatedAt).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a1a2e; background: #fff; }

  /* Cover */
  .cover {
    min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
    align-items: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
    color: white; text-align: center; padding: 60px 40px;
    page-break-after: always;
  }
  .cover-logo { font-size: 48px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .cover-logo span { color: #e94560; }
  .cover-title { font-size: 28px; font-weight: 300; margin-bottom: 40px; opacity: 0.9; }
  .cover-meta { font-size: 14px; opacity: 0.6; }
  .cover-badge {
    display: inline-block; background: rgba(233,69,96,0.2); border: 1px solid rgba(233,69,96,0.4);
    color: #e94560; padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-bottom: 32px;
  }

  /* Content */
  .page { padding: 48px 52px; max-width: 860px; margin: 0 auto; }
  .section { margin-bottom: 48px; }
  h2 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px;
       padding-bottom: 10px; border-bottom: 2px solid #e94560; }
  h3 { font-size: 17px; font-weight: 600; margin-bottom: 12px; color: #1a1a2e; }

  /* Summary box */
  .summary-box {
    background: #f8f9ff; border-left: 4px solid #e94560;
    padding: 20px 24px; border-radius: 0 8px 8px 0; font-size: 15px; line-height: 1.7;
  }

  /* Matrix */
  .matrix { width: 100%; border-collapse: collapse; font-size: 13px; }
  .matrix thead tr { background: #1a1a2e; color: white; }
  .matrix th { padding: 10px 12px; text-align: left; font-weight: 600; }
  .matrix td { padding: 10px 12px; border-bottom: 1px solid #eef0f4; }
  .matrix tbody tr:hover { background: #f8f9ff; }
  .mat-name a { color: #1a1a2e; text-decoration: none; font-weight: 500; }
  .mat-total { font-weight: 700; font-size: 14px; }

  /* Competitor cards */
  .competitor-card {
    border: 1px solid #e8eaf0; border-radius: 12px; padding: 24px;
    margin-bottom: 24px; page-break-inside: avoid;
  }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .card-name { font-size: 18px; font-weight: 700; }
  .card-url { font-size: 12px; color: #6b7280; text-decoration: none; }
  .overall-score {
    width: 44px; height: 44px; border-radius: 50%; color: white; font-weight: 700; font-size: 15px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .card-desc { font-size: 13px; color: #6b7280; margin-bottom: 16px; }

  .dimensions { border-top: 1px solid #eef0f4; padding-top: 14px; margin-bottom: 16px; }
  .dim-row { display: grid; grid-template-columns: 130px 90px 1fr; gap: 8px; align-items: baseline; margin-bottom: 8px; font-size: 13px; }
  .dim-label { font-weight: 500; color: #374151; }
  .dim-score { font-size: 11px; letter-spacing: 1px; }
  .dim-notes { color: #6b7280; font-size: 12px; }

  .card-sw { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px; }
  .strengths strong { color: #16a34a; }
  .weaknesses strong { color: #dc2626; }
  .card-sw ul { margin-top: 6px; padding-left: 16px; }
  .card-sw li { margin-bottom: 4px; color: #374151; line-height: 1.5; }

  /* Opportunities */
  .opp-list { list-style: none; }
  .opp-list li {
    padding: 12px 16px; margin-bottom: 10px; background: #f0fdf4;
    border-left: 3px solid #16a34a; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6;
  }
  .strength-list { list-style: none; }
  .strength-list li {
    padding: 10px 14px; margin-bottom: 8px; background: #eff6ff;
    border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; font-size: 14px;
  }

  .footer { text-align: center; font-size: 11px; color: #9ca3af; padding: 32px 0 20px; border-top: 1px solid #eef0f4; }

  @media print {
    .cover { page-break-after: always; }
    .competitor-card { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <div class="cover-badge">Konkurrentanalys</div>
  <div class="cover-logo">HP<span>Kampen</span></div>
  <div class="cover-title">Marknadsanalys — Högskoleprovet</div>
  <div class="cover-meta">Genererad ${date} &nbsp;·&nbsp; ${data.competitors.length} konkurrenter analyserade</div>
</div>

<!-- Content -->
<div class="page">

  <div class="section">
    <h2>Sammanfattning</h2>
    <div class="summary-box">${data.summary}</div>
  </div>

  <div class="section">
    <h2>Konkurrentmatris</h2>
    ${matrixTable(data.competitors)}
  </div>

  <div class="section">
    <h2>Detaljanalys per konkurrent</h2>
    ${data.competitors.sort((a, b) => b.overallScore - a.overallScore).map(competitorCard).join("")}
  </div>

  <div class="section">
    <h2>Möjligheter för tvakommanollan.se</h2>
    <ul class="opp-list">
      ${data.opportunities.map((o) => `<li>${o}</li>`).join("")}
    </ul>
  </div>

  <div class="section">
    <h2>tvakommanollan.se styrkor</h2>
    <ul class="strength-list">
      ${data.tvakommanollanStrengths.map((s) => `<li>${s}</li>`).join("")}
    </ul>
  </div>

  <div class="footer">
    tvakommanollan.se · Konkurrentanalys ${date} · Genererad av Claude Code
  </div>

</div>
</body>
</html>`;
}

export async function generateReport(data: AnalysisResult, outputDir: string): Promise<string> {
  const date = new Date(data.generatedAt).toISOString().slice(0, 7); // YYYY-MM
  const htmlPath = join(outputDir, `rapport-${date}.html`);
  const pdfPath = join(outputDir, `rapport-${date}.pdf`);

  const html = buildHtml(data);
  writeFileSync(htmlPath, html, "utf-8");
  console.log(`[report] HTML sparad: ${htmlPath}`);

  console.log("[report] Startar Puppeteer...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  await browser.close();

  console.log(`[report] PDF sparad: ${pdfPath}`);
  return pdfPath;
}
