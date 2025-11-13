import { fetchTodayJobs } from "./fetcher.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import { isSent, markAsSent } from "./cache.js";
import logger from "../../logger.js";
import axios from "axios";

export const sendNewJobsFlow = async () => {
  try {
    logger.info("🔍 Iniciando verificación de vacantes nuevas del día...");

    const newJobs = await fetchTodayJobs();

    if (!newJobs.length) {
      logger.info("📭 No se encontraron vacantes nuevas del día.");
      return;
    }

    // Filtrar solo las vacantes que aún no fueron enviadas
    const jobsToSend = [];
    for (const job of newJobs) {
      if (!(await isSent(job.id))) jobsToSend.push(job);
    }

    if (!jobsToSend.length) {
      logger.info("📭 Todas las vacantes nuevas ya fueron enviadas anteriormente.");
      return;
    }

    logger.info(`📤 Enviando ${jobsToSend.length} vacantes nuevas por WhatsApp y Telegram...`);

    await sendJobsToWhatsApp({ positions: jobsToSend });
    await sendJobsToTelegram(jobsToSend);

    await markAsSent(jobsToSend);

    // Notificar a workflows
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

    logger.info("✅ Flujo completado correctamente.");
  } catch (err) {
    logger.error(`❌ Error en sendNewJobsFlow: ${err.message}`);
  }
};
