/**
 * Mallarna för sajtens utgående mejl.
 *
 * Rena funktioner: in med data, ut med `{ subject, html, text }`. De ligger
 * skilda från `email.server.ts` därför att innehållet är det som går att
 * granska och testa — sändningen är bara ett POST.
 *
 * Två saker gäller alla mallar:
 *
 *  - **Både HTML och text.** Ett mejl utan textdel hamnar oftare i skräpposten
 *    och blir oläsbart i klienter som inte renderar HTML.
 *  - **Inline-CSS, inga bilder, inga externa resurser.** Gmail plockar bort
 *    `<style>`-block, och en bild som blockeras får inte ta med sig innehållet.
 */

const SITE = "https://tvakommanollan.se";
const BRAND = "Tvåkommanollan";

/** Röd som i appen (`--amber`), brun text (`--cream`), gräddvit botten. */
const APPLE = "#ae2f26";
const INK = "#2e1e14";
const PAPER = "#fbf6ec";

export interface EmailBody {
  subject: string;
  html: string;
  text: string;
}

/** Enkel HTML-escaping. All data i mallarna nedan går genom den här. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface LayoutInput {
  heading: string;
  /** Redan escapade HTML-stycken. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  footer?: string;
}

function layout({ heading, paragraphs, cta, footer }: LayoutInput): string {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">${p}</p>`)
    .join("");

  const button = cta
    ? `<p style="margin:24px 0 8px;"><a href="${esc(cta.url)}" style="display:inline-block;background:${APPLE};color:#fff8f5;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:999px;">${esc(cta.label)}</a></p>
       <p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#6b5648;">Fungerar inte knappen? Klistra in den här adressen i webbläsaren:<br><span style="word-break:break-all;">${esc(cta.url)}</span></p>`
    : "";

  return `<div style="margin:0;padding:24px;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid rgba(46,30,20,0.12);border-radius:16px;padding:28px;">
    <p style="margin:0 0 20px;font-size:18px;font-weight:800;letter-spacing:-0.04em;color:${APPLE};">2,0</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${INK};">${esc(heading)}</h1>
    ${body}
    ${button}
  </div>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.6;color:#6b5648;text-align:center;">
    ${footer ? `${esc(footer)}<br>` : ""}${BRAND} · <a href="${SITE}" style="color:#6b5648;">tvakommanollan.se</a><br>
    Svara på det här mejlet om du undrar något. Det går till en riktig inkorg.
  </p>
</div>`;
}

function textLayout(
  heading: string,
  lines: string[],
  cta?: { label: string; url: string },
): string {
  const parts = [heading, "", ...lines];
  if (cta) parts.push("", `${cta.label}: ${cta.url}`);
  parts.push("", `${BRAND} · ${SITE}`, "Svara på det här mejlet om du undrar något.");
  return parts.join("\n");
}

/* ── Verifiering av e-postadress ─────────────────────────────────── */

export function verifyEmailTemplate(input: { url: string; username?: string | null }): EmailBody {
  const hej = input.username ? `Hej ${input.username}!` : "Hej!";
  return {
    subject: `Bekräfta din e-postadress · ${BRAND}`,
    html: layout({
      heading: "Bekräfta din e-postadress",
      paragraphs: [
        esc(hej),
        "Du är redan inloggad och kan spela på en gång. Det här är bara för att vi ska veta att adressen är din. Det behövs bland annat för att kunna skriva i forumet och för att du ska kunna återställa lösenordet.",
        "Länken gäller i 24 timmar.",
      ],
      cta: { label: "Bekräfta adressen", url: input.url },
      footer: "Har du inte skapat något konto hos oss? Då kan du strunta i det här mejlet.",
    }),
    text: textLayout(
      "Bekräfta din e-postadress",
      [
        hej,
        "",
        "Du är redan inloggad och kan spela på en gång. Det här är bara för att vi ska veta att adressen är din.",
        "Länken gäller i 24 timmar.",
        "",
        "Har du inte skapat något konto hos oss? Strunta i det här mejlet.",
      ],
      { label: "Bekräfta adressen", url: input.url },
    ),
  };
}

