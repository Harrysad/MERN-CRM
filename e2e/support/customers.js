const { API_URL } = require("./env");

const sampleCustomer = (overrides = {}) => ({
  name: "Acme Sp. z o.o.",
  address: {
    street: "Testowa",
    suite: "10",
    city: "Warszawa",
    postcode: "00001",
  },
  nip: "5260250274",
  ...overrides,
});

const createCustomerViaApi = async (request, customer = sampleCustomer()) => {
  const res = await request.post(`${API_URL}/customers/add`, {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    data: customer,
  });
  if (!res.ok()) {
    throw new Error(`Creating a customer failed with status ${res.status()}`);
  }
  return customer;
};

module.exports = { sampleCustomer, createCustomerViaApi };
