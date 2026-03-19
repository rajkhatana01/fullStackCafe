const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const optionalAuth = require("../middleware/optionalAuth");
const upload = require("../middleware/upload");
const Product = require("../models/Product"); // Import the Product model
const PushSubscription = require("../models/PushSubscription"); // Import Push Model


router.get("/", optionalAuth, async (req, res) => {
  try {
        let page = parseInt(req.query.page) || 1;
        if (page < 1) page = 1; // Prevent Mongoose crash on negative skip
        const limit = 6; // Set to 6 items per page
        const skip = (page - 1) * limit;

        const category = req.query.category || 'All';
        const searchTerm = req.query.search || '';

        // Build the query object
        const query = {};
        if (category !== 'All') query.category = category;
        // Escape searchTerm to prevent ReDoS attacks and invalid regex crashes
        if (searchTerm) query.name = { $regex: searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: 'i' }; 

        // Count and fetch based on the final query
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch paginated products from the database
        const products = await Product.find(query).skip(skip).limit(limit);
        
        // Render dashboard with pagination data
        res.render('dashboard', { 
            user: req.user, products, currentPage: page, totalPages, currentCategory: category, searchTerm 
        });
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

router.post("/subscribe", optionalAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
      const subscription = req.body;
      await PushSubscription.findOneAndUpdate(
          { user: req.user.id },
          { user: req.user.id, subscription },
          { upsert: true, new: true } // Create if missing, update if exists
      );
      res.status(201).json({ success: true });
  } catch (err) {
      res.status(500).json({ error: "Failed to save subscription" });
  }
});

module.exports = router;
