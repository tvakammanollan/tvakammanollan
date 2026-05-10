import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CAT_CODES = ['XYZ','KVA','NOG','MEK','DTK','LAS','ELF','ORD'];

function clean(text) {
  if (typeof text !== 'string') return text;
  let s = text;
  // Normalize: remove single-letter spacing pattern in DELPROV header
  s = s.replace(/D\s?E\s?L\s?P\s?R\s?O\s?V[\s\S]*$/i, '');
  // Strip trailing category code as a standalone token (also with letter spacing)
  for (const code of CAT_CODES) {
    const spaced = code.split('').join('\\s?');
    s = s.replace(new RegExp(`\\s+${spaced}\\s*$`, 'i'), '');
    s = s.replace(new RegExp(`\\s+${code}\\s*$`), '');
  }
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Detect exact duplication "X X"
  if (s.length > 4) {
    const half = Math.floor(s.length / 2);
    const a = s.slice(0, half).trim();
    const b = s.slice(half).trim();
    if (a && a === b) s = a;
    // Or split by space midpoint
    const parts = s.split(' ');
    if (parts.length % 2 === 0) {
      const mid = parts.length / 2;
      const left = parts.slice(0, mid).join(' ');
      const right = parts.slice(mid).join(' ');
      if (left === right) s = left;
    }
  }
  return s;
}

let from = 0;
const PAGE = 1000;
let totalFixed = 0, totalDeleted = 0;
while (true) {
  const { data, error } = await sb.from('questions').select('id, options').range(from, from + PAGE - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  for (const q of data) {
    if (!Array.isArray(q.options)) continue;
    const cleaned = q.options.map(o => {
      if (o && typeof o === 'object' && 'text' in o) return { ...o, text: clean(o.text) };
      return o;
    });
    const hasEmpty = cleaned.some(o => o && typeof o === 'object' && (!o.text || o.text.length < 1));
    const changed = JSON.stringify(cleaned) !== JSON.stringify(q.options);
    if (hasEmpty) {
      await sb.from('questions').delete().eq('id', q.id);
      totalDeleted++;
    } else if (changed) {
      await sb.from('questions').update({ options: cleaned }).eq('id', q.id);
      totalFixed++;
    }
  }
  if (data.length < PAGE) break;
  from += PAGE;
}
console.log({ totalFixed, totalDeleted });
