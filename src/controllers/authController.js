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
    if (existingUser) return res.send("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic: req.file ? `/uploads/${req.file.filename}` : null
    });

    res.redirect("/login");

  } catch (err) {
    console.error(err);
    res.send("Signup error");
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, profilePic: user.profilePic },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { httpOnly: true,
      secure: false,     // true when using HTTPS
      sameSite: "strict"
    });

    if (user.role === "admin" || user.role === "superAdmin") {
      return res.redirect("/admin/dashboard");
    }

    res.redirect("/");

  } catch (err) {
    console.error(err);
    res.send("Login error");
  }
};


exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};
