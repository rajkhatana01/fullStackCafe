require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");

const authRoutes = require("./src/routers/authRoutes");
const adminRoutes = require("./src/routers/adminRoutes");
const orderRoutes = require("./src/routers/orderRoutes");
const authMiddleware = require("./src/middleware/optionalAuth");
const Product = require("./src/models/Product"); // Import Product model
const Cart = require("./src/models/Cart"); // Import Cart model

const app = express();

connectDB();

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Enable JSON parsing for Cart Checkout
app.use(cookieParser());
app.use(express.static("public"));

app.use(async (req, res, next) => {
  res.locals.title = "fullStackCafe";
  res.locals.user = null;
  res.locals.cartCount = 0;
  res.locals.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  // Custom Cookie-based Flash Messages
  res.locals.error_msg = req.cookies.error_msg || "";
  res.locals.success_msg = req.cookies.success_msg || "";
  if (req.cookies.error_msg) res.clearCookie("error_msg");
  if (req.cookies.success_msg) res.clearCookie("success_msg");

  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      req.user = decoded;
      res.locals.user = decoded;

      // Fetch Cart Count for Navbar
      const cart = await Cart.findOne({ user: decoded.id });
      if (cart) {
        res.locals.cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      }
    } catch (err) {
      console.log("Invalid Token");
    }
  }
  next();
});

app.use(authRoutes);
app.use(adminRoutes);
app.use(orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
