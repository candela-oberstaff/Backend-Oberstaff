import axios from "axios";
import logger from "../../logger.js";
import { Job } from "../models/Job.js"; 
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

    logger.info(`📦 ${activeJobs.length} vacantes activas obtenidas de la API.`);
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
      const exists = await Job.findById(job.id);
      if (!exists) {
        todayJobs.push(job);
      } else {
        logger.info(`⚠️ Vacante con ID ${job.id} ya existe en la DB, se omite.`);
      }
    }
  }

  logger.info(`📆 ${todayJobs.length} vacantes nuevas del día (no duplicadas en DB).`);
  return todayJobs;
};
