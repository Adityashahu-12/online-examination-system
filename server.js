require('dotenv').config();
const http = require('http');
const app = require('./server/app');
const { pool } = require('./server/config/database');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log('====================================================');
  console.log('  EXAMHUB — ONLINE EXAMINATION MANAGEMENT SYSTEM');
  console.log('====================================================');

  try {
    // 1. Verify PostgreSQL Connection
    const client = await pool.connect();
    console.log('[Database] Connected to PostgreSQL successfully.');

    // 2. Auto-migration check: check if `users` table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('[Database] Fresh database detected. Executing initial schema & seeds...');
      const fs = require('fs');
      const path = require('path');
      const schemaSql = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');
      await client.query(schemaSql);
      console.log('[Database] Schema created successfully.');

      // Run initial seeds
      client.release();
      const { seedDatabase } = require('./database/seed');
      if (typeof seedDatabase === 'function') {
        await seedDatabase();
      }
    } else {
      client.release();
      console.log('[Database] Institutional schema and tables are active.');
    }
  } catch (err) {
    console.error('[Database Warning] Could not connect or auto-migrate:', err.message);
    console.log('[Database Notice] Server will continue running. Ensure DATABASE_URL is configured.');
  }

  // 3. Start HTTP server
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`[ExamHub] Server running on http://localhost:${PORT}`);
    console.log(`[ExamHub] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap();
