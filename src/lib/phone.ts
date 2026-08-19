/**
 * Svenska mobilnummer — normalisering till E.164.
 *
 * Numret ska ringas av en människa, så det viktiga är inte att avvisa udda
 * inmatning utan att `0701-23 45 67`, `+46 70 123 45 67` och `0046701234567`
 * hamnar i databasen som samma sträng. Lagras de som de skrevs blir varje
 * dubblett osynlig, och samma person rings två gånger.
 *
 * Bara mobilnummer godtas. Ett fast nummer går att ringa, men den som lämnar
 * det på en mobilsajt har nästan alltid slagit fel — och 08-nummer krockar med
 * de vanligaste feltrycken.
 */

/** Siffror, mellanslag, bindestreck, parenteser och inledande plus. */
const ALLOWED = /^[+\d\s\-()./]+$/;

/**
 * Svenska mobilserier: 70, 72, 73, 76, 79. 71, 74, 75, 77 och 78 är inte
 * tilldelade som mobilserier, så de är nästan säkert feltryck.
 */
const MOBILE_PREFIX = /^7[02369]/;

export interface PhoneResult {
  ok: boolean;
  /** E.164 utan mellanslag, t.ex. "+46701234567". Bara satt när ok. */
  e164?: string;
  /** Svensk felförklaring, redo att visas. Bara satt när !ok. */
  error?: string;
}

export function normalizePhone(raw: string): PhoneResult {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) return { ok: false, error: "Fyll i ditt mobilnummer." };
  if (!ALLOWED.test(trimmed)) {
    return { ok: false, error: "Numret innehåller tecken som inte hör hemma i ett telefonnummer." };
  }

  // Plus betyder landskod och får bara stå först. `00` är samma sak skrivet
  // som man gjorde förr.
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.lastIndexOf("+") > 0) {
    return { ok: false, error: "Plustecknet ska stå först i numret." };
  }
  digits = digits.replace(/\+/g, "");
  if (trimmed.startsWith("+") || digits.startsWith("00")) {
    digits = digits.replace(/^00/, "");
    if (!digits.startsWith("46")) {
      return { ok: false, error: "Vi ringer bara svenska nummer just nu." };
    }
  }

  // Kvar: antingen 46xxxxxxxxx, 0xxxxxxxxx eller xxxxxxxxx.
  let national = digits;
  if (national.startsWith("46")) national = national.slice(2);
  national = national.replace(/^0+/, "");

  if (!MOBILE_PREFIX.test(national)) {
    return { ok: false, error: "Ange ett svenskt mobilnummer, t.ex. 070-123 45 67." };
  }
  // Svenska mobilnummer är nio siffror utan den inledande nollan.
  if (national.length !== 9) {
    return {
      ok: false,
      error: national.length < 9 ? "Numret har för få siffror." : "Numret har för många siffror.",
    };
  }

  return { ok: true, e164: `+46${national}` };
}

/** `+46701234567` → `070-123 45 67`. För kvittot och adminlistan. */
export function formatPhone(e164: string): string {
  const m = /^\+46(\d{9})$/.exec(e164);
  if (!m) return e164;
  const d = m[1];
  return `0${d.slice(0, 2)}-${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}
