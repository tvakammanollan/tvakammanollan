import { describe, it, expect } from "vitest";
import { buildCoachingCheckoutParams, COACHING_FIELD_FOCUS } from "./coaching.server";
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
  origin: "https://hpkampen.se",
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
      "https://hpkampen.se/coachning/tack?session_id={CHECKOUT_SESSION_ID}",
    );
    expect(p.cancel_url).toBe("https://hpkampen.se/?coachning=avbruten");
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
