const fs = require('fs');
const path = require('path');
const { pool } = require('../server/config/database');

async function runMigration() {
  console.log('[Database] Connecting to PostgreSQL to run migrations...');
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Database] Executing schema.sql DDL & constraints...');
    await client.query(sql);
    console.log('[Database] Schema successfully applied with btree_gist exclusion constraints.');
    return true;
  } catch (error) {
    console.error('[Database Migration Error]:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
