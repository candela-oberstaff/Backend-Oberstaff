import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  //ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // ⏳ espera hasta 10 seg. antes de fallar
  idleTimeoutMillis: 30000,       // ♻️ cierra conexiones inactivas después de 30 seg.
  max: 10,                        // 🔢 máximo de conexiones simultáneas
});

// Probar conexión inicial
pool.connect()
  .then(async (client) => {
    console.log("✅ Conectado al nuevo PostgreSQL");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs_sent_cache (
          job_id VARCHAR(255) PRIMARY KEY,
          sent_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("✅ Tabla jobs_sent_cache verificada/creada");
    } catch (e) {
      console.error("❌ Error verificando/creando jobs_sent_cache:", e.message);
    } finally {
      client.release();
    }
  })
  .catch((err) => console.error("❌ Error conectando a PostgreSQL:", err.message));

// Escuchar errores globales del pool (para que no crashee el server)
pool.on("error", (err) => {
  console.error("⚠️ Error inesperado en la conexión a la base de datos:", err.message);
});
