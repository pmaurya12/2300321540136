const axios = require('axios');
const log = require('../logging_middleware/logger');

const BASE_URL = 'http://4.224.186.213/evaluation-service';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsImV4cCI6MTc4MDk5MDIzNSwiaWF0IjoxNzgwOTg5MzM1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYzBmZDgyMTItZWU1MC00YzFkLWJhOTAtMmQ4OWUwNTM5YjI1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicHJhYmhhdCBrdW1hciBtYXVyeWEiLCJzdWIiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkifSwiZW1haWwiOiJwcmFiaGF0LjIzYjE1NDExNzJAYWJlcy5hYy5pbiIsIm5hbWUiOiJwcmFiaGF0IGt1bWFyIG1hdXJ5YSIsInJvbGxObyI6IjIzMDAzMjE1NDAxMzYiLCJhY2Nlc3NDb2RlIjoiY1h1cWh0IiwiY2xpZW50SUQiOiJlNWM1YzQzNy1iY2M4LTQxODktODg3OS1lY2E5YTExOWNiMjkiLCJjbGllbnRTZWNyZXQiOiJOcWZCbm1uRWZIZXZ1bmVkIn0.ut-_f4AeEA9feDE2scETgsEEM9y2En_HhzNLHxMPdxI'

async function fetchDepots() {
    log("backend", "info", "service", "Fetching depots");
    const res = await axios.get(`${BASE_URL}/depots`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    return res.data.depots;
}

async function fetchVehicles() {
    log("backend", "info", "service", "Fetching vehicles");
    const res = await axios.get(`${BASE_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    return res.data.vehicles;
}

function knapsack(vehicles, budget) {
    const n = vehicles.length;
    const dp = Array(n + 1).fill(null).map(() => Array(budget + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= budget; w++) {
            if (vehicles[i-1].Duration <= w) {
                dp[i][w] = Math.max(
                    dp[i-1][w],
                    dp[i-1][w - vehicles[i-1].Duration] + vehicles[i-1].Impact
                );
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }

    let w = budget;
    const selected = [];
    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i-1][w]) {
            selected.push(vehicles[i-1]);
            w -= vehicles[i-1].Duration;
        }
    }

    return { maxImpact: dp[n][budget], selectedVehicles: selected };
}

async function main() {
    try {
        log("backend", "info", "service", "Scheduler started");
        const depots = await fetchDepots();
        const vehicles = await fetchVehicles();

        for (const depot of depots) {
            const result = knapsack(vehicles, depot.MechanicHours);
            console.log(`\nDepot: ${depot.ID} | Budget: ${depot.MechanicHours}h | Max Impact: ${result.maxImpact}`);
            result.selectedVehicles.forEach(v => {
                console.log(`  Task: ${v.TaskID} | Duration: ${v.Duration}h | Impact: ${v.Impact}`);
            });
            log("backend", "info", "domain", `Depot ${depot.ID} done. Impact: ${result.maxImpact}`);
        }

        log("backend", "info", "service", "Scheduler completed");
    } catch (err) {
        log("backend", "error", "handler", `Error: ${err.message}`);
    }
}

main();