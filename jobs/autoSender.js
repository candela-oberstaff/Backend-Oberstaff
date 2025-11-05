import { fetchActiveJobs } from "./fetcher.js";
import logger from "../logger.js";

export const sendNewJobsFlow = async () => {
  try {
    logger.info("🔍 Iniciando verificación de vacantes nuevas...");
    const newJobs = await fetchActiveJobs(); 

    if (newJobs.length === 0) {
      logger.info("📭 No se detectaron vacantes nuevas.");
      return;
    }

    logger.info(`🚀 ${newJobs.length} vacantes nuevas enviadas.`);
  } catch (err) {
    logger.error(`❌ Error en sendNewJobsFlow: ${err.message}`);
  }
};
