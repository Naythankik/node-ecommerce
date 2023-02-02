const { default: mongoose } = require("mongoose");
mongoose.set("strictQuery", true);

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL);
    console.log("Database succesfully connected");
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = dbConnect;
