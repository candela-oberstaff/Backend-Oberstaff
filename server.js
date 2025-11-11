import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./src/jobs/routes.js";
import { sendNewJobsFlow } from "./src/jobs/autoSender.js";
import { setJobsCache } from "./src/jobs/cache.js";
import logger from "./logger.js";
import { pool } from "./src/db/postgresClient.js";


dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

cron.schedule("*/30 * * * *", async () => {
  logger.info("⏰ Cron ejecutando verificación de vacantes cada 30 minutos...");
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
