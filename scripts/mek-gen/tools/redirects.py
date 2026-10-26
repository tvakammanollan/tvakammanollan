"""redirects.py NN : flaggar titlar i kallor-NN.txt som leder till samma Wikipedia-artikel
som en titel i en tidigare kallor-fil, antingen direkt eller via omdirigering.

prep.sh flaggar redan samma titel två gånger (USED-WIKI). Det här fångar resten:
Vedspis leder till Spis, Kolare till Kolmila, Kroppkakor och Kroppkaka är samma
artikel. Två uppgifter ur samma artikel avslöjar varandra.

Uppslagen cachas i out/redirects.json (gitignorerad), så bara nya titlar slås upp.
"""
import glob, json, os, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PILOT = os.path.join(HERE, "..", "pilot")
CACHE = os.path.join(HERE, "..", "out", "redirects.json")
UA = "tvakommanollan-mek/1.0 (https://tvakommanollan.se)"


def titles(path):
    return [l.strip() for l in open(path) if l.strip() and not l.startswith("#")]


def resolve(todo):
    """Titel -> artikel som titeln till slut leder till (normalisering + omdirigering)."""
    out = {}
    for i in range(0, len(todo), 50):
        chunk = todo[i:i + 50]
        url = ("https://sv.wikipedia.org/w/api.php?action=query&redirects=1&format=json&titles="
               + urllib.parse.quote("|".join(chunk)))
        q = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}))).get("query", {})
        steps = {n["from"]: n["to"] for n in q.get("normalized", [])}
        steps.update({r["from"]: r["to"] for r in q.get("redirects", [])})
        for t in chunk:
            seen, cur = set(), t
            while cur in steps and cur not in seen:
                seen.add(cur)
                cur = steps[cur]
            out[t] = cur
    return out


def main(n):
    n = f"{int(n):02d}"
    mine_file = os.path.join(PILOT, f"kallor-{n}.txt")
    earlier = [f for f in sorted(glob.glob(os.path.join(PILOT, "kallor-*.txt")))
               if "-web" not in f and not f.endswith(f"kallor-{n}.txt")]
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    every = set(titles(mine_file))
    for f in earlier:
        every.update(titles(f))
    todo = sorted(t for t in every if t not in cache)
    if todo:
        cache.update(resolve(todo))
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        json.dump(cache, open(CACHE, "w"), ensure_ascii=False, indent=0)
    owner = {}
    for f in earlier:
        for t in titles(f):
            for key in (t, cache.get(t, t)):
                owner.setdefault(key, set()).add((t, os.path.basename(f)))
    flagged = 0
    for t in titles(mine_file):
        target = cache.get(t, t)
        hits = sorted(owner.get(target, set()) | owner.get(t, set()))
        if hits:
            flagged += 1
            used = ", ".join(f"{a} ({b})" for a, b in hits)
            print(f"OMDIRIGERING {t} -> {target}: används redan som {used}")
    mine = titles(mine_file)
    targets = {}
    for t in mine:
        targets.setdefault(cache.get(t, t), []).append(t)
    for target, ts in targets.items():
        if len(ts) > 1:
            flagged += 1
            print(f"OMDIRIGERING {' och '.join(ts)} leder båda till {target}")
    return flagged


if __name__ == "__main__":
    main(sys.argv[1])
