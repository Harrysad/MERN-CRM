const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../app/models/UserModel");
const requireWriteAccess = require("../app/middlewares/requireWriteAccess");

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

module.exports = { connect, closeDatabase, clearDatabase, verifyUser };
