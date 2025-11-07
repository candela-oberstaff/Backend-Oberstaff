import dotenv from "dotenv";
import logger from "../../logger.js";
import { pool } from "../db/postgresClient.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js"; // ajusta el path si está en otro lugar

dotenv.config();

async function sendLastThreeJobs() {
  try {
    logger.info("🚀 Obteniendo las últimas 3 vacantes de la base de datos...");

    // 1️⃣ Traer las últimas 3 vacantes creadas
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

    // 2️⃣ Formato compatible con WhatsApp (usa data.positions)
    const whatsappData = { positions: jobs };

    // 3️⃣ Enviar por ambos canales
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
