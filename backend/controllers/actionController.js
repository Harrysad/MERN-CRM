const Action = require("../models/ActionModel");
const Customer = require("../models/CustomerModel");

module.exports = {
  create: (req, res) => {
    const { customer } = req.body;
    const newAction = new Action({ ...req.body, customer: customer });
    newAction.save();

    Customer.updateOne(
      { _id: customer },
      { $push: { actions: newAction._id } }
    ).catch((err) => {
      res.status(500).json({ error: err });
    });
    res.status(201).json(newAction);
  },
  update: (req, res) => {
    Action.findByIdAndUpdate(req.params.id, req.body)
      .then((action) => {
        if (!action)
          return res.status(404).json({ message: "Action not found" });
        res
          .status(200)
          .json({ message: "Action edited successfully", action: action });
      })
      .catch((err) => {
        res.status(400).json({ error: err });
      });
  },
  delete: (req, res) => {
    Action.findByIdAndDelete(req.params.id)
      .then((action) => {
        if (!action)
          return res.status(404).json({ message: "Action not found" });
        Customer.updateOne(
          { _id: action.customer },
          { $pull: { actions: action._id } }
        ).catch((err) => {
          res.status(err);
        });
        res.status(204).json({ message: "Action deleted" });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  },
};
