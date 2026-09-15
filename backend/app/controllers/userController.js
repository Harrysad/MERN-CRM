const User = require("../models/UserModel");
const bcrypt = require("bcrypt");

module.exports = {
  create: (req, res) => {
    const newUser = User(req.body);
    newUser
      .save()
      .then(() => {
        res.status(201).json({
          name: newUser.name,
          email: newUser.email,
        });
      })
      .catch((err) => {
        if (err === 11000) {
          res.status(409).json({
            error: true,
            message: "User already exist.",
          });
        }
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

    return res.status(200).json({message: "You have successfully logged out"})
  },
};
