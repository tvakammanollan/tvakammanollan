import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  encodeStripeForm,
  verifyStripeSignature,
  customFieldValue,
  resolveCoachingPrice,
  clearCoachingPriceCache,
  subscriptionPeriod,
  subscriptionIdOf,
  subscriptionCancelsAtPeriodEnd,
  stripeIdOf,
} from "./stripe.server";
import type { StripeCheckoutSession, StripeSubscription } from "./stripe.server";

/**
 * Signaturen räknas med WebCrypto i koden och med node:crypto här — två olika
 * implementationer av samma algoritm. En fixtur hade bara bevisat att koden är
 * konsekvent med sig själv.
 */
function sign(secret: string, timestamp: number, body: string): string {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

describe("encodeStripeForm", () => {
  it("kodar nästlade objekt och listor som Stripe vill ha dem", () => {
    const encoded = encodeStripeForm({
      mode: "payment",
      line_items: [{ price: "price_123", quantity: 1 }],
      metadata: { user_id: "abc" },
    });
    const parts = encoded.split("&");
    expect(parts).toContain("mode=payment");
    expect(parts).toContain(`${encodeURIComponent("line_items[0][price]")}=price_123`);
    expect(parts).toContain(`${encodeURIComponent("line_items[0][quantity]")}=1`);
    expect(parts).toContain(`${encodeURIComponent("metadata[user_id]")}=abc`);
  });

  it("utelämnar null och undefined helt", () => {
    // Tom sträng betyder "nollställ fältet" hos Stripe — inte samma sak som
    // att inte skicka det.
    expect(encodeStripeForm({ a: null, b: undefined, c: "x" })).toBe("c=x");
  });

  it("URL-kodar värden med specialtecken", () => {
    expect(encodeStripeForm({ url: "https://x.se/a?b=1&c=2" })).toBe(
      `url=${encodeURIComponent("https://x.se/a?b=1&c=2")}`,
    );
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_testhemlighet";
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const now = 1_760_000_000_000; // fast tid, annars flakar toleransen

  it("släpper igenom en korrekt signerad payload", async () => {
    const header = sign(secret, Math.floor(now / 1000), body);
    expect(await verifyStripeSignature(body, header, secret, 300, now)).toBe(true);
  });

  it("stoppar ändrad payload", async () => {
    const header = sign(secret, Math.floor(now / 1000), body);
    const tampered = body.replace("evt_1", "evt_2");
    expect(await verifyStripeSignature(tampered, header, secret, 300, now)).toBe(false);
  });

  it("stoppar fel hemlighet", async () => {
    const header = sign("whsec_annan", Math.floor(now / 1000), body);
    expect(await verifyStripeSignature(body, header, secret, 300, now)).toBe(false);
  });

  it("stoppar en gammal signatur (replay)", async () => {
    const header = sign(secret, Math.floor(now / 1000) - 3600, body);
    expect(await verifyStripeSignature(body, header, secret, 300, now)).toBe(false);
  });

  it("accepterar när en av flera v1 stämmer (nyckelrotation)", async () => {
    const t = Math.floor(now / 1000);
    const good = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    const header = `t=${t},v1=${"0".repeat(64)},v1=${good}`;
    expect(await verifyStripeSignature(body, header, secret, 300, now)).toBe(true);
  });

  it("stoppar saknad header, tom hemlighet och skräp", async () => {
    const t = Math.floor(now / 1000);
    expect(await verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, sign(secret, t, body), "", 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, "hejsan", secret, 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, `t=${t}`, secret, 300, now)).toBe(false);
    expect(await verifyStripeSignature(body, `t=abc,v1=deadbeef`, secret, 300, now)).toBe(false);
  });
});

describe("customFieldValue", () => {
  const session = {
    custom_fields: [
      { key: "fokus", text: { value: "  ORD och tidsplanering " } },
      { key: "tomt", text: { value: "   " } },
      { key: "val", dropdown: { value: "kvallar" } },
    ],
  } as unknown as StripeCheckoutSession;

  it("trimmar text och läser dropdown", () => {
    expect(customFieldValue(session, "fokus")).toBe("ORD och tidsplanering");
    expect(customFieldValue(session, "val")).toBe("kvallar");
  });

  it("ger null för tomt och okänt fält", () => {
    expect(customFieldValue(session, "tomt")).toBeNull();
    expect(customFieldValue(session, "finns-inte")).toBeNull();
  });
});

/**
 * Prisuppslaget körs mot en stubbad fetch. Det som testas är vägvalen — inte
 * att Stripe svarar rätt — eftersom fel produkt eller fel pris här betyder att
 * någon debiteras ett annat belopp än det som stod på knappen.
 */
describe("resolveCoachingPrice", () => {
  const ettPris = {
    id: "price_abc",
    active: true,
    currency: "sek",
    unit_amount: 149500,
    type: "one_time",
    recurring: null,
    product: { id: "prod_1", name: "Coachning Studieupplägg", active: true, default_price: null },
  };

  let anrop: string[] = [];
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    anrop = [];
    clearCoachingPriceCache();
    process.env.STRIPE_SECRET_KEY = "sk_test_hemlig";
    delete process.env.STRIPE_COACHING_PRICE_ID;
    delete process.env.STRIPE_COACHING_PRODUCT_NAME;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_COACHING_PRICE_ID;
    delete process.env.STRIPE_COACHING_PRODUCT_NAME;
    clearCoachingPriceCache();
  });

  function stubba(svar: unknown, ok = true) {
    globalThis.fetch = (async (url: string | URL | Request) => {
      anrop.push(String(url));
      return new Response(JSON.stringify(svar), { status: ok ? 200 : 400 });
    }) as typeof fetch;
  }

  it("använder STRIPE_COACHING_PRICE_ID rakt av när den är satt", async () => {
    process.env.STRIPE_COACHING_PRICE_ID = "price_abc";
    stubba(ettPris);
    const p = await resolveCoachingPrice();
    expect(p).toMatchObject({ priceId: "price_abc", amount: 149500, currency: "sek" });
    expect(p.recurring).toBe(false);
    expect(anrop[0]).toContain("/prices/price_abc");
    expect(anrop[0]).toContain("expand");
  });

  it("letar annars upp produkten på namn och tar dess default_price", async () => {
    stubba({
      data: [
        {
          id: "prod_x",
          name: "Något annat",
          active: true,
          default_price: { ...ettPris, id: "p_fel" },
        },
        { id: "prod_1", name: "Coachning Studieupplägg", active: true, default_price: ettPris },
      ],
    });
    const p = await resolveCoachingPrice();
    expect(p.priceId).toBe("price_abc");
    expect(p.productName).toBe("Coachning Studieupplägg");
    expect(anrop[0]).toContain("/products");
  });

  it("matchar produktnamnet oberoende av skiftläge och blanksteg", async () => {
    process.env.STRIPE_COACHING_PRODUCT_NAME = "  coachning studieUPPLÄGG ";
    stubba({
      data: [
        { id: "prod_1", name: "Coachning Studieupplägg", active: true, default_price: ettPris },
      ],
    });
    await expect(resolveCoachingPrice()).resolves.toMatchObject({ priceId: "price_abc" });
  });

  it("cachar svaret — kortet, landningssidan och modalen ska inte bli tre anrop", async () => {
    process.env.STRIPE_COACHING_PRICE_ID = "price_abc";
    stubba(ettPris);
    await resolveCoachingPrice();
    await resolveCoachingPrice();
    await resolveCoachingPrice();
    expect(anrop).toHaveLength(1);
  });

  it("kastar när ingen produkt matchar, i stället för att gissa på den första", async () => {
    stubba({ data: [{ id: "prod_x", name: "Något annat", active: true, default_price: ettPris }] });
    await expect(resolveCoachingPrice()).rejects.toThrow();
  });

  it("kastar utan hemlig nyckel — och läcker inte Stripes felmeddelande vidare", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    stubba({ error: { message: "Invalid API Key provided: sk_test_hemlig" } }, false);
    await expect(resolveCoachingPrice()).rejects.toThrow(/Betalningen kunde inte startas/);
    expect(anrop).toHaveLength(0);
  });

  it("återger abonnemangsintervall", async () => {
    process.env.STRIPE_COACHING_PRICE_ID = "price_sub";
    stubba({
      ...ettPris,
      id: "price_sub",
      type: "recurring",
      recurring: { interval: "month", interval_count: 1 },
    });
    const p = await resolveCoachingPrice();
    expect(p.recurring).toBe(true);
    expect(p.interval).toBe("month");
  });
});

