"""
Skriver om exempel.json ur de provpass som redan ligger i src/data/prov/,
utan att röra något annat (ingen nedladdning, inga bilder ombyggda).

Behövs för att exempel.json är en ögonblicksbild från senaste build.py-körning
— varje gång ett provpass senare skrivs om för hand (se t.ex. `apply_quant_text.py`
och commit-serien "provpass X till text"), eller när ett fält läggs till i
write_examples() själv (som imageAspect), blir filen stum tills den byggs om.
Full `build.py` går inte att köra om (se CLAUDE.md), men den här filen beror
bara på data som redan finns i git.

    python3 scripts/hp-import/refresh_examples.py
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from build import OUT_DATA, write_examples  # noqa: E402

with open(os.path.join(OUT_DATA, "index.json"), encoding="utf-8") as f:
    index = json.load(f)["exams"]

write_examples(index)
