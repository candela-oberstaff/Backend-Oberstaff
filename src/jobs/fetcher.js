import { isSent } from "./cache.js";
import logger from "../../logger.js";
import { pool } from "../db/postgresClient.js";

export const fetchTodayJobs = async () => {
  try {
    logger.info("🔍 Buscando vacantes nuevas del día en la base de datos...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queryVacancies = `
      SELECT id, title as job_title, status, created_at, NULL as invitation_link
      FROM vacancies
      WHERE created_at >= $1
    `;

    const queryPositions = `
      SELECT id, COALESCE(job_title, name) as job_title, status, created_at, invitation_link
      FROM positions
      WHERE created_at >= $1
    `;

    const [resVacancies, resPositions] = await Promise.all([
      pool.query(queryVacancies, [today]),
      pool.query(queryPositions, [today])
    ]);

    const allJobs = [...resVacancies.rows, ...resPositions.rows];

    const activeJobs = allJobs.filter(
      job => String(job.status || "").toLowerCase() === "active"
    );

    const todayJobs = [];

    for (const job of activeJobs) {
      const sent = await isSent(job.id);
      if (!sent) {
        todayJobs.push(job);
      } else {
        logger.info(`⚠️ [SKIP] Ya enviada (cache): ${job.job_title} (${job.id})`);
      }
    }

    logger.info(`📆 ${todayJobs.length} vacantes nuevas del día.`);
    return todayJobs;
  } catch (err) {
    logger.error(`❌ Error al consultar base de datos: ${err.message}`);
    return [];
  }
};
