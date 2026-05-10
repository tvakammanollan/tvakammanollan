import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CAT_CODES = ['XYZ','KVA','NOG','MEK','DTK','LAS','ELF','ORD'];

function clean(text) {
  if (typeof text !== 'string') return text;
  let s = text.replace(/\s+/g, ' ').trim();
  // Cut at common page-bleed markers
  const cutMarkers = [
    /\s*DELPROV[\s\S]*$/i,
    /\s*FORTSÄTT[\s\S]*$/i,
    /\s*KVANTITATIVA[\s\S]*$/i,
    /\s*KVANTITATIVT[\s\S]*$/i,
    /\s*JÄMFÖRELSER[\s\S]*$/i,
    /\s*RESONEMANG[\s\S]*$/i,
    /\s*Antal poäng[\s\S]*$/i,
    /\s*–\s*\d+\s*–[\s\S]*$/,
    /\s*Vilket svarsalternativ[\s\S]*$/i,
    /\s*N\s?Ä\s?STA SIDA[\s\S]*$/i,
  ];
  for (const re of cutMarkers) s = s.replace(re, '');
  // Trailing standalone category code
  for (const code of CAT_CODES) {
    s = s.replace(new RegExp(`\\s+${code}\\s*$`), '');
  }
  s = s.replace(/\s+/g, ' ').trim();
  // Detect duplicated halves
  const parts = s.split(' ');
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const mid = parts.length / 2;
    const left = parts.slice(0, mid).join(' ');
    const right = parts.slice(mid).join(' ');
    if (left === right) s = left;
  }
  return s;
}

// Pull all IDs first to avoid 1000-row caps
const { data: ids, error: e1 } = await sb.rpc('exec_sql', {}).then(()=>({data:null,error:'n/a'})).catch(()=>({data:null,error:null}));

async function fetchAll() {
  const all = [];
  let last = '00000000-0000-0000-0000-000000000000';
  while (true) {
    const { data, error } = await sb
      .from('questions')
      .select('id, options')
      .gt('id', last)
      .order('id', { ascending: true })
      .limit(500);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    last = data[data.length - 1].id;
    if (data.length < 500) break;
  }
  return all;
}

const all = await fetchAll();
console.log('fetched', all.length);
let fixed = 0, deleted = 0;
for (const q of all) {
  if (!Array.isArray(q.options)) continue;
  const cleaned = q.options.map(o =>
    o && typeof o === 'object' && 'text' in o ? { ...o, text: clean(o.text) } : o,
  );
  const hasEmpty = cleaned.some(o => o && typeof o === 'object' && (!o.text || o.text.length < 1));
  const changed = JSON.stringify(cleaned) !== JSON.stringify(q.options);
  if (hasEmpty) {
    await sb.from('questions').delete().eq('id', q.id);
    deleted++;
  } else if (changed) {
    await sb.from('questions').update({ options: cleaned }).eq('id', q.id);
    fixed++;
  }
}
console.log({ fixed, deleted });
