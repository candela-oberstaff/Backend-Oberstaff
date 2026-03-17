import dotenv from "dotenv";
import axios from "axios";
import logger from "../../logger.js";
import { pool } from "../db/postgresClient.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import { isSent, markAsSent } from "./cache.js";

dotenv.config();

async function sendYesterdayJobs() {
  try {
    logger.info("🔍 Iniciando envío de vacantes de ayer desde la base de datos...");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    const queryVacancies = `
      SELECT id, title as job_title, status, created_at, NULL as invitation_link
      FROM vacancies
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const queryPositions = `
      SELECT id, COALESCE(job_title, name) as job_title, status, created_at, invitation_link
      FROM positions
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const [resVacancies, resPositions] = await Promise.all([
      pool.query(queryVacancies, [startOfYesterday, endOfYesterday]),
      pool.query(queryPositions, [startOfYesterday, endOfYesterday]),
    ]);

    const allJobs = [...resVacancies.rows, ...resPositions.rows];

    if (!allJobs.length) {
      logger.info("⚠️ No se encontraron vacantes de ayer.");
      process.exit(0);
    }

    const yesterdayJobs = allJobs.filter(job => 
      String(job.status || "").toLowerCase() === "active"
    );

    if (!yesterdayJobs.length) {
      logger.info("📭 No hay vacantes activas de ayer para enviar.");
      process.exit(0);
    }

    const jobsToSend = [];
    for (const job of yesterdayJobs) {
      const sent = await isSent(job.id);
      if (!sent) {
        jobsToSend.push(job);
      }
    }

    if (!jobsToSend.length) {
      logger.info("📭 Todas las vacantes de ayer ya fueron enviadas.");
      process.exit(0);
    }

    logger.info(`📤 Enviando ${jobsToSend.length} vacantes de ayer a WhatsApp y Telegram...`);

    await sendJobsToWhatsApp({ positions: jobsToSend });
    await sendJobsToTelegram(jobsToSend);

    // Guardar en cache para evitar reenvio
    await markAsSent(jobsToSend);

    const workflows = [
      process.env.WORKFLOW_WEBHOOK_URL, 
      process.env.WORKFLOW_WEBHOOK_ZAPIER, 
      process.env.WORKFLOW_WEBHOOK_N8N
    ].filter(Boolean);

    for (const url of workflows) {
      try {
        await axios.post(url, { jobs: jobsToSend });
        logger.info(`🌐 Workflow notificado correctamente: ${url}`);
      } catch (err) {
        logger.error(`❌ Error notificando workflow ${url}: ${err.message}`);
      }
    }

    logger.info("✅ Envío de vacantes de ayer completado con éxito.");
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error enviando vacantes de ayer: ${err.message}`);
    process.exit(1);
  }
}

sendYesterdayJobs();
