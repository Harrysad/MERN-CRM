const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const customerRouter = require("./app/router/customerRouter");
const actionRouter = require("./app/router/actionRouter");
const nipRouter = require("./app/router/nipRouter");
const authMiddleware = require("./app/middlewares/authMiddleware");
const userRouter = require("./app/router/userRouter");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
app.use("/nip", authMiddleware, nipRouter);

module.exports = app;