import express from "express";
import axios from "axios";
import fs from "fs";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.INTELLISCREEN_API_KEY;
const CACHE_FILE = "./jobsCache.json";

// Cargar cache inicial
let jobsCache = [];
if (fs.existsSync(CACHE_FILE)) {
  const data = fs.readFileSync(CACHE_FILE, "utf-8");
  jobsCache = JSON.parse(data);
}

// Guardar cache en disco
const saveCache = () => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(jobsCache, null, 2));
};

// Función para consultar la API
const fetchActiveJobs = async () => {
  try {
    const res = await axios.get("https://api.intelliscreen.io/positions", {
      params: {
        page: 1,
        per_page: 100,
        sort_by: "created_at",
        sort_order: "desc",
      },
      headers: {
        Accept: "application/json",
        "X-API-Key": API_KEY,
      },
    });

    // Filtrar solo vacantes activas
    const activeJobs = res.data.positions.filter(
      (job) => job.status === "active"
    );

    // Filtrar las que no están en cache
    const newJobs = activeJobs.filter(
      (job) => !jobsCache.find((j) => j.id === job.id)
    );

    if (newJobs.length > 0) {
      console.log("Nuevas vacantes encontradas:", newJobs.length);

      // Aquí iría la lógica de envío a Telegram/Waha/Slack
      newJobs.forEach((job) => {
        console.log(`Enviar: ${job.job_title} -> ${job.invitation_link}`);
        // sendToTelegram(job);
        // sendToWaha(job);
        // sendToSlack(job);
      });

      // Guardar en cache
      jobsCache.push(...newJobs);
      saveCache();
    } else {
      console.log("No hay vacantes nuevas.");
    }
  } catch (err) {
    console.error("Error al consultar Intelliscreen:", err.message);
  }
};

// Cron job cada hora
cron.schedule("0 * * * *", fetchActiveJobs);

// Cron job para limpiar cache cada 24h
cron.schedule("0 0 * * *", () => {
  console.log("Limpiando cache de vacantes...");
  jobsCache = [];
  saveCache();
});

// Endpoint manual
app.get("/check-jobs", async (req, res) => {
  await fetchActiveJobs();
  res.send({ status: "ok", message: "Consulta ejecutada" });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
