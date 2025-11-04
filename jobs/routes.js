import express from "express";
import axios from "axios";
import logger from "../logger.js";
import { fetchActiveJobs } from "./fetcher.js";
import { getJobsCache, addJobsToCache } from "./cache.js";
import { sendJobsToWhatsApp, sendJobsToTelegram } from "../utils/notifiers.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});

router.get("/api/jobs", (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      total: getJobsCache().length,
      jobs: getJobsCache(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/check-jobs", async (req, res) => {
  try {
    logger.info("🔍 Iniciando verificación de nuevas vacantes...");

    const oldJobs = getJobsCache();
    const oldIds = new Set(oldJobs.map((j) => j.id));

    const resAPI = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: {
        Accept: "application/json",
        "X-API-Key": process.env.INTELLISCREEN_API_KEY,
      },
    });

    const activeJobs = resAPI.data.positions.filter(
      (job) => job.status === "active"
    );

    const newJobs = activeJobs.filter((job) => !oldIds.has(job.id));

    if (newJobs.length > 0) {
      logger.info(`✅ Se detectaron ${newJobs.length} nuevas vacantes.`);

      addJobsToCache(newJobs);

      await sendJobsToWhatsApp(newJobs);
      await sendJobsToTelegram(newJobs);

      res.json({
        status: "ok",
        message: `Se enviaron ${newJobs.length} nuevas vacantes.`,
        newJobs,
      });
    } else {
      logger.info("No hay vacantes nuevas. No se envía nada.");
      res.json({
        status: "ok",
        message: "No hay vacantes nuevas.",
        jobs: oldJobs,
      });
    }
  } catch (err) {
    logger.error(`❌ Error en check-jobs: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/new-jobs", async (req, res) => {
  try {
    const resAPI = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: { Accept: "application/json", "X-API-Key": process.env.INTELLISCREEN_API_KEY },
    });

    const activeJobs = resAPI.data.positions.filter((job) => job.status === "active");
    const newJobs = activeJobs.filter((job) => !getJobsCache().find((j) => j.id === job.id));

    if (newJobs.length > 0) addJobsToCache(newJobs);

    res.json({ newJobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de prueba para WhatsApp
router.post("/test-whatsapp", async (req, res) => {
  try {
    const { to, message } = req.body;
    const URL = `${process.env.WAHA_URL}/api/sendText`;

    const response = await axios.post(
      URL,
      { chatId: to, text: message, session: "default" },
      {
        headers: {
          "x-api-key": process.env.WAHA_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ status: "ok", response: response.data });
  } catch (error) {
    console.error("Error test WAHA:", error.response?.data || error.message);
    res
      .status(500)
      .json({ status: "error", error: error.response?.data || error.message });
  }
});

export default router;
