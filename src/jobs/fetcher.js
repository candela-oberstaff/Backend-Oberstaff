import axios from "axios";
import logger from "../../logger.js";
import { Job } from "../models/Job.js";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.INTELLISCREEN_API_KEY;

export const fetchActiveJobs = async () => {
  try {
    logger.info("🔗 Consultando API Intelliscreen...");

    const res = await axios.get("https://api.intelliscreen.io/positions", {
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
    });

    const activeJobs = res.data.positions.filter((job) => job.status === "active");
    const newJobs = [];

    for (const job of activeJobs) {
      const exists = await Job.findOne({ id: job.id });
      if (!exists) {
        await Job.create(job);
        newJobs.push(job);
      }
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
