import axios from "axios";
import logger from "../../logger.js";
import dotenv from "dotenv";
dotenv.config();

export async function sendJobsToWhatsApp(data) {
  const WAHA_URL = process.env.WAHA_URL;
  const CHAT_ID = process.env.WHATSAPP_CHAT_ID;
  const API_KEY = process.env.WAHA_TOKEN;

  if (!data.positions || data.positions.length === 0) {
    console.log("No hay posiciones para enviar.");
    return;
  }

  for (const job of data.positions) {
    const message = `
🔔 ¡Nueva oportunidad en Oberstaff! 🔔

💼 *Título del Puesto:*
${job.job_title || job.title || "Sin título"}

🔗 *Enlace de Invitación:*
${job.invitation_link || "No disponible"}
    `.trim();

    try {
      await axios.post(
        `${WAHA_URL}/api/sendText`,
        {
          session: "default",
          chatId: CHAT_ID,
          text: message,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`✅ WhatsApp enviado: ${job.job_title || job.title}`);
    } catch (error) {
      console.error("❌ Error enviando por WhatsApp:", error.message);
    }
  }
}


export async function sendJobsToTelegram(jobs) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!jobs || jobs.length === 0) {
    logger.info("No hay vacantes para enviar a Telegram.");
    return;
  }

  for (const job of jobs) {
    const message = `
🔔 *¡Nueva oportunidad en Oberstaff!* 🔔

💼 *Título del Puesto:*
${job.job_title || job.title || "Sin título"}

🔗 *Enlace de Invitación:*
${job.invitation_link || "No disponible"}
    `.trim();

    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      });
      logger.info(`📤 Telegram enviado: ${job.job_title || job.title}`);
    } catch (error) {
      logger.error(`❌ Error enviando por Telegram: ${error.message}`);
    }
  }
}
