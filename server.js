import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import router from "./jobs/routes.js";
import { fetchActiveJobs } from "./jobs/fetcher.js";
import { setJobsCache } from "./jobs/cache.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3001;

cron.schedule("0 * * * *", fetchActiveJobs);

// Cron job para limpiar cache cada 24h
cron.schedule("0 0 * * *", () => {
  console.log("Limpiando cache de vacantes...");
  setJobsCache([]);
});

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
