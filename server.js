import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./src/jobs/routes.js";
import { sendNewJobsFlow } from "./src/jobs/autoSender.js";
import logger from "./logger.js";


dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;


cron.schedule("*/30 * * * *", async () => {
  logger.info("⏰ Ejecutando flujo de vacantes nuevas cada 30 minutos...");
  await sendNewJobsFlow();
});

cron.schedule("0 0 * * *", () => {
  logger.info("🧹 Limpiando cache de vacantes enviadas...");
  fs.writeFileSync("./jobsSentCache.json", "[]");
  logger.info("🗃️ Cache limpiado correctamente.");
});


app.listen(PORT, () => {
  logger.info(`✅ Backend corriendo en http://localhost:${PORT}`);
});
