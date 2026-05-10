import pdfParse from 'pdf-parse';
import { readFileSync } from 'node:fs';
for (const f of ['facit','verb1','kvant1','verb2','kvant2']) {
  const buf = readFileSync(`/tmp/hp/${f}.pdf`);
  const r = await pdfParse(buf);
  console.log(`\n========= ${f}.pdf (${r.numpages}p, ${r.text.length} chars) =========`);
  console.log(r.text.slice(0, 3000));
  console.log('...[middle]...');
  console.log(r.text.slice(Math.floor(r.text.length/2), Math.floor(r.text.length/2)+2000));
}
