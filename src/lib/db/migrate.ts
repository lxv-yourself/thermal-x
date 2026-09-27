import { getDb } from './index';

async function migrate() {
  console.log('Running Thermal-X migrations...');
  const db = getDb();
  console.log(`Migrations completed. ${db.getEvents().length} events available.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
