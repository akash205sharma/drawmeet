const axios = require("axios");

const client = axios.create({
    baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
    timeout: 60000,
});

async function generateDiagram(prompt) {

    const { data } = await client.post(
        "/diagram/generate",
        {
            prompt,
        }
    );

    return data;
}

module.exports = {
    generateDiagram,
};