import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./jobs/routes.js";
import { fetchActiveJobs } from "./jobs/fetcher.js";
import { setJobsCache } from "./jobs/cache.js";
import logger from "./logger.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

// ================================
// 🕒 CRON JOBS
// ================================

// 🔁 Cada 1 hora: buscar nuevas vacantes
cron.schedule("0 * * * *", async () => {
  logger.info("⏰ Ejecutando cron de verificación de vacantes...");
  try {
    await fetchActiveJobs();
  } catch (err) {
    logger.error(`❌ Error ejecutando cron de vacantes: ${err.message}`);
  }
});

// 🧹 Cada 24 horas: limpiar cache completamente
cron.schedule("0 0 * * *", () => {
  logger.info("🧹 Limpiando cache de vacantes (24h)...");
  try {
    setJobsCache([]);
    logger.info("🗃️ Cache limpiado correctamente.");
  } catch (err) {
    logger.error(`❌ Error al limpiar cache: ${err.message}`);
  }
});

// ================================
// 🚀 SERVIDOR EXPRESS
// ================================
app.get("/", (req, res) => {
  res.send("✅ Backend funcionando correctamente.");
});

app.listen(PORT, () => {
  logger.info(`✅ Backend corriendo en http://localhost:${PORT}`);
});

// ================================
// 🔐 MANEJO GLOBAL DE ERRORES
// ================================

// Captura errores no manejados
process.on("uncaughtException", (err) => {
  logger.error(`💥 Excepción no capturada: ${err.message}`);
  console.error(err);
});

// Captura promesas rechazadas no manejadas
process.on("unhandledRejection", (reason) => {
  logger.error(`⚠️ Promesa rechazada sin manejar: ${reason}`);
});
