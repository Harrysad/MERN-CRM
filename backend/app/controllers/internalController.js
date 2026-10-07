const { deleteExpiredAccounts } = require("../services/retentionService");

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
};
