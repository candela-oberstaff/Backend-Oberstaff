import { pool } from "../db/postgresClient.js";
import { sendJobsToWhatsApp } from "../jobs/notifiers.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    try {
        console.log("🔍 Consultando vacantes en la base de datos...");
        const { rows: jobs } = await pool.query("SELECT * FROM jobs");

        if (jobs.length === 0) {
            console.log("⚠️ No se encontraron vacantes en la tabla 'jobs'.");
            process.exit(0);
        }

        console.log(`📦 Se encontraron ${jobs.length} vacantes. Enviando a WhatsApp...`);

        // Adaptar estructura si es necesario, pero los nombres de columna coinciden
        await sendJobsToWhatsApp({ positions: jobs });

        console.log("✅ Proceso terminado.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error ejecutando el script:", err);
        process.exit(1);
    }
};

run();
