"""
Blindprovet (REGELVERK.md, steg 5): förbered filer åt granskarna och räkna ut resultatet.

  python3 scripts/mek-gen/blind.py prep <ut-katalog> <namn> <batch.json> [id ...]
  python3 scripts/mek-gen/blind.py score <ut-katalog> <namn> <batch.json> ...

`prep` skriver <namn>-text.txt (text och alternativ, inget facit) och
<namn>-utan.txt (bara alternativen). Granskarna skriver <namn>-svar.json och
<namn>-gissning.json. `score` jämför med facit och listar det som ska ses över:
fel svar, osäkerhet, försvarbara alternativ och facit som gissats med stark
signal utan text.
"""
import json, sys, collections as C

def load(paths, ids=None):
    out = []
    for p in paths:
        for b in json.load(open(p)):
            if not ids or b['id'] in ids: out.append(b)
    return out

def prep(d, name, paths, ids):
    B = load(paths, ids)
    with open(f'{d}/{name}-text.txt', 'w') as f:
        for b in B:
            f.write(f"{b['id']}\n{b['text']}\n" + "\n".join(f"{'ABCD'[i]}) {a}" for i, a in enumerate(b['alternatives'])) + "\n\n")
    with open(f'{d}/{name}-utan.txt', 'w') as f:
        for b in B:
            f.write(f"{b['id']}\n" + "\n".join(f"{'ABCD'[i]}) {a}" for i, a in enumerate(b['alternatives'])) + "\n\n")
    print(len(B), 'uppgifter')

def score(d, name, paths):
    B = {b['id']: b for b in load(paths)}
    S = {s['id']: s for s in json.load(open(f'{d}/{name}-svar.json'))}
    G = {g['id']: g for g in json.load(open(f'{d}/{name}-gissning.json'))}
    ids = [i for i in S if i in B]
    wrong = [i for i in ids if S[i]['val'] != B[i]['answer']]
    print(f"med text: {len(ids) - len(wrong)}/{len(ids)} rätt")
    for i in wrong: print(f"  FEL {i}: valde {S[i]['val']}, facit {B[i]['answer']} ({S[i].get('sakerhet')})")
    for i in ids:
        s = S[i]
        if s.get('sakerhet') != 'säker' or s.get('andra_forsvarbara'):
            print(f"  SE ÖVER {i}: {s.get('sakerhet')} {[a['alt'] + ': ' + a['skal'] for a in s.get('andra_forsvarbara', [])]}")
        if s.get('problem'): print(f"  anm {i}: {s['problem']}")
    gi = [i for i in G if i in B]
    by = C.defaultdict(lambda: [0, 0])
    for i in gi:
        g = B[i]['text'].count('_____'); by[g][1] += 1; by[g][0] += G[i]['gissning'] == B[i]['answer']
    hit = sum(v[0] for v in by.values())
    print(f"utan text: {hit}/{len(gi)} rätt ({100*hit/max(1,len(gi)):.0f} %; arkivet 62 %), per luckantal {dict(sorted(by.items()))}")
    for i in gi:
        if G[i]['gissning'] == B[i]['answer'] and G[i].get('signal') == 'stark':
            print(f"  STARK SIGNAL {i}: {G[i].get('varfor', '')}")

if __name__ == '__main__':
    cmd, d, name = sys.argv[1:4]
    rest = sys.argv[4:]
    paths = [r for r in rest if r.endswith('.json')]
    ids = set(r for r in rest if not r.endswith('.json'))
    (prep(d, name, paths, ids) if cmd == 'prep' else score(d, name, paths))
