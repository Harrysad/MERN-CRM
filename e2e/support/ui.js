const loginViaUi = async (page, { email, password }) => {
  await page.goto("/Home");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await page.waitForURL((url) => url.pathname === "/");
};

const fillCustomerForm = async (page, customer) => {
  await page.locator('input[name="name"]').fill(customer.name);
  await page.locator('input[name="nip"]').fill(customer.nip);
  await page.locator('input[name="address.street"]').fill(customer.address.street);
  await page.locator('input[name="address.suite"]').fill(customer.address.suite);
  await page.locator('input[name="address.city"]').fill(customer.address.city);
  await page
    .locator('input[name="address.postcode"]')
    .fill(customer.address.postcode);
};

module.exports = { loginViaUi, fillCustomerForm };
