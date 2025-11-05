import express from "express";
import logger from "../../logger.js";
import { Job } from "../models/Job.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";

const router = express.Router();

router.get("/", (req, res) => res.send("✅ Backend funcionando correctamente"));

// 📦 Consultar todas las vacantes activas
router.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" }).sort({ created_at: -1 });
    res.status(200).json({ status: "ok", total: jobs.length, jobs });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🔁 Reenviar manualmente vacantes actuales por WhatsApp
router.post("/resend-whatsapp", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" });
    if (!jobs.length) return res.status(404).json({ status: "error", message: "No hay vacantes activas." });

    logger.info(`📤 Enviando ${jobs.length} vacantes activas por WhatsApp...`);
    await sendJobsToWhatsApp(jobs);
    await sendJobsToTelegram(jobs);

    res.json({ status: "ok", message: `Se reenviaron ${jobs.length} vacantes.` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🧪 Test de envío de mensaje a WhatsApp
router.post("/test-whatsapp", async (req, res) => {
  try {
    const { message } = req.body;
    const testJob = [{
      job_title: message || "Vacante de prueba",
      title: message || "Vacante de prueba",
      invitation_link: "https://test.com",
      company_name: "Test Company",
      location: "Remoto",
      created_at: new Date().toISOString(),
      tests: [],
      type: "Prueba",
      total_candidates: 0,
      status: "active"
    }];

    await sendJobsToWhatsApp(testJob);
    await sendJobsToTelegram(testJob);

    res.json({ status: "ok", message: "Mensaje de prueba enviado." });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
