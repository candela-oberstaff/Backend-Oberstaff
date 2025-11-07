import fs from "fs";
import { pool } from "../db/postgresClient.js";
import logger from "../../logger.js";

const FILE_PATH = "./vacantes.json"; // ruta al archivo con los datos

async function seedJobs() {
  try {
    // 1️⃣ Leer y parsear el archivo JSON
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    const json = JSON.parse(data);

    const jobs = json.positions || json;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      console.error("⚠️ No se encontraron vacantes válidas en el archivo JSON");
      return;
    }

    // 2️⃣ Insertar o ignorar duplicados
    let insertedCount = 0;

    for (const job of jobs) {
      const query = `
        INSERT INTO jobs (
          id, type, name, job_title, status,
          created_at, total_candidates, tests, invitation_link
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO NOTHING;
      `;

      const values = [
        job.id,
        job.type,
        job.name,
        job.job_title,
        job.status || "Active",
        job.created_at ? new Date(job.created_at) : new Date(),
        job.total_candidates || 0,
        JSON.stringify(job.tests || []),
        job.invitation_link || null,
      ];

      const result = await pool.query(query, values);
      if (result.rowCount > 0) insertedCount++;
    }

    logger.info(`✅ ${insertedCount} nuevas vacantes insertadas (de ${jobs.length} totales).`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error insertando vacantes: ${err.message}`);
    process.exit(1);
  }
}

seedJobs();
