const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

exports.getLogin = (req, res) => {
  res.render("login", { title: "Login", user: null });
};

exports.getSignup = (req, res) => {
  res.render("signup", { title: "Signup", user: null });
};

exports.signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.cookie("error_msg", "Email already registered. Please login.");
      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    res.cookie("success_msg", "Registration successful! You can now log in.");
    res.redirect("/login");

  } catch (err) {
    console.error(err);
    res.cookie("error_msg", "An error occurred during signup.");
    res.redirect("/signup");
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.cookie("error_msg", "User not found. Please check your email.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.cookie("error_msg", "Invalid credentials. Please try again.");
      return res.redirect("/login");
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, profilePic: user.profilePic },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // True on Render, false on Localhost
      sameSite: "strict"
    });

    if (user.role === "admin" || user.role === "superAdmin") {
      return res.redirect("/admin/dashboard");
    }

    res.redirect("/");

  } catch (err) {
    console.error(err);
    res.cookie("error_msg", "An error occurred during login.");
    res.redirect("/login");
  }
};


exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};
