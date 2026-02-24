const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/optionalAuth"); // Or create a strict auth middleware

// Ensure user is logged in for these routes
const requireAuth = (req, res, next) => req.user ? next() : res.redirect("/login");

router.get("/cart", authMiddleware, requireAuth, orderController.getCart);
router.post("/order/checkout", authMiddleware, requireAuth, orderController.placeOrder);

module.exports = router;