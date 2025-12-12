import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
// Usamos el número proporcionado por el usuario con el sufijo estándar de WhatsApp
const CHAT_ID = "5492622220383@c.us";

console.log("Configuración:");
console.log("URL:", WAHA_URL);
console.log("API KEY:", WAHA_API_KEY ? "Correctamente leída" : "NO DEFINIDA");
console.log("CHAT ID:", CHAT_ID);

if (!WAHA_URL || !WAHA_API_KEY) {
    console.error("❌ Faltan variables WAHA_URL o WAHA_API_KEY");
    process.exit(1);
}

const run = async () => {
    try {
        // 1. Verificar sesiones
        console.log("\n🔍 Consultando sesiones...");
        const sessionsRes = await axios.get(`${WAHA_URL}/api/sessions`, {
            headers: { "X-Api-Key": WAHA_API_KEY, "Content-Type": "application/json" }
        });
        console.log("📋 Sesiones encontradas:", JSON.stringify(sessionsRes.data, null, 2));

        // 2. Intentar enviar mensaje
        console.log("\n📨 Intentando enviar mensaje a:", CHAT_ID);
        const res = await axios.post(
            `${WAHA_URL}/api/sendText`,
            {
                session: "default",
                chatId: CHAT_ID,
                text: "👋 Hola! Mensaje de prueba de Waha para verificar la nueva API Key.",
            },
            {
                headers: {
                    "X-Api-Key": WAHA_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Mensaje enviado correctamente.");
        console.log("📩 Respuesta:", res.data);

    } catch (error) {
        console.error("❌ Error en la prueba:");
        if (error.response) {
            console.error("📌 Status:", error.response.status);
            console.error("📌 Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("📌 Mensaje:", error.message);
        }
    }
};

run();
