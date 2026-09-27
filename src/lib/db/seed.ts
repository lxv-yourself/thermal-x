import { getDb } from './index';

async function seed() {
  console.log('Seeding Thermal-X database with realistic industrial scenarios...');
  const db = getDb();
  const events = db.getEvents();
  console.log(`Database initialized successfully! Loaded ${events.length} thermal events and facilities.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
