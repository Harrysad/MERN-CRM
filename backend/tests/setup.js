const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../app/models/UserModel");
const AUTH_COOKIE = "AuthToken";

const getAuthToken = (loginRes) => {
  const pair = loginRes.headers["set-cookie"]
    .map((cookie) => cookie.split(";")[0])
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE}=`));
  return pair.slice(AUTH_COOKIE.length + 1);
};

const withAuth = (token) => (req) =>
  req
    .set("Cookie", `${AUTH_COOKIE}=${token}`)
    .set("X-Requested-With", "XMLHttpRequest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await Promise.all(
    mongoose.modelNames().map((name) => mongoose.model(name).init()),
  );
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}

async function verifyUser(email) {
  await User.findOneAndUpdate({ email }, { verified: true });
}

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
  verifyUser,
  getAuthToken,
  withAuth,
};
