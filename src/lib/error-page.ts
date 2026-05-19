export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <title>Sidan kunde inte laddas · HP Kampen</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0E1B2C; color: #F5E9D6; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.5rem; margin: 0 0 0.5rem; color: #F5E9D6; }
      p { color: rgba(245, 233, 214, 0.75); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1.25rem; border-radius: 9999px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; font-weight: 500; }
      .primary { background: #F2A65A; color: #0A0A0F; }
      .secondary { background: transparent; color: #F5E9D6; border-color: rgba(245, 233, 214, 0.2); }
      .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(242, 166, 90, 0.15); color: #F2A65A; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">Tekniskt fel</div>
      <h1>Sidan kunde inte laddas</h1>
      <p>Något gick fel på vår sida. Du kan prova att ladda om — eller gå tillbaka till startsidan så löser det sig oftast direkt.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Försök igen</button>
        <a class="secondary" href="/">Till hem</a>
      </div>
    </div>
  </body>
</html>`;
}
