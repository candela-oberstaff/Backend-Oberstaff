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

// **********************************************
// * NUEVA FUNCIÓN: GUARDAR VACANTES EN LA TABLA JOBS
// **********************************************
export const saveJobs = async (jobs) => {
  if (!jobs.length) return;

  // Creamos el query para insertar múltiples registros.
  const queryParts = jobs.map((job, index) => {
    // Definimos el índice inicial para los parámetros ($1, $2, $3, ...)
    const baseIndex = index * 7;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
  }).join(", ");

  // Aplanamos todos los valores para el array de parámetros
  const values = jobs.flatMap(job => [
    job.id,
    job.name, // El campo de Intelliscreen se llama 'name', lo insertamos en 'job_title'
    job.status,
    job.created_at,
    job.total_candidates,
    JSON.stringify(job.tests), // Aseguramos que el JSON se inserte como texto para jsonb
    job.invite_url // El campo de Intelliscreen se llama 'invite_url', lo insertamos en 'invitation_link'
  ]);

  const insertQuery = `
    INSERT INTO jobs (
        id,
        job_title,
        status,
        created_at,
        total_candidates,
        tests,
        invitation_link
    )
    VALUES ${queryParts}
    ON CONFLICT (id) DO NOTHING;
  `;

  await pool.query(insertQuery, values);
};