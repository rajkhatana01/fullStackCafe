const jwt = require("jsonwebtoken");
const User = require("../models/Users");

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || (user.role !== "admin" && user.role !== "superAdmin")) {
      return res.status(403).send("Access Denied: Admins only");
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie("token");
    res.redirect("/login");
  }
};

module.exports = adminAuth;