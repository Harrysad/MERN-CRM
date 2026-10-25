const { test, expect } = require("@playwright/test");
const { API_URL, APP_URL } = require("../support/env");
const { createUser } = require("../support/users");
const {
  sampleCustomer,
  createCustomerViaApi,
} = require("../support/customers");
const { loginViaUi, fillCustomerForm } = require("../support/ui");

const customerRow = (page, name) => page.getByRole("row", { name });

test.describe("customers", () => {
  test("fills in the company data from the NIP lookup and saves the customer", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, { label: "nip" });
    await loginViaUi(page, user);

    const corsHeaders = {
      "access-control-allow-origin": APP_URL,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type,x-requested-with",
    };
    await page.route("**/nip/5260250274", (route) => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers: corsHeaders });
      }
      return route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify({
          name: "Acme Sp. z o.o.",
          address: {
            street: "Testowa",
            suite: "10",
            city: "Warszawa",
            postcode: "00-001",
          },
        }),
      });
    });

    await page.getByRole("link", { name: "Dodaj klienta" }).click();
    await page.locator('input[name="nip"]').fill("5260250274");
    await page.getByRole("button", { name: "Wyszukaj dane firmy" }).click();

    await expect(page.locator('input[name="name"]')).toHaveValue(
      "Acme Sp. z o.o.",
    );
    await expect(page.locator('input[name="address.street"]')).toHaveValue(
      "Testowa",
    );

    await page.getByRole("button", { name: "Dodaj klienta" }).click();

    const row = customerRow(page, "Acme Sp. z o.o.");
    await expect(row).toBeVisible();
    await expect(row).toContainText("526-025-02-74");
  });

  test("edits and deletes a customer", async ({ page, request }) => {
    const user = await createUser(request, { label: "crud" });
    await loginViaUi(page, user);
    await createCustomerViaApi(page.request);
    await page.goto("/");

    await customerRow(page, "Acme Sp. z o.o.").getByTitle("Edytuj").click();

    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("Acme Sp. z o.o.");
    await nameInput.fill("Beta Sp. z o.o.");
    await page.getByRole("button", { name: "Zapisz zmiany" }).click();

    await expect(customerRow(page, "Beta Sp. z o.o.")).toBeVisible();
    await expect(customerRow(page, "Acme Sp. z o.o.")).toHaveCount(0);

    await customerRow(page, "Beta Sp. z o.o.").getByTitle("Usuń").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Usuń" })
      .click();

    await expect(customerRow(page, "Beta Sp. z o.o.")).toHaveCount(0);
    await expect(page.getByText("0 klientów łącznie")).toBeVisible();
  });

  test("rejects a NIP that already exists in the account", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, { label: "duplicate" });
    await loginViaUi(page, user);
    await createCustomerViaApi(page.request);

    await page.getByRole("link", { name: "Dodaj klienta" }).click();
    await fillCustomerForm(page, sampleCustomer({ name: "Inna Firma" }));
    await page.getByRole("button", { name: "Dodaj klienta" }).click();

    await expect(page.locator(".alert-danger")).toContainText(
      "Podany NIP już istnieje w bazie danych.",
    );
  });

  test("does not show the customers of another account", async ({
    page,
    browser,
    request,
  }) => {
    const owner = await createUser(request, { label: "owner" });
    const other = await createUser(request, { label: "other" });

    await loginViaUi(page, owner);
    await createCustomerViaApi(page.request);
    await page.goto("/");
    await expect(customerRow(page, "Acme Sp. z o.o.")).toBeVisible();

    const otherContext = await browser.newContext({ baseURL: APP_URL });
    const otherPage = await otherContext.newPage();
    await loginViaUi(otherPage, other);

    await expect(otherPage.getByText("0 klientów łącznie")).toBeVisible();
    await expect(customerRow(otherPage, "Acme Sp. z o.o.")).toHaveCount(0);

    const res = await otherPage.request.get(`${API_URL}/customers`);
    expect((await res.json()).total).toBe(0);

    await otherContext.close();
  });

  test("rejects a write request that does not carry the CSRF header", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, { label: "csrf" });
    await loginViaUi(page, user);

    const res = await page.request.post(`${API_URL}/customers/add`, {
      data: sampleCustomer(),
    });

    expect(res.status()).toBe(403);
  });
});