/* ── Kvitto och bokning på coachningen ───────────────────────────── */

export interface CoachingConfirmationInput {
  amountLabel: string | null;
  /** Bokad tid, utskriven i svensk tid. Null = tid inte vald än. */
  scheduledLabel: string | null;
  /** Länk till tacksidan, där tiden väljs om den inte är vald. */
  receiptUrl: string;
}

export function coachingConfirmationTemplate(input: CoachingConfirmationInput): EmailBody {
  const paragraphs = [
    "Tack för att du köpte studieupplägget. Betalningen är genomförd.",
    input.amountLabel ? `Belopp: <strong>${esc(input.amountLabel)}</strong>.` : null,
    input.scheduledLabel
      ? `Din tid är bokad: <strong>${esc(input.scheduledLabel)}</strong>. Du får en kalenderinbjudan från Calendly med länken till samtalet.`
      : "Nästa steg är att välja en tid som passar dig. Använd knappen nedan.",
    "Har du frågor innan dess är det bara att svara på det här mejlet.",
  ].filter((p): p is string => p !== null);

  return {
    subject: input.scheduledLabel
      ? `Kvitto för Studieupplägg · bokad tid · ${BRAND}`
      : `Kvitto för Studieupplägg · välj din tid · ${BRAND}`,
    html: layout({
      heading: input.scheduledLabel ? "Tack! Din tid är bokad." : "Tack! Välj din tid.",
      paragraphs,
      cta: {
        label: input.scheduledLabel ? "Se ditt kvitto" : "Välj en tid",
        url: input.receiptUrl,
      },
    }),
    text: textLayout(
      input.scheduledLabel ? "Tack! Din tid är bokad." : "Tack! Välj din tid.",
      [
        "Tack för att du köpte studieupplägget. Betalningen är genomförd.",
        input.amountLabel ? `Belopp: ${input.amountLabel}.` : "",
        input.scheduledLabel
          ? `Din tid: ${input.scheduledLabel}. Du får en kalenderinbjudan från Calendly.`
          : "Nästa steg är att välja en tid som passar dig.",
        "",
        "Har du frågor är det bara att svara på det här mejlet.",
      ].filter(Boolean),
      { label: input.scheduledLabel ? "Se ditt kvitto" : "Välj en tid", url: input.receiptUrl },
    ),
  };
}

/* ── Driftnotiser till oss själva ────────────────────────────────── */

export function leadNotificationTemplate(input: {
  phone: string;
  name: string | null;
  answers: string[];
  source: string | null;
  message: string | null;
}): EmailBody {
  const rader = [
    `Namn: ${input.name ?? "–"}`,
    `Telefon: ${input.phone}`,
    ...input.answers,
    `Källa: ${input.source ?? "–"}`,
    input.message ? `Meddelande: ${input.message}` : null,
  ].filter((r): r is string => r !== null);

  return {
    subject: `Ny i ringlistan: ${input.name ?? input.phone}`,
    html: layout({
      heading: "Någon vill bli uppringd",
      paragraphs: rader.map((r) => esc(r)),
      cta: { label: "Öppna ringlistan", url: `${SITE}/admin` },
    }),
    text: textLayout("Någon vill bli uppringd", rader, {
      label: "Öppna ringlistan",
      url: `${SITE}/admin`,
    }),
  };
}

export function bugReportTemplate(input: {
  message: string;
  page: string | null;
  username: string | null;
  email: string | null;
}): EmailBody {
  const rader = [
    `Från: ${input.username ?? "okänd"}${input.email ? ` (${input.email})` : ""}`,
    `Sida: ${input.page ?? "–"}`,
    "",
    input.message,
  ];
  return {
    subject: `Buggrapport: ${input.message.slice(0, 60)}${input.message.length > 60 ? "…" : ""}`,
    html: layout({
      heading: "Ny buggrapport",
      paragraphs: rader.filter(Boolean).map((r) => esc(r)),
    }),
    text: textLayout("Ny buggrapport", rader),
  };
}
