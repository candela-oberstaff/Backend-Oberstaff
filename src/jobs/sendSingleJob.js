import dotenv from "dotenv";
import logger from "../../logger.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import { pool } from "../db/postgresClient.js"; // 👈 ESTE ya tiene la conexión lista

dotenv.config();

async function sendSingleJob(jobId) {
  try {
    const { rows } = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);

    if (rows.length === 0) {
      console.log("⚠️ No se encontró una vacante con ese ID.");
      return;
    }

    const job = rows[0];
    console.log(`📤 Enviando vacante: ${job.job_title}`);

    // Enviar a WhatsApp
    await sendJobsToWhatsApp({ positions: [job] });

    // Enviar a Telegram
    await sendJobsToTelegram([job]);

    console.log("✅ Vacante enviada correctamente a ambos canales.");
  } catch (error) {
    console.error("❌ Error enviando la vacante:", error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar directamente
sendSingleJob("7f2c0419-d125-4884-a347-e0f753d8270e");
