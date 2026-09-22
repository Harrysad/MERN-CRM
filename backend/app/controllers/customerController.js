const Customer = require("../models/CustomerModel");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

module.exports = {
  index: (req, res) => {
    const requestedPage = parseInt(req.query.page);
    const requestedLimit = parseInt(req.query.limit);
    const page = requestedPage > 0 ? requestedPage : 1;
    const limit =
      requestedLimit > 0 ? Math.min(requestedLimit, MAX_LIMIT) : DEFAULT_LIMIT;
    const sortField = req.query.sort || "name";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const search = req.query.search?.trim();

    const filter = {
      owner: req.userId,
      ...(search
        ? {
            $or: [
              { name: { $regex: escapeRegex(search), $options: "i" } },
              {
                "address.city": { $regex: escapeRegex(search), $options: "i" },
              },
              { nip: { $regex: escapeRegex(search), $options: "i" } },
            ],
          }
        : {}),
    };

    const startIndex = (page - 1) * limit;

    Customer.countDocuments(filter)
      .then((total) => {
        Customer.find(filter)
          .sort({ [sortField]: sortOrder })
          .skip(startIndex)
          .limit(limit)
          .lean()
          .then((customers) => {
            res.status(200).json({
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              dataCount: customers.length,
              hasNextPage: page * limit < total,
              hasPreviousPage: page > 1,
              data: customers,
            });
          })
          .catch((err) => {
            res.status(500).json({
              error: err,
            });
          });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  },
  customer: (req, res) => {
    Customer.findOne({ _id: req.params.id, owner: req.userId })
      .lean()
      .then((customer) => {
        if (!customer) {
          return res.status(404).json({
            error: "Customer not found.",
          });
        }
        delete customer.actions;
        res.status(200).json(customer);
      })
      .catch(() => {
        res.status(404).json({
          error: "Customer not found.",
        });
      });
  },
  create: (req, res) => {
    const newCustomer = new Customer({ ...req.body, owner: req.userId });
    newCustomer
      .save()
      .then(() => {
        res.status(201).json({
          name: newCustomer.name,
          address: newCustomer.address,
          nip: newCustomer.nip,
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          return res.status(409).json({
            error: true,
            message: "Customer with this NIP already exists.",
          });
        }
        res.status(400).json({
          error: true,
          message: "Could not create customer.",
        });
      });
  },
  update: (req, res) => {
    Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
    )
      .then((customer) => {
        if (!customer) {
          return res.status(404).json({
            message: "Customer not found",
          });
        }
        res.status(200).json({
          message: "Customer edited",
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  },
  delete: (req, res) => {
    Customer.findOneAndDelete({ _id: req.params.id, owner: req.userId })
      .then((customer) => {
        if (!customer) {
          return res.status(404).json({
            message: "Customer not found",
          });
        }
        res.status(200).json({
          message: "Customer deleted",
          deleted: true,
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  },
};
