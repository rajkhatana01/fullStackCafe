const mongoose = require("mongoose");
const User = require("./src/models/Users");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fullStackCafe";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB for Admin Seeding");

    const adminEmail = "admin@fullstackcafe.com";
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Remove existing admin to ensure fresh creation
    await User.findOneAndDelete({ email: adminEmail });

    await User.create({
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      profilePic: "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
      isActive: true
    });

    console.log(`Admin Created -> Email: ${adminEmail} | Password: admin123`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();