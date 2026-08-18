import { describe, it, expect } from "vitest";
import {
  buildCoachingCheckoutParams,
  COACHING_FIELD_FOCUS,
  COACHING_FIELD_TIMING,
  isCoachingSession,
} from "./coaching.server";
import { encodeStripeForm } from "./stripe.server";

/**
 * Kassans parametrar är enda stället i integrationen där ett fel varken syns i
 * typkontrollen eller i ett felmeddelande: Stripe ignorerar okända fält, så en
 * tappad metadata-nyckel märks först när webhooken inte hittar tillbaka till
 * köpet — efter att någon betalat. Formen pinnas därför här.
 */
const bas = {
  priceId: "price_123",
  recurring: false,
  requestId: "11111111-2222-3333-4444-555555555555",
  userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  source: "dashboard",
  origin: "https://tvakommanollan.se",
};

describe("buildCoachingCheckoutParams", () => {
  it("skickar med köpets id på alla tre ställen webhooken kan läsa det", () => {
    const p = buildCoachingCheckoutParams(bas) as Record<string, unknown>;
    expect(p.client_reference_id).toBe(bas.requestId);
    expect((p.metadata as Record<string, string>).coaching_request_id).toBe(bas.requestId);
    expect(
      (p.payment_intent_data as { metadata: Record<string, string> }).metadata.coaching_request_id,
    ).toBe(bas.requestId);
  });

  it("returadressen bär Stripes platshållare, inte ett tomt session_id", () => {
    const p = buildCoachingCheckoutParams(bas) as unknown as Record<string, string>;
    expect(p.success_url).toBe(
      "https://tvakommanollan.se/coachning/tack?session_id={CHECKOUT_SESSION_ID}",
    );
    expect(p.cancel_url).toBe("https://tvakommanollan.se/?coachning=avbruten");
  });

  it("engångspris ger mode=payment, abonnemang ger mode=subscription", () => {
    expect((buildCoachingCheckoutParams(bas) as { mode: string }).mode).toBe("payment");
    expect(
      (buildCoachingCheckoutParams({ ...bas, recurring: true }) as { mode: string }).mode,
    ).toBe("subscription");
  });

  it("payment_intent_data utelämnas för abonnemang — Stripe avvisar fältet där", () => {
    const p = buildCoachingCheckoutParams({ ...bas, recurring: true }) as Record<string, unknown>;
    expect(p.payment_intent_data).toBeUndefined();
  });

  it("utloggad köpare ger tomt user_id, inte 'null' eller 'undefined'", () => {
    const p = buildCoachingCheckoutParams({ ...bas, userId: null }) as {
      metadata: Record<string, string>;
    };
    expect(p.metadata.user_id).toBe("");
  });

  it("mejl utelämnas helt när det inte är känt", () => {
    const utan = encodeStripeForm(buildCoachingCheckoutParams(bas));
    expect(utan).not.toContain("customer_email");
    const med = encodeStripeForm(buildCoachingCheckoutParams({ ...bas, email: "a@b.se" }));
    expect(med).toContain(`customer_email=${encodeURIComponent("a@b.se")}`);
  });

  it("kodas till den formulärform Stripe faktiskt läser", () => {
    const delar = encodeStripeForm(buildCoachingCheckoutParams(bas)).split("&");
    expect(delar).toContain(`${encodeURIComponent("line_items[0][price]")}=price_123`);
    expect(delar).toContain(`${encodeURIComponent("line_items[0][quantity]")}=1`);
    expect(delar).toContain(`${encodeURIComponent("phone_number_collection[enabled]")}=true`);
    expect(delar).toContain(
      `${encodeURIComponent("custom_fields[0][key]")}=${COACHING_FIELD_FOCUS}`,
    );
    expect(delar).toContain(`${encodeURIComponent("custom_fields[0][optional]")}=true`);
    expect(delar).toContain("locale=sv");
    expect(delar).toContain("allow_promotion_codes=true");
  });

  it("båda kassafrågorna är frivilliga — en obligatorisk fråga kan stoppa ett köp", () => {
    const p = buildCoachingCheckoutParams(bas) as {
      custom_fields: Array<{ optional: boolean }>;
    };
    expect(p.custom_fields).toHaveLength(2);
    expect(p.custom_fields.every((f) => f.optional)).toBe(true);
  });
});

describe("isCoachingSession", () => {
  const som = (metadata: Record<string, string> | null) =>
    ({ id: "cs_1", metadata }) as unknown as Parameters<typeof isCoachingSession>[0];

  it("känner igen en session vi själva skapat", () => {
    expect(isCoachingSession(som({ product: "coaching", coaching_request_id: "x" }))).toBe(true);
  });

  it("accepterar ett köp som påbörjades innan märkningen fanns", () => {
    expect(isCoachingSession(som({ coaching_request_id: "x" }))).toBe(true);
  });

  it("släpper inte igenom ett främmande köp i samma Stripe-konto", () => {
    // Endpointen lyssnar på alla händelser i kontot; utan den här spärren blir
    // någon annans checkout en betald coachningsrad.
    expect(isCoachingSession(som({ product: "nagot_annat" }))).toBe(false);
    expect(isCoachingSession(som({}))).toBe(false);
    expect(isCoachingSession(som(null))).toBe(false);
  });

  it("märkningen följer med i kassans parametrar", () => {
    const p = buildCoachingCheckoutParams(bas) as { metadata: Record<string, string> };
    expect(p.metadata.product).toBe("coaching");
  });
});

describe("buildCoachingCheckoutParams med bokad tid", () => {
  const bokat = { ...bas, scheduledAt: "2026-09-01T12:00:00.000000Z" };

  it("frågar inte om tiden igen när den redan är vald", () => {
    const p = buildCoachingCheckoutParams(bokat) as { custom_fields: { key: string }[] };
    const nycklar = p.custom_fields.map((f) => f.key);
    expect(nycklar).toContain(COACHING_FIELD_FOCUS);
    expect(nycklar).not.toContain(COACHING_FIELD_TIMING);
  });

  it("hoppar över fokusfrågan när den besvarades i Calendly", () => {
    const p = buildCoachingCheckoutParams({ ...bokat, focusAnswered: true }) as {
      custom_fields: unknown[];
    };
    expect(p.custom_fields).toHaveLength(0);
  });

  it("lägger tiden i metadata så den syns bredvid betalningen i Stripe", () => {
    const p = buildCoachingCheckoutParams(bokat) as { metadata: Record<string, string> };
    expect(p.metadata.scheduled_at).toBe(bokat.scheduledAt);
  });

  it("utan bokning står metadata-nyckeln inte med alls", () => {
    const p = buildCoachingCheckoutParams(bas) as { metadata: Record<string, string> };
    expect(p.metadata.scheduled_at).toBeUndefined();
  });
});
