const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use 127.0.0.1 instead of localhost to prevent Node 17+ IPv6 lookup issues
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fullStackCafe");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;