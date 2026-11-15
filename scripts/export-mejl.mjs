// Exporterar adresserna till dem som sagt ja till utskick.
//
//   node scripts/export-mejl.mjs          → .hp-cache/mejl/utskick*.txt
//   node scripts/export-mejl.mjs --alla   → även alla.txt (bara för
//                                            servicemejl, aldrig reklam)
//
// Läser SUPABASE_SERVICE_ROLE_KEY ur .env.local och träffar produktionen,
// men läser bara. Filerna hamnar i .hp-cache/, som är gitignorerad:
// adresser får aldrig committas.
import fs from "node:fs";

const key = fs
  .readFileSync(".env.local", "utf8")
  .match(/^SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\n]+)/m)?.[1];
const url = fs.readFileSync(".env", "utf8").match(/^VITE_SUPABASE_URL=["']?([^"'\n]+)/m)?.[1];
if (!key || !url) throw new Error("Hittar inte nyckeln i .env.local eller adressen i .env");
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function addresses(filter) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${url}/rest/v1/users?select=email&email=not.is.null${filter}&order=id`, {
      headers: { ...headers, Range: `${from}-${from + 999}` },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const rows = await r.json();
    out.push(...rows.map((x) => x.email.trim().toLowerCase()));
    if (rows.length < 1000) break;
  }
  return [...new Set(out)].sort();
}

fs.mkdirSync(".hp-cache/mejl", { recursive: true });
const yes = await addresses("&email_opt_in=is.true");
fs.writeFileSync(".hp-cache/mejl/utskick.txt", yes.join("\n") + "\n");
fs.writeFileSync(".hp-cache/mejl/utskick-kommaseparerat.txt", yes.join(", ") + "\n");
console.log(`${yes.length} har sagt ja till utskick → .hp-cache/mejl/utskick.txt`);

if (process.argv.includes("--alla")) {
  const all = await addresses("");
  fs.writeFileSync(".hp-cache/mejl/alla.txt", all.join("\n") + "\n");
  console.log(`${all.length} konton med adress → .hp-cache/mejl/alla.txt (bara servicemejl)`);
}
