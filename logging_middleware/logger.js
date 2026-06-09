const axios = require('axios');

const TEST_SERVER = 'http://4.224.186.213/evaluation-service';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsImV4cCI6MTc4MDk5MDIzNSwiaWF0IjoxNzgwOTg5MzM1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYzBmZDgyMTItZWU1MC00YzFkLWJhOTAtMmQ4OWUwNTM5YjI1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhYmhhdCBrdW1hciBtYXVyeWEiLCJzdWIiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkifSwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsIm5hbWUiOiJwcmFiaGF0IGt1bWFyIG1hdXJ5YSIsInJvbGxObyI6IjIzMDAzMjE1NDAxMzYiLCJhY2Nlc3NDb2RlIjoiY1h1cWh0IiwiY2xpZW50SUQiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkiLCJjbGllbnRTZWNyZXQiOiJOcWZCbm1uRWZIZXZ1bmVkIn0.ut-_f4AeEA9feDE2scETgsEEM9y2En_HhzNLHxMPdxI'
async function log(stack, level, packageName, message) {
    try {
        await axios.post(`${TEST_SERVER}/logs`, {
            stack: stack,
            level: level,
            package: packageName,
            message: message
        }, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log(`[${level.toUpperCase()}] [${packageName}] ${message}`);
    } catch (err) {
        console.error('Logging failed:', err.message);
    }
}

module.exports = log;