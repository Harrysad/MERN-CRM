const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('./app/configs/config');
const app = require('./app');

connectDB();

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});