import fs from 'node:fs';
import path from 'node:path';

function readLocalEnv() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

const localEnv = readLocalEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local.');
  process.exit(1);
}

const tables = ['products', 'categories', 'product_images', 'testimonials', 'offers'];
let failed = false;

for (const table of tables) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });

  if (response.ok) {
    console.log(`OK  ${table}`);
  } else {
    failed = true;
    const body = await response.text();
    console.error(`ERROR ${table}: HTTP ${response.status} ${body}`);
  }
}

if (failed) {
  console.error('\nLa instalación todavía no está completa.');
  process.exit(1);
}

console.log('\nSupabase está listo para MotoSport Neuquén.');
