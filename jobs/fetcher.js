import axios from "axios";
import dotenv from "dotenv";
import { getJobsCache, setJobsCache } from "./cache.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "../utils/notifiers.js";
import logger from "../logger.js";

dotenv.config();

const API_KEY = process.env.INTELLISCREEN_API_KEY;

export const fetchActiveJobs = async () => {
  try {
    logger.info("🔍 Consultando API de Intelliscreen...");

    const res = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: { Accept: "application/json", "X-API-Key": API_KEY },
    });

    const activeJobs = res.data.positions.filter((job) => job.status === "active");
    const currentCache = getJobsCache();

    const newJobs = activeJobs.filter((job) => !currentCache.find((j) => j.id === job.id));

    if (newJobs.length > 0) {
      logger.info(`🚀 Se detectaron ${newJobs.length} nuevas vacantes.`);

      await sendJobsToWhatsApp(newJobs);
      await sendJobsToTelegram(newJobs);

      setJobsCache(activeJobs);
      logger.info("🗃️ Cache actualizado con las vacantes activas más recientes.");
    } else {
      logger.info("📭 No se encontraron vacantes nuevas.");
    }

    return newJobs;
  } catch (err) {
    logger.error(`❌ Error al consultar Intelliscreen: ${err.message}`);
    return [];
  }
};
