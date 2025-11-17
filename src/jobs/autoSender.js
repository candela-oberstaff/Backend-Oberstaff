import { fetchTodayJobs } from "./fetcher.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import { isSent, markAsSent } from "./cache.js";
import logger from "../../logger.js";
import axios from "axios";

export const sendNewJobsFlow = async () => {
  try {
    logger.info("🔍 Buscando vacantes nuevas del día...");

    const todayJobs = await fetchTodayJobs();
    if (!todayJobs.length) {
      logger.info("📭 No hay vacantes nuevas para enviar.");
      return;
    }

    // Filtrar solo vacantes NO enviadas (seguridad extra)
    const jobsToSend = [];
    for (const job of todayJobs) {
      if (!(await isSent(job.id))) {
        jobsToSend.push(job);
      }
    }

    if (!jobsToSend.length) {
      logger.info("📭 Todas las vacantes ya fueron enviadas antes.");
      return;
    }

    logger.info(`📤 Enviando ${jobsToSend.length} vacantes...`);

    await sendJobsToWhatsApp({ positions: jobsToSend });
    await sendJobsToTelegram(jobsToSend);

    // Guardar en cache de PostgreSQL
    await markAsSent(jobsToSend);

    // Notificar workflows (si existen)
    const workflows = [
      process.env.WORKFLOW_WEBHOOK_URL,
      process.env.WORKFLOW_WEBHOOK_ZAPIER,
      process.env.WORKFLOW_WEBHOOK_N8N,
    ].filter(Boolean);

    for (const url of workflows) {
      try {
        await axios.post(url, { jobs: jobsToSend });
        logger.info(`🌐 Workflow notificado correctamente: ${url}`);
      } catch (err) {
        logger.error(`❌ Error notificando workflow ${url}: ${err.message}`);
      }
    }

    logger.info("✅ Flujo completado correctamente.");
  } catch (err) {
    logger.error(`❌ Error en sendNewJobsFlow: ${err.message}`);
  }
};
