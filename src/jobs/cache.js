import fs from "fs";

import { sendJobsToWhatsApp } from "./notifiers.js";
import logger from "../../logger.js";

const CACHE_FILE = "./jobsCache.json";

let jobsCache = [];
if (fs.existsSync(CACHE_FILE)) {
  const data = fs.readFileSync(CACHE_FILE, "utf-8");
  jobsCache = JSON.parse(data);
}

export const getJobsCache = () => jobsCache;

export const setJobsCache = (newJobs) => {
  jobsCache = newJobs;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(jobsCache, null, 2));
};

export const addJobsToCache = (newJobs) => {
  jobsCache.push(...newJobs);
  setJobsCache(jobsCache);
};

export const sendNewJobsWhatsApp = async () => {
  const jobs = getJobsCache();

  if (jobs.length === 0) {
    logger.info("📭 No hay vacantes en cache para enviar.");
    return;
  }

  logger.info(`📤 Enviando ${jobs.length} vacantes del cache por WhatsApp...`);
  await sendJobsToWhatsApp(jobs);
};
