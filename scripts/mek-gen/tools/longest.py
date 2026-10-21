# Hur många treluckor har facit som längsta alternativ? Högst 3 av 10 per batch.
import json, sys
n = 0
for b in json.load(open(sys.argv[1])):
    if b["text"].count("_____") == 3:
        L = [len(a) for a in b["alternatives"]]
        if L["ABCD".index(b["answer"])] == max(L): n += 1; print("längst", b["id"])
print("facit längst i", n, "treluckor")
