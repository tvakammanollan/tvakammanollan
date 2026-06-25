# Designplan – göra hela appen mindre "vibe-coded" och mer proffsig

Små, högutväxlande ändringar. Ingen ombyggnad av flöden – bara visuell disciplin:
**en palett, en uppsättning primitiver, lugn rörelse.** Sorterat efter
effekt/insats (P0 = störst skillnad, minst jobb).

## Grundprincip / designtokens att hålla sig till

Brand-paletten finns redan i `src/styles.css` (rad 757+):
`--navy #170d05` (bakgrund), `--navy-2/-3` (ytor), `--cream #e8e4da` (text),
`--amber #f2a65a` (primär accent/CTA), `--teal #6fb3b8` (sekundär accent),
`--line` (kanter). Shadcn-tokens är redan mappade: `bg-background`,
`bg-card`, `bg-primary`, `border-border` → mörka brand-färger.

**Regeln:** använd tokens / brand-klasser. Inga råa hex- eller rgba-färger i
markup. Inga indigo/fuchsia/cyan.

---

## P0 – Döda det andra färgsystemet (största "vibe-coded"-tecknet)

Tailwind-klasser (`bg-white`, `text-indigo-600`) ommappas redan till brand i
`styles.css`. Men **hårdkodade hex/rgba ommappas INTE** och lyser indigo på den
mörka appen. Det är detta som får sidor att se ihopfixade ut.

**Sök & ersätt (hela `src/`):**
- `#6366f1`, `#4338ca`, `#818cf8`, `#a5b4fc` → `var(--amber)` / `#f2a65a`
  (CTA, aktiva states) eller `var(--teal)` (sekundärt)
- `#e0e7ff` (ljus indigo-fyllning) → `rgba(242,166,90,0.14)` (amber-tint)
- `rgba(99,102,241,…)`, `rgba(217,70,239,…)`, `rgba(6,182,212,…)` →
  `rgba(242,166,90,…)` resp. `rgba(111,179,184,…)`
- glow-skuggor `--shadow-glow-indigo` → `--shadow-glow-gold` (finns redan)

**Värsta filerna (verifierat):**
- `src/routes/match.$matchId.tsx` – 16 indigo-träffar (mest använda skärmen!)
- `src/routes/gamla-prov.tsx` – 15 (spinner, kanter, glow, aktiv-prick `#a5b4fc`)
- `src/routes/result.$matchId.tsx` – CTA `bg-[#6366f1]`
- `src/routes/train.tsx`, `src/routes/ord.tsx`, `src/routes/stats.tsx`

Rensa även legacy-tokens i `styles.css` som fortfarande pekar på indigo
(`--color-primary: #6366f1`, `--color-aurora-indigo`) om de fortfarande
refereras – sätt till amber eller ta bort.

---

## P0 – In-match-skärmen (`match.$matchId.tsx`) till brand

Mest spelade skärmen och mest off-brand. Små byten, stor effekt:
- Valt svarsalternativ: `border-[#6366f1] bg-[#e0e7ff]` → amber-kant +
  `bg-[rgba(242,166,90,0.12)]`; markörbrickan `bg-[#6366f1]` → `bg-[#f2a65a]`
  med mörk text.
- Progressbarer: egna `bg-[#6366f1]` (du) / `bg-[#eab308]` (motst.) →
  amber (du) / teal (motståndare). Två brand-färger, tydlig kontrast.
- "Lämna in"-knappen → `Button` (primär amber) istället för egen stil.
- Kort: `bg-white` (redan mappad till navy) OK, men byt ev. `border-border`
  till `border-white/10` om kanten är osynlig.

---

## P1 – Resultatskärmen (`result.$matchId.tsx`)

- Primär-CTA: ta bort `btn-shine` + `bg-[#6366f1]` → `<Button>` (amber).
- Rätt/fel-feedback: standardisera semantiska färger (se P2) – grön/röd
  tonade för mörk yta, inte `emerald-50/60` (ljusa ytor).
