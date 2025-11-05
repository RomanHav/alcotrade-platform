import { prisma } from '@/lib/prisma';

/**
 * One-off script to normalize product descriptions' newlines in DB.
 * - Converts CRLF (\r\n) and CR (\r) to LF (\n)
 * - Optionally unescapes literal "\\n"/"\\r\\n" sequences into real newlines (if any legacy data stored them)
 *
 * Run with: pnpm fix:product-descriptions
 */
function normalizeDescription(input: string | null | undefined): string | null {
  if (input == null) return null;
  let s = input;
  // Unescape literal sequences first ("\\n" -> "\n") in case legacy data contains escaped newlines
  s = s.replace(/\\r\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\n/g, '\n');
  // Normalize actual CRLF/CR to LF
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Trim trailing spaces/tabs per line (optional hygiene)
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
  return s;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, description: true } });

  let changed = 0;
  const updates: { id: string; description: string | null }[] = [];

  for (const p of products) {
    const next = normalizeDescription(p.description);
    if (next !== p.description) {
      updates.push({ id: p.id, description: next });
    }
  }

  // Update in chunks to avoid large transactions
  const chunkSize = 100;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((u) =>
        prisma.product.update({
          where: { id: u.id },
          data: { description: u.description },
        }),
      ),
    );
    changed += chunk.length;
    // eslint-disable-next-line no-console
    console.log(`Updated ${Math.min(i + chunk.length, updates.length)} / ${updates.length}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Products updated: ${changed}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
