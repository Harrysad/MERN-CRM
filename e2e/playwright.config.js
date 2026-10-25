const { defineConfig, devices } = require("@playwright/test");
const { API_PORT, APP_PORT, APP_URL, MONGO_URL } = require("./support/env");

module.exports = defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./support/globalSetup"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "node server.js",
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/openapi.json`,
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(API_PORT),
        MONGO_URL,
        JWT_SECRET: "e2e-secret",
        FRONTEND_URL: APP_URL,
        RESEND_API_KEY: "",
      },
    },
    {
      command: `npm run build && npm run preview -- --port ${APP_PORT} --strictPort`,
      cwd: "../frontend",
      url: APP_URL,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        VITE_API_URL: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
