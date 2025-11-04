import axios from "axios";
import { getJobsCache, addJobsToCache, setJobsCache } from "./cache.js";

const API_KEY = process.env.INTELLISCREEN_API_KEY;

export const sendToWaha = async (job) => {
  try {
    const text = `🧑‍💼 *${job.job_title}*\n📍 ${job.location || "Sin ubicación"}\n🔗 ${job.invitation_link || "Sin enlace"}`;
    await axios.post(process.env.WAHA_URL, {
      phone: process.env.WAHA_PHONE,
      message: text,
    });
  } catch (error) {
    console.error("Error enviando a WhatsApp (Waha):", error.message);
  }
};

export const fetchActiveJobs = async () => {
  try {
    const res = await axios.get("https://api.intelliscreen.io/positions", {
      params: { page: 1, per_page: 100, sort_by: "created_at", sort_order: "desc" },
      headers: { Accept: "application/json", "X-API-Key": API_KEY },
    });

    const activeJobs = res.data.positions.filter((job) => job.status === "active");
    const currentCache = getJobsCache();
    const newJobs = activeJobs.filter((job) => !currentCache.find((j) => j.id === job.id));

    if (newJobs.length > 0) {
      console.log("Nuevas vacantes encontradas:", newJobs.length);
      for (const job of newJobs) {
        console.log(`Enviar: ${job.job_title} -> ${job.invitation_link}`);
        await sendToWaha(job);
      }
      addJobsToCache(newJobs);
    } else {
      console.log("No hay vacantes nuevas.");
    }
    return newJobs;
  } catch (err) {
    console.error("Error al consultar Intelliscreen:", err.message);
    return [];
  }
};
