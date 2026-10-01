const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../services/emailService");

const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const sendVerificationEmail = (user, token) => {
  const link = `${process.env.FRONTEND_URL}/verify/${token}`;
  return sendEmail({
    to: user.email,
    subject: "Potwierdź swój adres e-mail - CRM Project",
        html: `<p>Cześć ${user.name}, </p><p>Dziękujemy za rejestrację. Potwierdź swój adres e-mail, klikając w poniższy link:</p><p><a href="${link}">${link}</a></p><p>Jeśli nie zakładałeś/aś tego konta, zignoruj tę wiadomość.</p>`,
  });
};

module.exports = {
  create: (req, res) => {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = User({
      ...req.body,
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
          res.status(409).json({
            error: true,
            message: "User already exists",
          });
        }
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
        user.verified = true;
        user.verificationTokenHash = null;
        return user.save().then(() => {
          res.status(200).json({
            message: "Adres e-mail został potwierdzony.",
          });
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
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
          });
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  },
  login: (req, res) => {
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          res.status(400).json({
            error: true,
            message: "That user not exist.",
          });
          return;
        }

        bcrypt.compare(req.body.password, user.password, (err, logged) => {
          if (err) {
            res.status(500).json({
              error: true,
              message: "Login error",
            });
            return;
          }

          if (logged) {
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
          } else {
            res.status(400).json({
              error: true,
              message: "Login data do not match",
            });
            return;
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  },
  logout: (_req, res) => {
    res.clearCookie("AuthToken");

    return res
      .status(200)
      .json({ message: "You have successfully logged out" });
  },
};
