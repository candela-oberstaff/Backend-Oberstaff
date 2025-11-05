import logger from "../../logger.js";
import { fetchActiveJobs } from "./fetcher.js";

export const sendNewJobsFlow = async () => {
  try {
    logger.info("🔍 Iniciando verificación de vacantes nuevas...");

    const activeJobs = await fetchActiveJobs(); 
    const dbJobs = await Job.find({ status: "active" });

    
    const newJobs = activeJobs.filter(
      (job) => !dbJobs.find((dbJob) => dbJob.id === job.id)
    );

    if (newJobs.length === 0) {
      logger.info("📭 No se detectaron vacantes nuevas.");
      return;
    }

    await Job.insertMany(newJobs);

    await sendJobsToWhatsApp(newJobs);
    await sendJobsToTelegram(newJobs);

    logger.info(`🚀 Se enviaron ${newJobs.length} vacantes nuevas a los canales.`);
  } catch (err) {
    logger.error(`❌ Error en sendNewJobsFlow: ${err.message}`);
  }
};
