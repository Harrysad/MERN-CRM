const API_PORT = 5071;
const APP_PORT = 5174;

module.exports = {
  API_PORT,
  APP_PORT,
  API_URL: `http://localhost:${API_PORT}`,
  APP_URL: `http://localhost:${APP_PORT}`,
  MONGO_URL: process.env.E2E_MONGO_URL || "mongodb://127.0.0.1:27017/crm_e2e",
};
