import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const WAHA_URL = process.env.WAHA_URL;
const CHAT_ID = process.env.WHATSAPP_CHAT_ID;
const API_KEY = process.env.WAHA_API_KEY;

console.log(`URL: ${WAHA_URL}`);
console.log(`CHAT_ID: ${CHAT_ID}`);
console.log(`API_KEY provided: ${!!API_KEY}`);

async function sendTest() {
    const message = "🔔 Test message from backend-vacantes";
    try {
        console.log("Sending to WhatsApp...");
        console.log(`Endpoint: ${WAHA_URL}/api/sendText`);

        const res = await axios.post(
            `${WAHA_URL}/api/sendText`,
            {
                session: "default",
                chatId: CHAT_ID,
                text: message,
            },
            {
                headers: {
                    "x-api-key": API_KEY, // Note: some WAHA versions use 'X-Api-Key' or different auth methods
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("✅ Response status:", res.status);
        console.log("Response data:", res.data);
    } catch (error) {
        console.error("❌ Error sending:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        } else if (error.request) {
            console.error("No response received");
        }
    }
}

sendTest();
