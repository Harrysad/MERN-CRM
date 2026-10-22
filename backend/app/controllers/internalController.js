const { deleteExpiredAccounts } = require("../services/retentionService");
const { getOutboxStats } = require("../services/emailOutbox");
const sendServerError = require("../helpers/sendServerError");

module.exports = {
  cleanupAccounts: (req, res) => {
    deleteExpiredAccounts()
      .then((deleted) => {
        res.status(200).json({ deleted });
      })
      .catch((err) => {
        console.error("Błąd sprzątania kont: ", err);
        sendServerError(res, err);
      });
  },
  emailStats: (req, res) => {
    getOutboxStats()
      .then((stats) => {
        res.status(200).json(stats);
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
};
