const { Pool } = require('pg');
require('dotenv').config();

// Determine Database connection string
let connectionString = process.env.DATABASE_URL;

// Normalize PostgreSQL protocol for Render / Heroku / Supabase
if (connectionString && connectionString.startsWith('postgres://')) {
  connectionString = connectionString.replace('postgres://', 'postgresql://');
}

const poolConfig = {
  connectionString: connectionString || 'postgresql://postgres:password@localhost:5432/online_examination_system_portal',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Enable SSL if connecting to remote cloud database (Render, Supabase, Neon)
if (connectionString && (connectionString.includes('render.com') || connectionString.includes('neon.tech') || connectionString.includes('supabase.co') || process.env.NODE_ENV === 'production')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Unexpected Error]:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
