const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/optionalAuth"); // Or create a strict auth middleware

// Ensure user is logged in for these routes
const requireAuth = (req, res, next) => {
  if (req.user) return next();
  // Check if request expects JSON (AJAX) to avoid redirecting to HTML login page
  if ((req.headers['content-type'] && req.headers['content-type'].includes('application/json')) || req.xhr) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }
  res.redirect("/login");
};

router.get("/cart", authMiddleware, requireAuth, orderController.getCart);
router.get("/orders", authMiddleware, requireAuth, orderController.getUserOrders);
router.post("/cart/add", authMiddleware, requireAuth, orderController.addToCart);
router.post("/cart/remove", authMiddleware, requireAuth, orderController.removeFromCart);
router.post("/cart/update", authMiddleware, requireAuth, orderController.updateCartItemQuantity);
router.post("/order/checkout", authMiddleware, requireAuth, orderController.placeOrder);
router.post("/orders/cancel/:id", authMiddleware, requireAuth, orderController.cancelOrder);

module.exports = router;