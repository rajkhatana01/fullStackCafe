require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");

const authRoutes = require("./src/routers/authRoutes");
const adminRoutes = require("./src/routers/adminRoutes");
const orderRoutes = require("./src/routers/orderRoutes");
const authMiddleware = require("./src/middleware/optionalAuth");
const Product = require("./src/models/Product"); // Import Product model

const app = express();

connectDB();

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Enable JSON parsing for Cart Checkout
app.use(cookieParser());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.locals.title = "fullStackCafe";
  res.locals.user = null;
  next();
});

app.use(authRoutes);
app.use(adminRoutes);
app.use(orderRoutes);

app.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.render("dashboard", { user: req.user, products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching menu");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
