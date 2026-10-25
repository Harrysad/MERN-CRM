const { test, expect } = require("@playwright/test");
const { API_URL } = require("../support/env");
const { createUser } = require("../support/users");
const { sampleCustomer } = require("../support/customers");
const { loginViaUi, fillCustomerForm } = require("../support/ui");

test.describe("accounts that cannot write", () => {
  test("a viewer account is told it is read-only, in the interface and in the API", async ({
    page,
    request,
  }) => {
    const viewer = await createUser(request, { label: "viewer", role: "viewer" });
    await loginViaUi(page, viewer);

    await expect(page.locator(".crm-viewer-banner")).toContainText(
      "tylko do odczytu",
    );

    await page.getByRole("link", { name: "Dodaj klienta" }).click();
    await fillCustomerForm(page, sampleCustomer());
    await page.getByRole("button", { name: "Dodaj klienta" }).click();

    await expect(page.locator(".alert-danger")).toContainText(
      "tylko do odczytu",
    );
    await expect(page).toHaveURL(/\/customers\/add$/);

    const res = await page.request.post(`${API_URL}/customers/add`, {
      headers: { "X-Requested-With": "XMLHttpRequest" },
      data: sampleCustomer(),
    });
    expect(res.status()).toBe(403);
  });

  test("an unverified account is asked to confirm the email address before saving", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, {
      label: "unverified-write",
      verified: false,
    });
    await loginViaUi(page, user);

    await page.getByRole("link", { name: "Dodaj klienta" }).click();
    await fillCustomerForm(page, sampleCustomer());
    await page.getByRole("button", { name: "Dodaj klienta" }).click();

    await expect(page.locator(".alert-danger")).toContainText(
      "Potwierdź adres e-mail, aby móc zapisywać zmiany",
    );
    await expect(page).toHaveURL(/\/customers\/add$/);
  });
});
