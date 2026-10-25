const { resetDatabase, waitForUserIndexes } = require("./db");

module.exports = async () => {
  await resetDatabase();
  await waitForUserIndexes();
};
