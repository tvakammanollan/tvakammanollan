export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="sv">
  <head>
    <meta charset="utf-8" />
    <title>Sidan kunde inte laddas, Tvåkommanollan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #06040e; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.5rem; margin: 0 0 0.5rem; color: #F5E9D6; }
      p { color: rgba(245, 233, 214, 0.75); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1.25rem; border-radius: 9999px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; font-weight: 500; }
      .primary { background: #06040e; color: #0A0A0F; }
      .secondary { background: transparent; color: #F5E9D6; border-color: rgba(245, 233, 214, 0.2); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Sidan kunde inte laddas</h1>
      <p>Något gick fel på vår sida. Du kan prova att ladda om, eller gå tillbaka till startsidan så löser det sig oftast direkt.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Försök igen</button>
        <a class="secondary" href="/">Till startsidan</a>
      </div>
    </div>
  </body>
</html>`;
}
