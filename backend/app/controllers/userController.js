const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");
const escapeHtml = require("../helpers/escapeHtml");

const RESEND_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_LINK_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const sendVerificationEmail = (user, token) => {
  const link = `${process.env.FRONTEND_URL}/verify/${token}`;
  return sendEmail({
    to: user.email,
    subject: "Potwierdź swój adres e-mail - CRM Project",
    html: `<p>Cześć ${escapeHtml(user.name)}, </p><p>Dziękujemy za rejestrację. Potwierdź swój adres e-mail, klikając w poniższy link:</p><p><a href="${link}">${link}</a></p><p>Link jest ważny przez 24 godziny.</p><p>Jeśli nie zakładałeś/aś tego konta, zignoruj tę wiadomość.</p>`,
  });
};

module.exports = {
  create: (req, res) => {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const { name, email, password } = req.body;
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: true,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }
    const newUser = User({
      name,
      email,
      password,
      verified: false,
      verificationTokenHash: hashToken(verificationToken),
      verificationSentAt: new Date(),
    });
    newUser
      .save()
      .then(() => {
        sendVerificationEmail(newUser, verificationToken).catch((err) =>
          console.error("Błąd wysyłki e-maila weryfikującego: ", err),
        );

        res.status(201).json({
          name: newUser.name,
          email: newUser.email,
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          return res.status(409).json({
            error: true,
            message: "User already exists",
          });
        }
        if (err.name === "ValidationError") {
          return res.status(400).json({
            error: true,
            message: "Invalid signup data",
          });
        }
        res.status(500).json({
          error: true,
          message: "Signup failed",
        });
      });
  },
  verify: (req, res) => {
    const tokenHash = hashToken(req.params.token);
    User.findOne({ verificationTokenHash: tokenHash })
      .then((user) => {
        if (!user) {
          return res.status(400).json({
            message: "Nieprawidłowy lub już użyty link weryfikacyjny.",
          });
        }
        const sentAt = user.verificationSentAt?.getTime() ?? 0;
        if (Date.now() - sentAt > VERIFICATION_LINK_TTL_MS) {
          return res.status(400).json({
            message:
              "Link weryfikacyjny wygasł. Zaloguj się i poproś o nowy link.",
          });
        }
        user.verified = true;
        user.verificationTokenHash = null;
        return user.save().then(() => {
          res.status(200).json({
            message: "Adres e-mail został potwierdzony.",
          });
        });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
  resendVerification: (req, res) => {
    User.findById(req.userId)
      .then((user) => {
        if (!user) {
          return res.status(404).json({
            message: "Nie znaleziono użytkownika.",
          });
        }
        if (user.verified) {
          return res.status(400).json({
            message: "Adres e-mail jest już potwierdzony.",
          });
        }

        const elapsed = Date.now() - (user.verificationSentAt?.getTime() ?? 0);
        if (elapsed < RESEND_COOLDOWN_MS) {
          const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
          return res.status(429).json({
            message: `Poczekaj ${secondsLeft} s przed ponownym wysłaniem linku.`,
            retryAfterSeconds: secondsLeft,
          });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.verificationTokenHash = hashToken(verificationToken);
        user.verificationSentAt = new Date();
        return user.save().then(() => {
          sendVerificationEmail(user, verificationToken).catch((err) =>
            console.error("Błąd wysyłki e-maila weryfikacyjnego: ", err),
          );
          res.status(200).json({
            message: "Wysłano nowy link weryfikacyjny.",
            retryAfterSeconds: RESEND_COOLDOWN_MS / 1000,
          });
        });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
  login: (req, res) => {
    const { email, password } = req.body;
    const invalidCredentials = () =>
      res.status(400).json({
        error: true,
        message: "Invalid email or password",
      });

    if (typeof email !== "string" || typeof password !== "string") {
      return invalidCredentials();
    }

    User.findOne({ email: email.trim().toLowerCase() })
      .then((user) => {
        if (!user) {
          return invalidCredentials();
        }

        bcrypt.compare(password, user.password, (err, logged) => {
          if (err) {
            sendServerError(res, err);
            return;
          }

          if (!logged) {
            return invalidCredentials();
          }

          const token = user.generateAuthToken(user);
          res.cookie("AuthToken", token, {
            maxAge: 3600000,
          });
          res.status(200).json({
            name: user.name,
            jwt: token,
            role: user.role,
            verified: user.verified,
          });
        });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
  verificationStatus: (req, res) => {
    User.findById(req.userId)
      .select("verified")
      .then((user) => {
        if (!user) {
          return res.status(404).json({
            message: "Nie znaleziono użytkownika.",
          });
        }
        res.status(200).json({
          verified: user.verified,
        });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
  logout: (_req, res) => {
    res.clearCookie("AuthToken");

    return res
      .status(200)
      .json({ message: "You have successfully logged out" });
  },
};
