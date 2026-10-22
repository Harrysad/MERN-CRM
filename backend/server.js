const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./app/configs/config");
const app = require("./app");
const { startOutboxWorker } = require("./app/services/emailOutbox");

connectDB();
startOutboxWorker();

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
