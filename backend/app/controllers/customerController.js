const Customer = require("../models/CustomerModel");

module.exports = {
  index: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sort || "name";
    const sortOrder = req.query.order === "desc" ? -1 : 1;

    const startIndex = (page - 1) * limit;

    Customer.countDocuments()
      .then((total) => {
        Customer.find()
        .sort({[sortField]: sortOrder})
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
    Customer.findById(req.params.id)
      .lean()
      .then((customer) => {
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
    const newCustomer = new Customer(req.body);
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
          res.status(409).json({
            error: true,
            message: "User already exist.",
          });
        }
      });
  },
  update: (req, res) => {
    Customer.findByIdAndUpdate(req.params.id, req.body)
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
    Customer.findByIdAndDelete(req.params.id)
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
