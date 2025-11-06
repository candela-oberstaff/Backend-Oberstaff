import { pool } from "../db/postgresClient.js";

export const Job = {
  async findActive() {
    const { rows } = await pool.query(
      "SELECT * FROM jobs WHERE status = $1 ORDER BY created_at DESC",
      ["active"]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    return rows[0];
  },

  async create(job) {
    const query = `
      INSERT INTO jobs (
        id, job_title, title, company_name, location, type,
        total_candidates, invitation_link, tests, status, created_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      ON CONFLICT (id) DO NOTHING;
    `;
    const values = [
      job.id,
      job.job_title,
      job.title,
      job.company_name,
      job.location,
      job.type,
      job.total_candidates,
      job.invitation_link,
      JSON.stringify(job.tests || []),
      job.status,
      job.created_at || new Date(),
    ];
    await pool.query(query, values);
  },
};