- Byt hjälte-`SplitText` → `Reveal` (samma lugna rörelse som nya dashboarden).

---

## P1 – Enhetlig rörelse (välj ETT mönster)

Idag blandas `SplitText` (ord-för-ord) på `login`, `signup`, `onboarding`,
`result` med enklare fades på andra ställen.
- Behåll `SplitText` **endast** i `PageHero` (en plats, medvetet).
- På app-skärmar (login/signup/onboarding/result): byt till `Reveal`
  (mjuk fade-up, respekterar `prefers-reduced-motion`).
- Resultat: konsekvent, lugn känsla istället för "allt animerar".

---

## P2 – Primitiv-disciplin (mindre special-CSS = proffsigare)

- **Knappar:** använd `src/components/ui/button.tsx` överallt istället för
  egenstylade `<button>`/`<a>` med hex-färger. (`btn-shine` fasas ut.)
- **Kort:** `GlassCard` (`src/components/layout/GlassCard.tsx`) som standard;
  `variant="interactive"` för klickbara.
- **Etiketter/rubriker:** `EyebrowLabel` + `.display` (font-display) – redan
  standard via `PageHero`.
- **Container-bredd:** `max-w-3xl` för innehållssidor, `max-w-md` för formulär.
  Idag mest konsekvent; rätta enstaka avvikare (`max-w-5xl/4xl/lg`).
- **Kanter & radius:** `border-white/10` + `rounded-2xl` genomgående (inga
  kvarvarande `border-black/8` – ljus-temats kant, osynlig på mörkt).

---

## P2 – Mikro-polish som läser som "proffsigt"

- **Fokus-ring:** enhetlig `focus-visible:ring-2 ring-[#f2a65a]` på alla
  klickbara element (tillgänglighet + känsla). Finns redan på vissa.
- **Spinners/laddning:** `gamla-prov` har indigo-spinner → amber. En
  skeleton-stil (`skeleton-shimmer`) genomgående.
- **Tomt-läge:** använd `EmptyState` (`src/components/EmptyState.tsx`) på alla
  tomma listor (vänner, topplista, stats) istället för ad-hoc text.
- **Siffror:** `tabular-nums` på all ELO/statistik (delvis gjort).
- **Sektionsrytm:** använd `Section` (`src/components/layout/Section.tsx`)
  för konsekvent vertikal spacing.

---

## P3 – Lugnare sidhuvuden (valfritt)

`PageHero` ritar dekorativa `orb`-glowar på `variant="content"`. Överväg att
ta bort orbs (eller behålla en, väldigt subtil) för ett renare uttryck –
påverkar alla innehållssidor på en gång eftersom de delar `PageHero`.

---

## Sammanfattning: 7 småsaker, stor skillnad

1. Bort med alla hårdkodade indigo-hex/rgba → amber/teal (P0).
2. In-match-skärmen till brand-färger (P0).
3. Resultat-CTA → `Button`, slopa `btn-shine` (P1).
4. En rörelse-stil: `SplitText` bara i `PageHero`, annars `Reveal` (P1).
5. `Button`/`GlassCard`/`EyebrowLabel` istället för egenstylat (P2).
6. Enhetlig fokus-ring, spinner-färg, `EmptyState`, `tabular-nums` (P2).
7. (Valfritt) lugnare `PageHero` utan orbs (P3).

## Verifiering

- Efter P0/P1: sök i `src/` efter `6366f1|4338ca|99, ?102, ?241|a5b4fc|e0e7ff|
  fuchsia|cyan|indigo-gradient` → ska vara ~tomt (utöver semantisk grön/röd).
- Kör varje skärm: landing, dashboard, match (spela en), result, ord, train,
  gamla-prov, stats, leaderboard, friends, login/signup. Inga indigo-inslag,
  konsekvent amber/teal, lugn rörelse.
- `npx tsc --noEmit` + `npx eslint` rena.
- Mobil (~375px) + `prefers-reduced-motion`.
