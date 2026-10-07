const Action = require("../models/ActionModel");
const Customer = require("../models/CustomerModel");
const pickFields = require("../helpers/pickFields");
const sendServerError = require("../helpers/sendServerError");
const getPagination = require("../helpers/getPagination");

const ACTION_FIELDS = ["type", "description", "date"];

module.exports = {
  index: (req, res) => {
    const { customerId } = req.params;
    const { page, limit } = getPagination(req.query);

    const startIndex = (page - 1) * limit;

    const filter = { customer: customerId, owner: req.userId };

    Action.countDocuments(filter)
      .then((totalActions) => {
        return Action.find(filter)
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
        sendServerError(res, err);
      });
  },
  create: (req, res) => {
    const { customer } = req.body;

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Customer ID is required to create an action" });
    }
    Customer.findOne({ _id: customer, owner: req.userId })
      .then((customer) => {
        if (!customer) {
          return res
            .status(404)
            .json({ message: "Customer not found, cannot create an action" });
        }
        const newAction = new Action({
          ...pickFields(req.body, ACTION_FIELDS),
          customer: customer,
          owner: req.userId,
        });
        newAction
          .save()
          .then(() => {
            return Customer.updateOne(
              { _id: customer },
              { $push: { actions: newAction._id } },
            );
          })
          .then(() => {
            res.status(201).json(newAction);
          })
          .catch((err) => {
            sendServerError(res, err);
          });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
  update: (req, res) => {
    Action.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      pickFields(req.body, ACTION_FIELDS),
      { runValidators: true },
    )
      .then((action) => {
        if (!action)
          return res.status(404).json({ message: "Action not found" });
        res
          .status(200)
          .json({ message: "Action edited successfully", action: action });
      })
      .catch((err) => {
        if (err.name === "ValidationError" || err.name === "CastError") {
          return res.status(400).json({
            error: true,
            message: "Invalid action data.",
          });
        }
        sendServerError(res, err);
      });
  },
  delete: (req, res) => {
    Action.findOneAndDelete({ _id: req.params.id, owner: req.userId })
      .then((action) => {
        if (!action)
          return res.status(404).json({ message: "Action not found" });
        Customer.updateOne(
          { _id: action.customer },
          { $pull: { actions: action._id } },
        )
          .then(() => {
            res.status(200).json({
              message: "Action deleted",
              deleted: true,
            });
          })
          .catch((err) => {
            sendServerError(res, err);
          });
      })
      .catch((err) => {
        sendServerError(res, err);
      });
  },
};
