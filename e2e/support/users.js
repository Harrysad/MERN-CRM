const { API_URL } = require("./env");
const { updateUser } = require("./db");

let counter = 0;

const uniqueEmail = (label) =>
  `${label}-${Date.now()}-${process.pid}-${counter++}@example.com`;

const createUser = async (
  request,
  {
    label = "user",
    name = "Jan Kowalski",
    verified = true,
    role = "admin",
  } = {},
) => {
  const email = uniqueEmail(label);
  const password = "password123";

  const res = await request.post(`${API_URL}/auth/signup`, {
    data: { name, email, password },
  });
  if (!res.ok()) {
    throw new Error(`Signup failed with status ${res.status()}`);
  }

  await updateUser(email, { verified, role });

  return { email, password, name };
};

module.exports = { createUser };
