import dotenv from "dotenv";
import { fetchTodayJobs } from "./fetcher.js"; 
import logger from "../../logger.js";

dotenv.config();

const testFlow = async () => {
  try {
    logger.info("🔍 Test Flow: Consultando vacantes de Intelliscreen...");

    const newJobs = await fetchTodayJobs();

    if (!newJobs.length) {
      logger.info("📭 No se encontraron vacantes nuevas hoy.");
      return;
    }

    const jobsToSend = newJobs; 

    logger.info(`📤 Vacantes nuevas detectadas: ${jobsToSend.length}`);
    jobsToSend.forEach((job, i) => {
      console.log(`\nVacante #${i + 1}`);
      console.log("ID:", job.id);
      console.log("Título:", job.job_title || job.title);
      console.log("Compañía:", job.company_name);
      console.log("Ubicación:", job.location);
      console.log("Enlace:", job.invitation_link);
      console.log("Fecha creación:", job.created_at);
    });

    logger.info("✅ Test Flow completado correctamente.");

  } catch (err) {
    logger.error(`❌ Error en testFlow: ${err.message}`);
  }
};

testFlow();
