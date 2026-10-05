const User = require("../models/UserModel");
const Customer = require("../models/CustomerModel");
const Action = require("../models/ActionModel");
const { sendEmail } = require("./emailService");
const escapeHtml = require("../helpers/escapeHtml");

const RETENTION_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_EMAIL = "demo@example.com";

const sendDeletionNotice = (user) =>
  sendEmail({
    to: user.email,
    subject: "Twoje konto zostało usunięte - CRM Project",
    html: `<p>Cześć ${escapeHtml(user.name)},</p><p>Twoje konto zostało usunięte, ponieważ konta w tej aplikacji demonstracyjnej są automatycznie usuwane po ${RETENTION_DAYS} dniach. Razem z nim usunięte zostały wszystkie dane, które w nim dodałeś/aś.</p><p>Jeśli chcesz korzystać z aplikacji, możesz w każdej chwili założyć nowe konto: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>`,
  });

const deleteExpiredAccounts = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS);

  const expired = await User.find({
    email: { $ne: DEMO_EMAIL },
    createdAt: { $lt: cutoff },
  }).select("name email");

  for (const user of expired) {
    await Action.deleteMany({ owner: user._id });
    await Customer.deleteMany({ owner: user._id });
    await User.deleteOne({ _id: user._id });

    try {
      await sendDeletionNotice(user);
    } catch (err) {
      console.error("Błąd wysyłki e-maila o usunięciu konta: ", err);
    }
  }

  return expired.length;
};

module.exports = { deleteExpiredAccounts, RETENTION_DAYS };
