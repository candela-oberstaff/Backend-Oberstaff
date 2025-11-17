import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./src/jobs/routes.js";
import { sendNewJobsFlow } from "./src/jobs/autoSender.js";
import logger from "./logger.js";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

// 🔍 Identificador único para este proceso
const INSTANCE_ID = Math.random().toString(36).slice(2, 9);
logger.info(`🚀 Backend iniciado | Instance ID: ${INSTANCE_ID}`);


// ╔═══════════════════════════════════════
// ║ CRON: Verificación de vacantes nuevas
// ╚═══════════════════════════════════════
cron.schedule("*/30 * * * *", async () => {
  logger.info(`⏰ [CRON 30min | ${INSTANCE_ID}] Iniciando verificación...`);

  try {
    const start = Date.now();
    logger.info(`🔍 [${INSTANCE_ID}] Ejecutando sendNewJobsFlow()`);

    await sendNewJobsFlow();

    const duration = Date.now() - start;
    logger.info(`✅ [${INSTANCE_ID}] Flujo finalizado (${duration}ms)`);

  } catch (err) {
    logger.error(`❌ [${INSTANCE_ID}] Error en CRON 30min: ${err.message}`);
    logger.debug(err.stack);
  }
});


// ╔═══════════════════════════════════════
// ║ CRON: Reset de cache diario
// ╚═══════════════════════════════════════
cron.schedule("0 0 * * *", () => {
  logger.info(`🧹 [CRON Daily | ${INSTANCE_ID}] Limpiando cache...`);
  try {
    fs.writeFileSync("./jobsSentCache.json", "[]");
    logger.info(`🗃️ [${INSTANCE_ID}] Cache limpiado.`);
  } catch (err) {
    logger.error(`❌ Error limpiando cache: ${err.message}`);
    logger.debug(err.stack);
  }
});


// ╔═══════════════════════════════════════
// ║ Servidor HTTP
// ╚═══════════════════════════════════════
app.listen(PORT, () => {
  logger.info(`🌐 Servidor corriendo en http://localhost:${PORT}`);
  logger.info(`🆔 Instance ID activo: ${INSTANCE_ID}`);
});
