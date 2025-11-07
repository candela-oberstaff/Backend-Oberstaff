import { pool } from "../db/postgresClient.js";

export const Job = {
  async findActive() {
    const { rows } = await pool.query(
      "SELECT * FROM jobs WHERE status = $1 ORDER BY created_at DESC",
      ["Active"]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    return rows[0];
  },

  async getAllIds() {
    const { rows } = await pool.query("SELECT id FROM jobs");
    return rows.map(r => r.id);
  },

  async create(job) {
    const query = `
      INSERT INTO jobs (
        id, type, name, job_title, status,
        created_at, total_candidates, tests, invitation_link
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO NOTHING;
    `;
    const values = [
      job.id,
      job.type,
      job.name,
      job.job_title,
      job.status || "Active",
      job.created_at ? new Date(job.created_at) : new Date(),
      job.total_candidates || 0,
      JSON.stringify(job.tests || []),
      job.invitation_link || null,
    ];
    await pool.query(query, values);
  },
};
