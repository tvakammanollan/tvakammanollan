#!/usr/bin/env node
// Skapar kampanjkoderna för skolor och bibliotek i Stripe (2026-11-17).
//
//   node scripts/stripe-kampanjkoder.mjs           # torrkörning, rör ingenting
//   node scripts/stripe-kampanjkoder.mjs --apply   # skapar det som saknas
//
// Idempotent: kuponger har fasta id och koder slås upp på namn, så det som
// redan finns hoppas över. Restriktioner går inte att ändra på en befintlig
// kod; ska en ändras måste den gamla inaktiveras och en ny skapas.
// Läser STRIPE_SECRET_KEY ur .env.local (skarpa kontot).

import { readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
);
const KEY = env.STRIPE_SECRET_KEY;
if (!KEY) throw new Error("STRIPE_SECRET_KEY saknas i .env.local");

// Produkterna bakom STRIPE_ORD_PRICE_ID_1M / _6M i wrangler.jsonc.
const PRODUCT_1M = "prod_VVvVG6mzWx2NDn"; // Premium (månadsprenumeration)
const PRODUCT_6M = "prod_VMo5Ih5XPU7veG"; // Premium, 6 månader (engångsköp)

// Kassans rubrik är "Abonnera på <produktnamn>"; intervallet står ändå under.
const PRODUCT_1M_NAME = "Premium";

// 2027-01-31 23:59 svensk tid (vintertid, +01:00).
const BIBLIOTEK_SLUT = Math.floor(Date.parse("2027-01-31T23:59:00+01:00") / 1000);

const COUPONS = [
  {
    // Bara månadsprodukten: på sexmånadersköpet hade 100 % gett sex månader.
    id: "tkn-gratis-1man",
    name: "1 månad gratis",
    percent_off: 100,
    duration: "repeating",
    duration_in_months: 1,
    products: [PRODUCT_1M],
  },
  {
    id: "tkn-gratis-6man",
    name: "6 månader gratis",
    percent_off: 100,
    duration: "repeating",
    duration_in_months: 6,
    products: [PRODUCT_1M, PRODUCT_6M],
  },
  {
    id: "tkn-ktdrl30-6man",
    name: "30 % på 6 månader",
    percent_off: 30,
    duration: "once",
    products: [PRODUCT_6M],
  },
  {
    id: "tkn-bibliotek-1man",
    name: "1 månad gratis",
    percent_off: 100,
    duration: "repeating",
    duration_in_months: 1,
    products: [PRODUCT_1M],
    redeem_by: BIBLIOTEK_SLUT,
  },
];

const CODES = [
  { code: "RUDBECK100", coupon: "tkn-gratis-1man" },
  { code: "RUDBECK600", coupon: "tkn-gratis-6man", max_redemptions: 7 },
  { code: "KTDRL100", coupon: "tkn-gratis-1man" },
  { code: "KTDRL30", coupon: "tkn-ktdrl30-6man" },
  { code: "DONNER100", coupon: "tkn-gratis-1man" },
  { code: "DONNER600", coupon: "tkn-gratis-6man", max_redemptions: 7 },
  { code: "GUNILLA100", coupon: "tkn-gratis-1man" },
  { code: "GUNILLA600", coupon: "tkn-gratis-6man", max_redemptions: 7 },
  { code: "MARINA100", coupon: "tkn-gratis-1man" },
  { code: "MARINA600", coupon: "tkn-gratis-6man", max_redemptions: 7 },
  // HARORG100 hette HÄRÖRG100 i beställningen; Stripe tar inte å, ä, ö.
  ...["LUND100", "KALMAR100", "HARORG100"].map((code) => ({ code, coupon: "tkn-gratis-1man" })),
  // SARNA100 hette SÄRNA100 i beställningen.
  ...[
    "DIESEL100",
    "FISK100",
    "FLEN100",
    "LJUNG100",
    "NYNAS100",
    "IDRE100",
    "SARNA100",
    "KARLSKOGA100",
    "PERSTORP100",
    "MARIESTAD100",
  ].map((code) => ({
    code,
    coupon: "tkn-bibliotek-1man",
    expires_at: BIBLIOTEK_SLUT,
  })),
];

async function stripe(method, path, params = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) body.append(k, String(v));
  const url = `https://api.stripe.com/v1/${path}${method === "GET" && body.size ? `?${body}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${KEY}` },
    body: method === "GET" ? undefined : body,
  });
  const json = await res.json();
  if (!res.ok && res.status !== 404) throw new Error(`${method} ${path}: ${json.error?.message}`);
  return res.status === 404 ? null : json;
}

const report = [];

// 1. Produktnamnet.
const product = await stripe("GET", `products/${PRODUCT_1M}`);
if (product.name !== PRODUCT_1M_NAME) {
  console.log(`Produkt ${PRODUCT_1M}: "${product.name}" -> "${PRODUCT_1M_NAME}"`);
  if (APPLY) await stripe("POST", `products/${PRODUCT_1M}`, { name: PRODUCT_1M_NAME });
} else console.log(`Produkt ${PRODUCT_1M} heter redan "${PRODUCT_1M_NAME}"`);

// 2. Kupongerna.
const couponStatus = {};
for (const c of COUPONS) {
  const existing = await stripe("GET", `coupons/${c.id}`);
  if (existing) {
    couponStatus[c.id] = "fanns redan";
    continue;
  }
  couponStatus[c.id] = APPLY ? "skapad" : "skapas";
  if (!APPLY) continue;
  const params = {
    id: c.id,
    name: c.name,
    percent_off: c.percent_off,
    duration: c.duration,
    duration_in_months: c.duration_in_months,
    redeem_by: c.redeem_by,
  };
  c.products.forEach((p, i) => (params[`applies_to[products][${i}]`] = p));
  await stripe("POST", "coupons", params);
}

// 3. Koderna.
for (const k of CODES) {
  const found = await stripe("GET", "promotion_codes", { code: k.code, limit: 10 });
  const live = found.data.find((p) => p.active);
  let status;
  let id = live?.id ?? "";
  if (live) {
    const coupon = live.coupon?.id ?? live.coupon ?? live.promotion?.coupon;
    const couponId = typeof coupon === "object" ? coupon.id : coupon;
    status = couponId === k.coupon ? "fanns redan" : `fanns redan (pekar på ${couponId}!)`;
  } else if (!APPLY) {
    status = "skapas";
  } else {
    const created = await stripe("POST", "promotion_codes", {
      code: k.code,
      "promotion[type]": "coupon",
      "promotion[coupon]": k.coupon,
      max_redemptions: k.max_redemptions,
      expires_at: k.expires_at,
    });
    id = created.id;
    status = "skapad";
  }
  const c = COUPONS.find((x) => x.id === k.coupon);
  report.push({
    kod: k.code,
    id,
    kupong: `${k.coupon} (${couponStatus[k.coupon]})`,
    rabatt: `${c.percent_off} %`,
    varaktighet:
      c.duration === "once" ? "en gång" : `${c.duration_in_months} mån`,
    produkt: c.products.map((p) => (p === PRODUCT_1M ? "1m" : "6m")).join("+"),
    max: k.max_redemptions ?? "–",
    utgar: k.expires_at ? "2027-01-31 23:59" : "–",
    status,
  });
}

console.table(report);
if (!APPLY) console.log("\nTorrkörning. Kör med --apply för att skapa.");
