const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const optionalAuth = require("../middleware/optionalAuth");
const upload = require("../middleware/upload");
const Product = require("../models/Product"); // Import the Product model


router.get("/", optionalAuth, async (req, res) => {
  try {
        // Fetch products from the database
        const products = await Product.find();
        // Render dashboard with both user and products data
        res.render('dashboard', { user: req.user, products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
});
router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);

// router.post("/signup", authController.signupUser);
router.post("/signup", upload.single("profilePic"), authController.signupUser);
router.post("/login", authController.loginUser);

router.get("/logout", authController.logoutUser);

module.exports = router;
