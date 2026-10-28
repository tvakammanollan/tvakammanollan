import {
  ANTAL_RATT_NIVÅER,
  kravFörNivå,
  nivåText,
  sammanfattaKrav,
  type KravSammanfattning,
  type NivåKrav,
} from "./normering";
import { enhet } from "@/lib/sv-format";

/* Texterna som delas av /hogskoleprovet-antal-ratt och nivåsidorna, så att
   sidan, metabeskrivningen och FAQ-schemat säger exakt samma sak. */

export interface NivåData {
  value: number;
  rader: NivåKrav[];
  verbal: KravSammanfattning | null;
  kvant: KravSammanfattning | null;
  /** Nyaste provet där båda delarna har tabell. */
  senaste: NivåKrav | null;
}

export function nivåData(value: number): NivåData {
  const rader = kravFörNivå(value);
  return {
    value,
    rader,
    verbal: sammanfattaKrav(rader, "verbal"),
    kvant: sammanfattaKrav(rader, "kvant"),
    senaste: rader.find((r) => r.verbal !== null && r.kvant !== null) ?? null,
  };
}

export function allaNivåer(): NivåData[] {
  return ANTAL_RATT_NIVÅER.map(nivåData);
}

/** Det korta svaret, en mening per del. Används i ingress, beskrivning och FAQ. */
export function kortSvar(d: NivåData): string {
  const n = nivåText(d.value);
  const delar: string[] = [];
  if (d.verbal)
    delar.push(
      `${d.verbal.min} till ${d.verbal.max} rätt av 80 på den verbala delen (medianen är ${d.verbal.median})`,
    );
  if (d.kvant)
    delar.push(
      `${d.kvant.min} till ${d.kvant.max} av 80 på den kvantitativa (medianen är ${d.kvant.median})`,
    );
  if (!delar.length) return `Det finns ingen officiell tabell för ${n}.`;
  return `För ${n} har det krävts ${delar.join(" och ")}.`;
}

export function faqFörNivå(d: NivåData): Array<{ q: string; a: string }> {
  const n = nivåText(d.value);
  const ut: Array<{ q: string; a: string }> = [
    {
      q: `Hur många rätt behövs för ${n} på högskoleprovet?`,
      a: `${kortSvar(d)} Siffrorna kommer ur UHR:s normeringstabeller för ${enhet(d.rader.length, "provtillfälle")}. Exakt hur många rätt som krävs bestäms först när normeringen för just ditt prov publiceras.`,
    },
  ];
  if (d.senaste) {
    ut.push({
      q: `Hur många rätt krävdes för ${n} på senaste högskoleprovet?`,
      a: `${d.senaste.label} krävdes ${d.senaste.verbal} rätt på den verbala delen och ${d.senaste.kvant} på den kvantitativa för ${n}.`,
    });
  }
  if (d.verbal && d.kvant) {
    ut.push({
      q: `Hur många rätt totalt ger ${n}?`,
      a: `Resultatet är medelvärdet av de två delarnas poäng, avrundat till närmaste 0,05. Med ${n} på båda delarna och mediangränserna blir det ungefär ${d.verbal.median + d.kvant.median} rätt av 160. Är du starkare på den ena delen räcker färre rätt där du är svagare, eftersom delarna vägs ihop.`,
    });
  }
  ut.push({
    q: "Varför krävs olika antal rätt på olika prov?",
    a: "Proven är olika svåra. Normeringen ser till att en poäng betyder ungefär samma sak oavsett prov, så ett svårare prov ger samma poäng för färre rätt.",
  });
  return ut;
}
