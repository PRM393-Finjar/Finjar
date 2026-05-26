#!/usr/bin/env node
/**
 * Tạo user test trên BE (Swagger: username, email, password, firstName, lastName).
 * In ra block copy-paste vào .env.local.
 */
const host = (process.env.E2E_API_URL ?? "https://personal-finance-management-api.onrender.com").replace(
  /\/+$/,
  "",
);

const u = `fe_e2e_${Date.now()}`;
const payload = {
  username: u,
  email: `${u}@test.finjar.local`,
  password: "FeE2e!a1b2c3",
  firstName: "FE",
  lastName: "E2E",
};

const res = await fetch(`${host}/api/v1/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await res.text();
if (!res.ok) {
  console.error("HTTP:", res.status);
  console.error(text);
  process.exit(1);
}

const email = `${u}@test.finjar.local`;
console.log(`
# Thêm vào .env.local (demo hybrid — chỉ auth thật):
VITE_DEV_API_PROXY=true
VITE_DEMO_HYBRID_AUTH_ONLY=true
VITE_FORCE_MOCK=false

# Hoặc full BE (khi route đã thống nhất):
# VITE_USE_REAL_AUTH=true

VITE_DEV_PREFILL_LOGIN_EMAIL=${email}
VITE_DEV_PREFILL_LOGIN_PASSWORD=FeE2e!a1b2c3
`);
