import axios from "axios";
import { getJobsCache, setJobsCache } from "./cache.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import logger from "../logger.js";

const API_KEY = process.env.INTELLISCREEN_API_KEY;
const WORKFLOW_WEBHOOK = process.env.WORKFLOW_WEBHOOK_URL;

export const fetchActiveJobs = async () => {
  try {
    logger.info("🔗 Consultando API Intelliscreen...");
    const res = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: { Accept: "application/json", "X-API-Key": API_KEY },
    });

    const activeJobs = res.data.positions.filter((job) => job.status === "active");
    const currentCache = getJobsCache();

    const newJobs = activeJobs.filter((job) => !currentCache.find((j) => j.id === job.id));

    if (newJobs.length > 0) {
      logger.info(`🚀 Detectadas ${newJobs.length} vacantes nuevas.`);

      await sendJobsToWhatsApp(newJobs);
      await sendJobsToTelegram(newJobs);

      if (WORKFLOW_WEBHOOK) {
        try {
          await axios.post(WORKFLOW_WEBHOOK, { jobs: newJobs });
          logger.info(`🌐 Workflow notificado con ${newJobs.length} vacantes.`);
        } catch (err) {
          logger.error(`❌ Error enviando al workflow: ${err.message}`);
        }
      }

      setJobsCache(activeJobs);
      logger.info("🗃️ Cache actualizado.");
    } else {
      logger.info("📭 No se encontraron vacantes nuevas.");
    }

    return newJobs;
  } catch (err) {
    logger.error(`❌ Error al consultar Intelliscreen: ${err.message}`);
    return [];
  }
};
