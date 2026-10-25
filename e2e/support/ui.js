const loginViaUi = async (page, { email, password }) => {
  await page.goto("/Home");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page.waitForURL((url) => url.pathname === "/");
};

module.exports = { loginViaUi };
