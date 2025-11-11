import dotenv from "dotenv";
import logger from "../../logger.js";
import { pool } from "../db/postgresClient.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";

dotenv.config();

async function sendLastThreeJobs() {
  try {
    logger.info("🚀 Obteniendo las últimas 3 vacantes de la base de datos...");

    const result = await pool.query(
      `SELECT * FROM jobs ORDER BY created_at DESC LIMIT 3;`
    );

    const jobs = result.rows;

    if (jobs.length === 0) {
      logger.info("⚠️ No se encontraron vacantes en la base de datos.");
      process.exit(0);
    }

    logger.info(`✅ Se encontraron ${jobs.length} vacantes para enviar:`);

    jobs.forEach((j) => console.log(`• ${j.job_title || j.title}`));

    const whatsappData = { positions: jobs };

  
    await sendJobsToTelegram(jobs);
    await sendJobsToWhatsApp(whatsappData);

    logger.info("🎯 Envío de las últimas 3 vacantes completado con éxito.");
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error al enviar vacantes: ${err.message}`);
    process.exit(1);
  }
}

sendLastThreeJobs();
