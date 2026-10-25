const { test, expect } = require("@playwright/test");
const { API_URL } = require("../support/env");
const { createUser } = require("../support/users");
const { markVerified } = require("../support/db");
const { loginViaUi } = require("../support/ui");

const fillSignup = async (page, { name, email, password }) => {
  await page.goto("/Home");
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Zarejestruj się" }).click();
};

test.describe("signup", () => {
  test("shows a confirmation dialog after registering", async ({ page }) => {
    await fillSignup(page, {
      name: "Jan Kowalski",
      email: `signup-${Date.now()}-${process.pid}@example.com`,
      password: "password123",
    });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Konto zostało utworzone");
    await expect(dialog).toContainText("Wysłaliśmy link aktywacyjny");
  });

  test("reports an email address that is already taken", async ({
    page,
    request,
  }) => {
    const existing = await createUser(request, { label: "taken" });

    await fillSignup(page, {
      name: "Ktoś inny",
      email: existing.email,
      password: "password123",
    });

    await expect(
      page.getByText("Konto z tym adresem e-mail już istnieje."),
    ).toBeVisible();
  });
});

test.describe("login", () => {
  test("rejects a wrong password", async ({ page, request }) => {
    const user = await createUser(request, { label: "wrong" });

    await page.goto("/Home");
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill("not-the-password");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    await expect(
      page.getByText("Nieprawidłowy e-mail lub hasło."),
    ).toBeVisible();
  });

  test("shows the verification banner until the account is verified", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, {
      label: "unverified",
      verified: false,
    });

    await loginViaUi(page, user);
    await expect(page.getByRole("alert")).toContainText(
      "Potwierdź adres e-mail",
    );

    await markVerified(user.email);
    await page.goto("/");

    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});

test.describe("session", () => {
  test("keeps the session token away from scripts", async ({
    page,
    context,
    request,
  }) => {
    const user = await createUser(request, { label: "cookie" });
    await loginViaUi(page, user);

    const cookies = await context.cookies();
    const session = cookies.find((cookie) => cookie.name === "AuthToken");
    expect(session.httpOnly).toBe(true);

    const visibleToScripts = await page.evaluate(() => document.cookie);
    expect(visibleToScripts).not.toContain("AuthToken");
    expect(visibleToScripts).not.toContain("jwt");
  });

  test("logging out revokes the token on the server", async ({
    page,
    context,
    request,
  }) => {
    const user = await createUser(request, { label: "logout" });
    await loginViaUi(page, user);

    const cookies = await context.cookies();
    const token = cookies.find((cookie) => cookie.name === "AuthToken").value;

    const logoutResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/auth/logout") &&
        response.request().method() === "POST",
    );
    await page.locator("a.crm-navbar__logout").click();
    await logoutResponse;
    await expect(page).toHaveURL(/\/home$/i);

    const res = await request.get(`${API_URL}/customers`, {
      headers: { Cookie: `AuthToken=${token}` },
    });
    expect(res.status()).toBe(401);
  });

  test("an expired session returns the user to the login page", async ({
    page,
    context,
    request,
  }) => {
    const user = await createUser(request, { label: "expired" });
    await loginViaUi(page, user);

    await context.clearCookies({ name: "AuthToken" });
    await page.reload();

    await expect(page).toHaveURL(/\/home$/i);
  });
});
