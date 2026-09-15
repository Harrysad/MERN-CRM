const mongoose = require("mongoose");

module.exports = {
    connectDB: () => {
        mongoose.connect(process.env.MONGO_URL)
        .then(() => {
            console.log('MongoDB is connected')
        })
        .catch((err) => {
            console.error('MongoDB connection error: ', err)
        })
    }
};