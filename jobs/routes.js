import express from "express";
import { fetchActiveJobs } from "./fetcher.js";
import { getJobsCache, addJobsToCache, setJobsCache } from "./cache.js";
import axios from "axios";
import logger from "../logger.js";

const router = express.Router();


router.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});

// Obtener todas las vacantes del cache
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

// Consultar nuevas vacantes manualmente
router.get("/check-jobs", async (req, res) => {
  try {
    logger.info("Iniciando consulta de empleos...");
    const beforeCount = getJobsCache().length;
    logger.info(`Consulta exitosa. Se encontraron ${jobs.length} empleos.`);
    const newJobs = await fetchActiveJobs();
    const newCount = newJobs.length;

    res.json({
      status: "ok",
      message: newCount > 0
        ? `Se agregaron ${newCount} nuevas vacantes`
        : "No hay vacantes nuevas",
      jobs: newJobs,
    });
  } catch (err) {
    logger.error(`Error al consultar empleos: ${err.message}`);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Forzar actualización desde API sin cron
router.get("/new-jobs", async (req, res) => {
  try {
    const resAPI = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: { Accept: "application/json", "X-API-Key": process.env.INTELLISCREEN_API_KEY },
    });

    const activeJobs = resAPI.data.positions.filter((job) => job.status === "active");
    const newJobs = activeJobs.filter((job) => !getJobsCache().find((j) => j.id === job.id));

    if (newJobs.length > 0) {
      addJobsToCache(newJobs);
    }

    res.json({ newJobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
