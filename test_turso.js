require('dotenv').config();
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN);

const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testConnection() {
  try {
    const rs = await db.execute({ sql: 'SELECT 1 as test' });
    console.log('Conexão Turso OK:', rs.rows);
  } catch (error) {
    console.error('Erro ao conectar no Turso:', error);
  }
}

testConnection();