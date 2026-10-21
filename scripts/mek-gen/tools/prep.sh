#!/usr/bin/env bash
# prep.sh NN  — hämtar kallor-NN-web.txt och kallor-NN.txt, kollar återanvändning, bygger sammandrag
N=$1; cd "$(dirname "$0")/../../.."
P=scripts/mek-gen/pilot
grep -v "^#" $P/kallor-$N.txt | while read t; do grep -qx "$t" $(ls $P/kallor-*.txt | grep -v "kallor-$N") && echo "USED-WIKI $t"; done
grep -v "^#" $P/kallor-$N-web.txt | awk -F' [|] ' '{print $2}' | while read t; do grep -q "| $t |" $(ls $P/kallor-*-web.txt | grep -v "kallor-$N-") && echo "USED-WEB $t"; done
bun run scripts/mek-gen/fetch-web.ts fetch $P/kallor-$N-web.txt 2>&1 | grep -v "^ok" | tail -6
bun run scripts/mek-gen/fetch-sources.ts $P/kallor-$N.txt 2>&1 | grep -i saknas
python3 - $N <<'PY'
import sys,os
N=sys.argv[1]; P='scripts/mek-gen/pilot'
o=open(f'scripts/mek-gen/out/batch{N}-sources.txt','w')
for l in open(f'{P}/kallor-{N}-web.txt'):
    l=l.strip()
    if not l or l.startswith('#'): continue
    t=l.split('|')[1].strip(); f=f'scripts/mek-gen/out/sources/{t}.txt'
    if not os.path.exists(f): continue
    x=open(f).read().split('\n',2)[-1].replace('\n',' ')
    if len(x)<600: print('KORT-WEB',t,len(x))
    o.write(f'=== {t}\n{x[:800]}\n')
for t in [l.strip() for l in open(f'{P}/kallor-{N}.txt') if l.strip() and not l.startswith('#')]:
    f=f'scripts/mek-gen/out/sources/{t}.txt'
    if not os.path.exists(f): continue
    x=open(f).read().replace('\n',' ').split('https://',1)[-1].split(' ',1)[-1]
    if len(x)<700: print('KORT-WIKI',t,len(x))
    if 'kan avse' in x[:300] or 'kan syfta på' in x[:300]: print('FLERTYDIG',t)
    o.write(f'=== {t}\n{x[:750]}\n')
PY
grep -c "^===" scripts/mek-gen/out/batch$N-sources.txt
