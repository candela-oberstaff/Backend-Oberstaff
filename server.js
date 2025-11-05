import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./jobs/routes.js";
import { sendNewJobsFlow } from "./jobs/autoSender.js";
import { setJobsCache } from "./jobs/cache.js";
import logger from "./logger.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

cron.schedule("0 * * * *", async () => {
  logger.info("⏰ Cron ejecutando verificación de vacantes...");
  await sendNewJobsFlow();
});

cron.schedule("0 0 * * *", () => {
  logger.info("🧹 Limpiando cache de vacantes...");
  setJobsCache([]);
  logger.info("🗃️ Cache limpiado correctamente.");
});

app.listen(PORT, () => {
  logger.info(`✅ Backend corriendo en http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => logger.error(`💥 Excepción no capturada: ${err.message}`));
process.on("unhandledRejection", (reason) => logger.error(`⚠️ Promesa rechazada: ${reason}`));
