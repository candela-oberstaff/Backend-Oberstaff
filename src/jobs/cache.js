import { pool } from "../db/postgresClient.js";

// Verifica si un job ya fue enviado (se mantiene)
export const isSent = async (jobId) => {
  const { rows } = await pool.query(
    "SELECT 1 FROM jobs_sent_cache WHERE job_id = $1",
    [jobId]
  );
  return rows.length > 0;
};

// Marca jobs como enviados (se mantiene)
export const markAsSent = async (jobs) => {
  if (!jobs.length) return;
  const values = jobs.map(job => `('${job.id}', NOW())`).join(", ");
  await pool.query(
    `INSERT INTO jobs_sent_cache (job_id, sent_at) VALUES ${values} ON CONFLICT (job_id) DO NOTHING`
  );
};

// saveJobs was removed since it's no longer syncing from Intelliscreen