import { isSent, saveJobs } from "./cache.js";
import axios from "axios";
import logger from "../../logger.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.INTELLISCREEN_API_KEY;
const INTELLISCREEN_URL = "https://api.intelliscreen.io/positions";

export const fetchActiveJobs = async () => {
  try {
    logger.info("🔗 Consultando API Intelliscreen...");

    const res = await axios.get(INTELLISCREEN_URL, {
      params: {
        page: 1,
        per_page: 100,
        sort_by: "created_at",
        sort_order: "desc",
      },
      headers: {
        Accept: "application/json",
        "X-API-Key": API_KEY,
      },
      timeout: 15000,
    });

    const allJobs = res.data.positions || [];

    const activeJobs = allJobs.filter(
      job => String(job.status || "").toLowerCase() === "active"
    );

    // 🛡️ Deduplicar por ID para evitar que la misma vacante se procese dos veces
    const uniqueActiveJobs = Array.from(
      new Map(activeJobs.map(job => [job.id, job])).values()
    );

    logger.info(`📦 ${uniqueActiveJobs.length} vacantes activas obtenidas de la API.`);
    logger.debug(`📋 Nombres: ${uniqueActiveJobs.map(j => j.job_title || j.name).join(", ")}`);



    logger.info("💾 Guardando vacantes activas en la tabla jobs...");
    await saveJobs(activeJobs);
    logger.info("✅ Vacantes guardadas/actualizadas correctamente en jobs.");


    return activeJobs;
  } catch (err) {
    logger.error(`❌ Error al consultar Intelliscreen: ${err.message}`);
    return [];
  }
};




export const fetchTodayJobs = async () => {
  const activeJobs = await fetchActiveJobs();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayJobs = [];

  for (const job of activeJobs) {
    const createdAt = new Date(job.created_at);

    if (createdAt >= today && createdAt < tomorrow) {
      const sent = await isSent(job.id);
      if (!sent) {
        todayJobs.push(job);
      } else {
        logger.info(`⚠️ [SKIP] Ya enviada (cache): ${job.job_title} (${job.id})`);
      }
    } else {
      logger.info(`⏭️ [SKIP] Fecha incorrecta: ${job.job_title} | Created: ${createdAt.toISOString()} | Today: ${today.toISOString()}`);
    }
  }

  logger.info(`📆 ${todayJobs.length} vacantes nuevas del día (según PostgreSQL).`);
  return todayJobs;
};
