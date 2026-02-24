const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

// Protect all admin routes
router.use("/admin", adminAuth);

router.get("/admin/dashboard", adminController.getDashboard);
router.get("/admin/orders", adminController.getOrders);
router.get("/admin/menu", adminController.getMenu);

// Product Management
router.get("/admin/product/new", adminController.getProductForm);
router.get("/admin/product/edit/:id", adminController.getProductForm);
router.post("/admin/product/save", upload.single("image"), adminController.saveProduct);
router.post("/admin/product/save/:id", upload.single("image"), adminController.saveProduct);
router.get("/admin/product/delete/:id", adminController.deleteProduct);

// Menu Actions (Quick Edits)
router.post("/admin/menu/toggle-stock", adminController.toggleStock);
router.post("/admin/menu/update-price", adminController.updatePrice);
router.post("/admin/menu/add", adminController.addMenuItem);

// Order Management
router.post("/admin/order/status/:id", adminController.updateOrderStatus);
router.post("/admin/order/update-status", adminController.updateOrderStatusForm);

module.exports = router;