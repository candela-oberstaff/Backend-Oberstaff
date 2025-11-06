import express from "express";
import logger from "../../logger.js";
import { Job } from "../models/Job.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "./notifiers.js";

const router = express.Router();

router.get("/", (req, res) => res.send("✅ Backend funcionando correctamente"));

// 📦 Consultar todas las vacantes activas
router.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.findActive();
    res.status(200).json({ status: "ok", total: jobs.length, jobs });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🔁 Reenviar manualmente vacantes actuales por WhatsApp
router.post("/resend-whatsapp", async (req, res) => {
  try {
    const jobs = await Job.findActive();
    if (!jobs.length)
      return res.status(404).json({ status: "error", message: "No hay vacantes activas." });

    logger.info(`📤 Enviando ${jobs.length} vacantes activas por WhatsApp...`);
    await sendJobsToWhatsApp({ positions: jobs });
    await sendJobsToTelegram(jobs);

    res.json({ status: "ok", message: `Se reenviaron ${jobs.length} vacantes.` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🧪 Test de envío de mensaje
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

    await sendJobsToWhatsApp({ positions: testJob });
    await sendJobsToTelegram(testJob);

    res.json({ status: "ok", message: "Mensaje de prueba enviado." });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 🧪 Test completo del flujo (crear vacante falsa y enviar a workflows)
router.post("/api/test-flow", async (req, res) => {
  try {
    const fakeJob = {
      id: `test-${Date.now()}`,
      job_title: "Desarrollador/a Frontend React",
      title: "Desarrollador/a Frontend React",
      company_name: "Empresa Demo",
      location: "Remoto",
      type: "Full-time",
      total_candidates: 3,
      invitation_link: "https://ejemplo.com/postula",
      tests: [{ name: "Test técnico básico" }],
      status: "active",
      created_at: new Date(),
    };

    // 1️⃣ Guardar en la DB (si no existe)
    await Job.create(fakeJob);

    // 2️⃣ Enviar a Zapier y n8n
    const workflows = [
      process.env.WORKFLOW_WEBHOOK_ZAPIER,
      process.env.WORKFLOW_WEBHOOK_N8N,
    ].filter(Boolean);

    for (const url of workflows) {
      try {
        await axios.post(url, { jobs: [fakeJob] });
        logger.info(`✅ Enviado correctamente a workflow: ${url}`);
      } catch (err) {
        logger.error(`❌ Error notificando workflow ${url}: ${err.message}`);
      }
    }

    res.status(200).json({
      status: "ok",
      message: "Vacante de prueba enviada a los workflows correctamente.",
      job: fakeJob,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
