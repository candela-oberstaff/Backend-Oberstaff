import axios from "axios";
import logger from "../logger.js";

export async function sendJobsToWhatsApp(jobs) {
  const WAHA_URL = process.env.WAHA_URL;
  const CHAT_ID = process.env.WHATSAPP_CHAT_ID;
  const API_KEY = process.env.WAHA_API_KEY;

  for (const job of jobs) {
    try {
      await axios.post(
        `${WAHA_URL}/api/sendText`,
        {
          session: "default",
          chatId: CHAT_ID,
          text: `💼 *Nueva vacante disponible!*\n\n📍 ${job.title || job.job_title}\n🌍 ${job.location}\n🔗 ${job.invitation_link}`,
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      logger.info(`📲 WhatsApp enviado: ${job.title || job.job_title}`);
    } catch (error) {
      logger.error(`❌ Error enviando por WhatsApp: ${error.message}`);
    }
  }
}

export async function sendJobsToTelegram(jobs) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  for (const job of jobs) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          chat_id: CHAT_ID,
          text: `📢 *Nueva vacante publicada!*\n\n💼 ${job.title || job.job_title}\n🌍 ${job.location}\n🔗 ${job.invitation_link}`,
          parse_mode: "Markdown",
        }
      );
      logger.info(`📤 Telegram enviado: ${job.title || job.job_title}`);
    } catch (error) {
      logger.error(`❌ Error enviando por Telegram: ${error.message}`);
    }
  }
}
