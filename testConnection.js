// backend/testConnection.js
const pool = require('./db');

const testConnection = async () => {
  try {
    // Test basic connection
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', res.rows);

    // Query to get all tables in the database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const tablesRes = await pool.query(tablesQuery);
    console.log('Tables in the database:');
    tablesRes.rows.forEach(row => console.log(row.table_name));
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    pool.end();
  }
};

testConnection();