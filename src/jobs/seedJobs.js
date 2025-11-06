import fs from "fs";
import { pool } from "../db/postgresClient.js";
import logger from "../../logger.js";

const FILE_PATH = "./vacantes.json"; // ruta donde está tu JSON real

async function seedJobs() {
  try {
    // 1️⃣ Leer archivo JSON
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    const json = JSON.parse(data);

    // Dependiendo del formato del JSON, puede venir en json.positions o directamente como array
    const jobs = json.positions || json;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      console.error("⚠️ No se encontraron vacantes válidas en el archivo JSON");
      return;
    }

    // 2️⃣ Insertar en la base de datos
    for (const job of jobs) {
      const query = `
        INSERT INTO jobs (
          id, job_title, title, company_name, location, type,
          total_candidates, invitation_link, tests, status, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO NOTHING;
      `;

      const values = [
        job.id,
        job.job_title,
        job.title,
        job.company_name,
        job.location,
        job.type,
        job.total_candidates || 0,
        job.invitation_link,
        JSON.stringify(job.tests || []),
        job.status || "active",
        job.created_at || new Date(),
      ];

      await pool.query(query, values);
    }

    logger.info(`✅ ${jobs.length} vacantes cargadas en la base de datos.`);
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error insertando vacantes: ${err.message}`);
    process.exit(1);
  }
}

seedJobs();
