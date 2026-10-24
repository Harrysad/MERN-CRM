const COOKIE_NAME = "AuthToken";
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

module.exports = { COOKIE_NAME, COOKIE_MAX_AGE_MS, getAuthCookieOptions };
