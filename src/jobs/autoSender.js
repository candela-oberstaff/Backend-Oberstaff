import axios from "axios";
import logger from "../../logger.js";
import { fetchActiveJobs } from "./fetcher.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import dotenv from "dotenv";
dotenv.config();

export const sendNewJobsFlow = async () => {
  try {
    logger.info("🔍 Iniciando verificación de vacantes nuevas...");

    const newJobs = await fetchActiveJobs();

    if (newJobs.length === 0) {
      logger.info("📭 No se detectaron vacantes nuevas.");
      return;
    }

    logger.info(`📤 Enviando ${newJobs.length} nuevas vacantes...`);

    // WhatsApp espera objeto { positions }
    await sendJobsToWhatsApp({ positions: newJobs });

    // Telegram espera array de jobs
    await sendJobsToTelegram(newJobs);

    // Notificar workflow externo (opcional)
    const WORKFLOW_WEBHOOK = process.env.WORKFLOW_WEBHOOK_URL;
    if (WORKFLOW_WEBHOOK) {
      try {
        await axios.post(WORKFLOW_WEBHOOK, { jobs: newJobs });
        logger.info(`🌐 Workflow notificado con ${newJobs.length} vacantes.`);
      } catch (err) {
        logger.error(`❌ Error enviando al workflow: ${err.message}`);
      }
    }

    logger.info(`✅ Flujo completado: ${newJobs.length} vacantes nuevas enviadas.`);
  } catch (err) {
    logger.error(`❌ Error en sendNewJobsFlow: ${err.message}`);
  }
};

// Invocar si ejecutás el archivo directamente
if (require.main === module) {
  sendNewJobsFlow();
}
