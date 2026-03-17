import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const WAHA_URL = process.env.WAHA_URL;
const API_KEY = process.env.WAHA_API_KEY;

async function checkStatus() {
    try {
        console.log(`Checking WAHA status at ${WAHA_URL}...`);

        // Check sessions
        const sessionsRes = await axios.get(`${WAHA_URL}/api/sessions`, {
            headers: { "x-api-key": API_KEY }
        });
        console.log("Sessions:", JSON.stringify(sessionsRes.data, null, 2));

    } catch (error) {
        console.error("Error checking status:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

checkStatus();
