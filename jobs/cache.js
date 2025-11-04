import fs from "fs";

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
