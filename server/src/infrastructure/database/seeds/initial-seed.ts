import dataSource from '../config/data-source';
import { ensureDatabaseExists } from '../bootstrap/ensure-database';
import { ensureCanonicalSchema } from '../bootstrap/initialize-schema';
import { runInitialSeed } from './database-seeder';

async function seed() {
  await ensureDatabaseExists();
  await dataSource.initialize();
  try {
    const schemaState = await ensureCanonicalSchema(dataSource);
    const result = await runInitialSeed(dataSource);

    console.log(`Canonical schema: ${schemaState}`);
    console.log(
      result.seeded ? 'Seed completed.' : 'Seed skipped: data already present.',
    );
    console.log(result.counts);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
