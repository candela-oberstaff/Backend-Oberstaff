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

    // Filtrar por status "active" (case-insensitive)
    const activeJobs = allJobs.filter(
      (job) => String(job.status || "").toLowerCase() === "active"
    );

    // Traer todos los ids existentes en la DB una sola vez
    const existingIds = await Job.getAllIds();
    const existingSet = new Set(existingIds);

    // Detectar solo los jobs que no estén en la DB (por id)
    const newJobs = activeJobs.filter((job) => !existingSet.has(job.id));

    // Insertar nuevas vacantes en la DB (antes de enviar)
    for (const job of newJobs) {
      await Job.create(job);
    }

    if (newJobs.length > 0) {
      logger.info(`🚀 ${newJobs.length} vacantes nuevas detectadas y guardadas.`);
    } else {
      logger.info("📭 No se encontraron vacantes nuevas.");
    }

    return newJobs;
  } catch (err) {
    logger.error(`❌ Error al consultar Intelliscreen: ${err.message}`);
    return [];
  }
};
