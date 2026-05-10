import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchAll() {
  const all = [];
  let last = '00000000-0000-0000-0000-000000000000';
  while (true) {
    const { data, error } = await sb
      .from('questions').select('id, category, options')
      .gt('id', last).order('id', { ascending: true }).limit(500);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data); last = data[data.length-1].id;
    if (data.length < 500) break;
  }
  return all;
}

const all = await fetchAll();
let deleted = 0;
for (const q of all) {
  if (!Array.isArray(q.options)) continue;
  const lens = q.options.map(o => (o?.text ?? '').length);
  const others = lens.slice(0, -1);
  const maxOther = Math.max(...others, 0);
  const last = lens[lens.length - 1];
  // If last option is dramatically longer than the rest, it's polluted -> delete question
  if (maxOther > 0 && last > Math.max(40, maxOther * 2.5)) {
    await sb.from('questions').delete().eq('id', q.id);
    deleted++;
    continue;
  }
  // Also delete if any option is unreasonably long for its category
  const longLimit = q.category === 'LAS' || q.category === 'ELF' || q.category === 'DTK' ? 400 : 120;
  if (lens.some(l => l > longLimit)) {
    await sb.from('questions').delete().eq('id', q.id);
    deleted++;
  }
}
console.log({ deleted, total: all.length });