describe("verifyStripeSignature — flera hemligheter", () => {
  const body = JSON.stringify({ id: "evt_2", type: "checkout.session.completed" });
  const now = 1_760_000_000_000;
  const t = Math.floor(now / 1000);
  const hpk = "whsec_tvakommanollan";
  const nya = "whsec_nyadoman";

  it("godkänner en händelse signerad med endera endpointens hemlighet", async () => {
    for (const s of [hpk, nya]) {
      expect(await verifyStripeSignature(body, sign(s, t, body), `${hpk},${nya}`, 300, now)).toBe(
        true,
      );
    }
  });

  it("avvisar fortfarande en hemlighet som inte står med", async () => {
    expect(
      await verifyStripeSignature(body, sign("whsec_tredje", t, body), `${hpk},${nya}`, 300, now),
    ).toBe(false);
  });

  it("tål blanksteg och tomma poster i listan", async () => {
    expect(
      await verifyStripeSignature(body, sign(nya, t, body), ` ${hpk} , , ${nya} `, 300, now),
    ).toBe(true);
  });

  it("en lista med bara skräptecken godkänner ingenting", async () => {
    expect(await verifyStripeSignature(body, sign(hpk, t, body), " , , ", 300, now)).toBe(false);
  });
});

describe("prenumerationsfälten", () => {
  const base: StripeSubscription = {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    metadata: null,
  };

  it("läser perioden från item, som kontots API-version skickar den", () => {
    const sub = {
      ...base,
      items: { data: [{ id: "si_1", current_period_start: 1_700_000_000, current_period_end: 1_702_592_000 }] },
    };
    expect(subscriptionPeriod(sub)).toEqual({ start: 1_700_000_000_000, end: 1_702_592_000_000 });
  });

  it("faller tillbaka på toppnivån för äldre API-versioner", () => {
    const sub = { ...base, current_period_start: 10, current_period_end: 20, items: { data: [] } };
    expect(subscriptionPeriod(sub)).toEqual({ start: 10_000, end: 20_000 });
    expect(subscriptionPeriod(base)).toEqual({ start: null, end: null });
  });

  it("räknar både cancel_at_period_end och cancel_at som uppsagd", () => {
    expect(subscriptionCancelsAtPeriodEnd(base)).toBe(false);
    expect(subscriptionCancelsAtPeriodEnd({ ...base, cancel_at_period_end: true })).toBe(true);
    expect(subscriptionCancelsAtPeriodEnd({ ...base, cancel_at: 1_702_592_000 })).toBe(true);
  });

  it("hittar prenumerations-id i faktura och prenumeration", () => {
    expect(
      subscriptionIdOf({
        object: "invoice",
        parent: { subscription_details: { subscription: "sub_new" } },
      }),
    ).toBe("sub_new");
    expect(subscriptionIdOf({ object: "invoice", subscription: "sub_old" })).toBe("sub_old");
    expect(subscriptionIdOf({ object: "subscription", id: "sub_self" })).toBe("sub_self");
    expect(subscriptionIdOf({ object: "invoice", subscription: null, parent: null })).toBeNull();
    expect(subscriptionIdOf(null)).toBeNull();
    expect(subscriptionIdOf("sub_1")).toBeNull();
  });

  it("läser id ur både sträng och utfällt objekt", () => {
    expect(stripeIdOf("cus_1")).toBe("cus_1");
    expect(stripeIdOf({ id: "cus_2" })).toBe("cus_2");
    expect(stripeIdOf("")).toBeNull();
    expect(stripeIdOf(null)).toBeNull();
  });

  it("kodar prenumerationens metadata nästlat", () => {
    expect(
      encodeStripeForm({ subscription_data: { metadata: { user_id: "u1", product: "ord_access" } } }),
    ).toBe(
      "subscription_data%5Bmetadata%5D%5Buser_id%5D=u1&subscription_data%5Bmetadata%5D%5Bproduct%5D=ord_access",
    );
  });
});
