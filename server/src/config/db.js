const mysql = require('mysql2/promise');

const shouldUseDatabase = () => Boolean(process.env.DB_HOST && process.env.DB_NAME);

let pool;

function getPool() {
  if (!shouldUseDatabase()) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }

  return pool;
}

async function testConnection() {
  const database = getPool();

  if (!database) {
    return { mode: 'memory', ok: true };
  }

  const connection = await database.getConnection();
  connection.release();

  return { mode: 'mysql', ok: true };
}

module.exports = {
  getPool,
  testConnection,
};
