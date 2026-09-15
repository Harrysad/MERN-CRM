const Action = require("../models/ActionModel");
const Customer = require("../models/CustomerModel");

module.exports = {
  index: (req, res) => {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;

    Action.countDocuments({ customer: customerId })
      .then((totalActions) => {
        Action.find({ customer: customerId })
          .populate("customer", "name")
          .skip(startIndex)
          .limit(limit)
          .then((actions) => {
            res.status(200).json({
              page,
              limit,
              totalActions,
              pages: Math.ceil(totalActions / limit),
              dataCount: actions.length,
              hasNextPage: page * limit < totalActions,
              hasPreviousPage: page > 1,
              data: actions,
            });
          });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  },
  create: (req, res) => {
    const { customer } = req.body;

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Customer ID is required to create an action" });
    }
    Customer.findById(customer)
      .then((customer) => {
        if (!customer) {
          return res
            .status(404)
            .json({ message: "Customer not found, cannot create an action" });
        }
        const newAction = new Action({ ...req.body, customer: customer });
        newAction
          .save()
          .then(() => {
            return Customer.updateOne(
              { _id: customer },
              { $push: { actions: newAction._id } }
            );
          })
          .then(() => {
            res.status(201).json(newAction);
          })
          .catch((err) => {
            res.status(500).json({ error: err });
          });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
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
        res.status(200).json({
          message: "Action deleted",
          deleted: true,
        });
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  },
};
