// Sanity-check the local cartas_<format>.json after merge / image rewrite.
//
// Usage: node scripts/verify-cards.mjs [pb]
import { readJson, localCardsPath, positional } from './lib/io.mjs';

async function main() {
  const format = positional(0, process.env.FORMAT ?? 'pb');
  const localPath = localCardsPath(format);
  const local = await readJson(localPath);
  const cards = local.data.CardCatalog.cards;

  const total = local.data.CardCatalog.total;
  const ids = cards.map((c) => c.id);
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  const cdnLeft = cards.filter((c) => c.imageUrl && c.imageUrl.includes('cdn.mazos.cl'));
  const noImage = cards.filter((c) => !c.imageUrl);
  const missingType = cards.filter((c) => !c.type);

  let problems = 0;
  const fail = (label, ok) => {
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
    if (!ok) problems++;
  };

  console.log(`Formato: ${format}  (${localPath})`);
  console.log(`Cartas:  ${cards.length}\n`);
  fail(`total (${total}) coincide con cantidad de cartas (${cards.length})`, total === cards.length);
  fail(`sin ids duplicados (${[...new Set(dupIds)].length} dup)`, dupIds.length === 0);
  fail(`sin imageUrl en cdn.mazos.cl (${cdnLeft.length} restantes)`, cdnLeft.length === 0);
  fail(`todas las cartas tienen type (${missingType.length} sin type)`, missingType.length === 0);

  console.log(`\nInfo: ${noImage.length} cartas sin imageUrl.`);
  if (cdnLeft.length) {
    console.log('\nEjemplos de imageUrl aun en cdn.mazos.cl:');
    for (const c of cdnLeft.slice(0, 10)) console.log(`  #${c.id} ${c.name}`);
  }

  process.exit(problems ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
