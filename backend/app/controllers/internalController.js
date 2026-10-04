const {
  deleteExpiredUnverifiedAccounts,
} = require("../services/retentionService");

module.exports = {
  cleanupUnverified: (req, res) => {
    deleteExpiredUnverifiedAccounts()
      .then((deleted) => {
        res.status(200).json({ deleted });
      })
      .catch((err) => {
        console.error("Błąd sprzątania niezweryfikowanych kont: ", err);
        res.status(500).json({
          message: "Cleanup failed.",
        });
      });
  },
};
