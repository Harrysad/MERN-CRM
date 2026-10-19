const PRODUCTION_SALT_ROUNDS = 10;
const TEST_SALT_ROUNDS = 4;

const getSaltRounds = () =>
  process.env.NODE_ENV === "test" ? TEST_SALT_ROUNDS : PRODUCTION_SALT_ROUNDS;

module.exports = getSaltRounds;
