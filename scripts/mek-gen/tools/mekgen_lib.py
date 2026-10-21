# Gemensam hjälpare för batchskripten (tools/batcher/gNN.py).
import json, os
G = "_____"
items = []
PILOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pilot")
def it(amne, genre, title, text, key, dist, dtyp, faller, ok, lt, expl):
    items.append(dict(amne=amne, genre=genre, source={"title": title}, text=text, key=key,
                      distractors=dist, dtyp=dtyp, faller=faller, ordklass=ok, ledtrad=lt, explanation=expl))
def write(n):
    for i, x in enumerate(items): x["id"] = f"p{n:02d}-{i+1:02d}"
    json.dump(items, open(os.path.join(PILOT, f"src-{n:02d}.json"), "w"), ensure_ascii=False, indent=0)
    print(len(items), "skrivna")
