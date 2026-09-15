const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const cookieParser = require("cookie-parser");
const { connectDB } = require("./app/configs/config");
const app = express();

dotenv.config();

connectDB();

const customerRouter = require("./app/router/customerRouter");
const actionRouter = require("./app/router/actionRouter");
const authMiddleware = require("./app/middlewares/authMiddleware");
const userRouter = require("./app/router/userRouter");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// app.use((req, _res, next) => {
//   console.log("All cookies: ", req.cookies);
//   next();
// });

/* Routes */
app.use("/auth", userRouter);
app.use("/customers", authMiddleware, customerRouter);
app.use("/actions", authMiddleware, actionRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
