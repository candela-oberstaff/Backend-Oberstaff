import express from "express";
import { getJobsCache, addJobsToCache } from "./cache.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";
import logger from "../logger.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("✅ Backend funcionando correctamente.");
});

// 📦 Consultar cache de vacantes
router.get("/api/jobs", (req, res) => {
  try {
    const jobs = getJobsCache();
    res.status(200).json({ status: "ok", total: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🔁 Reenviar manualmente vacantes actuales por WhatsApp
router.post("/resend-whatsapp", async (req, res) => {
  try {
    const jobs = getJobsCache();
    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ status: "error", message: "No hay vacantes en el cache." });
    }

    logger.info(`📤 Enviando ${jobs.length} vacantes almacenadas por WhatsApp...`);
    await sendJobsToWhatsApp(jobs);

    res.json({ status: "ok", message: `Se reenviaron ${jobs.length} vacantes a WhatsApp.` });
  } catch (err) {
    logger.error(`❌ Error reenviando vacantes: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🧪 Test de envío de mensaje a WhatsApp
router.post("/test-whatsapp", async (req, res) => {
  try {
    const { to, message } = req.body;
    await sendJobsToWhatsApp([{ invitation_link: "https://test.com", title: message || "Mensaje de prueba" , company_name: "Test Company", location: "Remoto", created_at: new Date().toISOString() }]);
    res.json({ status: "ok", message: "Mensaje de prueba enviado a WhatsApp." });
  } catch (err) {
    logger.error(`❌ Error test WhatsApp: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
