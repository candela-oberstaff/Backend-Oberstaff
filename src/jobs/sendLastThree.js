// sendYesterdayIntelliJobs.js
import dotenv from "dotenv";
import axios from "axios";
import logger from "../../logger.js";
import { pool } from "../db/postgresClient.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";

dotenv.config();

const INTELLISCREEN_URL = "https://api.intelliscreen.io/positions";
const API_KEY = process.env.INTELLISCREEN_API_KEY;

async function sendYesterdayJobs() {
  try {
    logger.info("🔍 Iniciando envío de vacantes de ayer desde Intelliscreen...");

    const res = await axios.get(INTELLISCREEN_URL, {
      headers: { "X-API-Key": API_KEY },
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
    });

    const allJobs = res.data.positions || [];
    if (!allJobs.length) {
      logger.info("⚠️ No se encontraron vacantes en Intelliscreen.");
      process.exit(0);
    }

    // Fecha de ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    // Filtrar vacantes de ayer y activas
    const yesterdayJobs = allJobs.filter(job => {
      const created = new Date(job.created_at);
      return created >= startOfYesterday && created <= endOfYesterday &&
             String(job.status).toLowerCase() === "active";
    });

    if (!yesterdayJobs.length) {
      logger.info("📭 No hay vacantes de ayer para enviar.");
      process.exit(0);
    }

    // Filtrar las que ya existen en la DB
    const existingIdsResult = await pool.query("SELECT id FROM jobs WHERE id = ANY($1)", [
      yesterdayJobs.map(j => j.id),
    ]);
    const existingIds = new Set(existingIdsResult.rows.map(r => r.id));

    const jobsToSend = yesterdayJobs.filter(job => !existingIds.has(job.id));

    if (!jobsToSend.length) {
      logger.info("📭 Todas las vacantes de ayer ya fueron enviadas.");
      process.exit(0);
    }

    // Guardar en DB antes de enviar
    for (const job of jobsToSend) {
      await pool.query(
        `INSERT INTO jobs (id, job_title, status, created_at, total_candidates, tests, invitation_link)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [
          job.id,
          job.job_title || job.title,
          job.status || "Active",
          job.created_at,
          job.total_candidates || 0,
          JSON.stringify(job.tests || []),
          job.invitation_link || null
        ]
      );
    }

    logger.info(`📤 Enviando ${jobsToSend.length} vacantes de ayer a WhatsApp y Telegram...`);

    await sendJobsToWhatsApp({ positions: jobsToSend });
    await sendJobsToTelegram(jobsToSend);

    // Notificar workflows
    const workflows = [process.env.WORKFLOW_WEBHOOK_URL, process.env.WORKFLOW_WEBHOOK_ZAPIER, process.env.WORKFLOW_WEBHOOK_N8N].filter(Boolean);
    for (const url of workflows) {
      try {
        await axios.post(url, { jobs: jobsToSend });
        logger.info(`🌐 Workflow notificado correctamente: ${url}`);
      } catch (err) {
        logger.error(`❌ Error notificando workflow ${url}: ${err.message}`);
      }
    }

    logger.info("✅ Envío de vacantes de ayer completado con éxito.");
    process.exit(0);
  } catch (err) {
    logger.error(`❌ Error enviando vacantes de ayer: ${err.message}`);
    process.exit(1);
  }
}

sendYesterdayJobs();
