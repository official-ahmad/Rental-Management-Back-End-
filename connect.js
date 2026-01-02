const mongoose = require("mongoose");

function connectDB() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(`Db connected successfully`);
    })
    .catch((err) => {
      console.log(`Error in db connection ${err}`);
    });
}
module.exports = connectDB;
