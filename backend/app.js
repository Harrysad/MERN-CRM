const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const customerRouter = require("./app/router/customerRouter");
const actionRouter = require("./app/router/actionRouter");
const nipRouter = require("./app/router/nipRouter");
const internalRouter = require("./app/router/internalRouter");
const authMiddleware = require("./app/middlewares/authMiddleware");
const userRouter = require("./app/router/userRouter");
const { nipLimiter } = require("./app/middlewares/rateLimiters");
const sendServerError = require("./app/helpers/sendServerError");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// app.use((req, _res, next) => {
//   console.log("All cookies: ", req.cookies);
//   next();
// });

/* Routes */
app.use("/auth", userRouter);
app.use("/customers", authMiddleware, customerRouter);
app.use("/actions", authMiddleware, actionRouter);
app.use("/nip", nipLimiter, authMiddleware, nipRouter);
app.use("/internal", internalRouter);

//--------------- Error handling ---------------
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: true,
      message: "Invalid JSON body.",
    });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: true,
      message: "Payload too large.",
    });
  }
  sendServerError(res, err);
});

module.exports = app;
