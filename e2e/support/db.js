const { MongoClient } = require("mongodb");
const { MONGO_URL } = require("./env");

const withDb = async (callback) => {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    return await callback(client.db());
  } finally {
    await client.close();
  }
};

const resetDatabase = () =>
  withDb(async (db) => {
    const collections = await db.collections();
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
  });

const waitForUserIndexes = () =>
  withDb(async (db) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      const indexes = await db
        .collection("users")
        .indexes()
        .catch(() => []);
      if (indexes.some((index) => index.unique && index.key.email === 1)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("The unique email index was not created");
  });

const updateUser = (email, fields) =>
  withDb((db) => db.collection("users").updateOne({ email }, { $set: fields }));

const markVerified = (email) => updateUser(email, { verified: true });

module.exports = {
  resetDatabase,
  waitForUserIndexes,
  updateUser,
  markVerified,
};
