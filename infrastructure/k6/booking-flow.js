import http from "k6/http";
import { check, sleep } from "k6";

// Usage:
//   BASE_URL=http://localhost k6 run infrastructure/k6/booking-flow.js
// Log in first and provide TOKEN to exercise authenticated reads:
//   BASE_URL=... TOKEN=... k6 run infrastructure/k6/booking-flow.js

export const options = {
  scenarios: {
    catalog_browse: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "15s", target: 20 },
        { duration: "30s", target: 20 },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost";
const TOKEN = __ENV.TOKEN || "";

const headers = {
  Accept: "application/json",
};

if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

export default function () {
  const list = http.get(`${BASE}/api/barbershop`, { headers });
  check(list, {
    "catalog list 200": (r) => r.status === 200,
  });

  const shops = list.json();
  const shop = Array.isArray(shops) && shops.length > 0 ? shops[0] : null;

  if (shop) {
    const detail = http.get(`${BASE}/api/barbershop/${shop.id}`, { headers });
    check(detail, {
      "catalog detail 200": (r) => r.status === 200,
    });
  }

  if (TOKEN) {
    const me = http.get(`${BASE}/api/me`, { headers });
    check(me, { "identity /me 200": (r) => r.status === 200 });

    const bookings = http.get(`${BASE}/api/bookings`, { headers });
    check(bookings, { "booking list 200": (r) => r.status === 200 || r.status === 403 });
  }

  sleep(1);
}
