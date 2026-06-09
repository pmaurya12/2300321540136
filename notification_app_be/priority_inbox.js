const axios = require('axios');
const log = require('../logging_middleware/logger');

const BASE_URL = 'http://4.224.186.213/evaluation-service';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsImV4cCI6MTc4MDk5MDIzNSwiaWF0IjoxNzgwOTg5MzM1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYzBmZDgyMTItZWU1MC00YzFkLWJhOTAtMmQ4OWUwNTM5YjI1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhYmhhdCBrdW1hciBtYXVyeWEiLCJzdWIiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkifSwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsIm5hbWUiOiJwcmFiaGF0IGt1bWFyIG1hdXJ5YSIsInJvbGxObyI6IjIzMDAzMjE1NDAxMzYiLCJhY2Nlc3NDb2RlIjoiY1h1cWh0IiwiY2xpZW50SUQiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkiLCJjbGllbnRTZWNyZXQiOiJOcWZCbm1uRWZIZXZ1bmVkIn0.ut-_f4AeEA9feDE2scETgsEEM9y2En_HhzNLHxMPdxI'

const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function scoreNotification(n) {
    const weight = WEIGHTS[n.Type] || 1;
    const hoursAgo = (Date.now() - new Date(n.Timestamp).getTime()) / 3600000;
    return weight * (1 / (1 + hoursAgo));
}

async function getPriorityInbox(topN = 10) {
    log("backend", "info", "service", "Fetching notifications");
    const res = await axios.get(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });

    const all = res.data.notifications;
    const scored = all.map(n => ({ ...n, score: scoreNotification(n) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topN);

    log("backend", "info", "domain", `Top ${topN} notifications selected`);
    console.log(`\nTop ${topN} Priority Notifications:`);
    top.forEach((n, i) => {
        console.log(`${i+1}. [${n.Type}] ${n.Message} | Score: ${n.score.toFixed(4)}`);
    });

    return top;
}

getPriorityInbox(10);