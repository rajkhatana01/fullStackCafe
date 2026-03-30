const Product = require("../models/Product");
const Order = require("../models/Order");
const PushSubscription = require("../models/PushSubscription");
const webpush = require("web-push");

// Render Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // 1. Setup Pagination & Filtering Variables
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1; // Prevent Mongoose crash
    const limit = 10; // Number of orders per page
    const skip = (page - 1) * limit;
    
    const statusFilter = req.query.status || 'All';
    const orderQuery = statusFilter !== 'All' ? { status: statusFilter } : {};

    // 2. Fetch Total Count and Paginated Orders
    // Optimize: Run all independent queries simultaneously
    const [products, totalOrders, orders] = await Promise.all([
      Product.find().lean(),
      Order.countDocuments(orderQuery),
      Order.find(orderQuery)
        .populate("user", "name email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/dashboard", { 
      user: req.user, 
      products, 
      orders,
      currentPage: page,
      totalPages,
      statusFilter,
      title: "Admin Dashboard" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Render Live Kitchen Queue
exports.getOrders = async (req, res) => {
  try {
    // Fetch active orders (exclude completed and cancelled), sorted by pickup time
    const orders = await Order.find({ status: { $nin: ["Completed", "Cancelled"] } })
      .populate("items.product", "name price")
      .sort({ createdAt: 1 }) // Oldest orders first
      .lean();

    res.render("admin/orders", { user: req.user, orders, title: "Kitchen Queue" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders");
  }
};

// Render Menu Management
exports.getMenu = async (req, res) => {
  try {
    const menuItems = await Product.find().lean();
    res.render("admin/menu", { user: req.user, menuItems, title: "Menu Management" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching menu");
  }
};

// Render Add/Edit Product Form
exports.getProductForm = async (req, res) => {
  try {
    let product = null;
    if (req.params.id) {
      product = await Product.findById(req.params.id).lean();
    }
    res.render("admin/product_form", { user: req.user, product, title: product ? "Edit Product" : "Add Product" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching product details");
  }
};

// Handle Add/Edit Product Logic
exports.saveProduct = async (req, res) => {
  try {
    const { name, price, description, category, existingImage } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : (existingImage || "/images/default-food.png");

    const productData = { name, price, description, category, image };

    if (req.params.id) {
      // Update existing
      await Product.findByIdAndUpdate(req.params.id, productData);
    } else {
      // Create new
      await Product.create(productData);
    }

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.send("Error saving product");
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.send("Error deleting product");
  }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order && order.status !== "Cancelled") {
      order.status = status;
      await order.save();

      // Send Web Push Notification to the user
      const subRecord = await PushSubscription.findOne({ user: order.user }).lean();
      if (subRecord) {
        const payload = JSON.stringify({
          title: "Order Update",
          body: `Your order status is now: ${status}`
        });
        try {
          await webpush.sendNotification(subRecord.subscription, payload);
        } catch (pushErr) {
          console.error("Push Notification Error:", pushErr);
        }
      }
    }
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.send("Error updating order");
  }
};

// Update Order Status (Form Submission from Kitchen View)
exports.updateOrderStatusForm = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId);

    if (order && order.status !== "Cancelled") {
      order.status = status;
      await order.save();

      // Send Web Push Notification to the user
      const subRecord = await PushSubscription.findOne({ user: order.user });
      if (subRecord) {
        const payload = JSON.stringify({
          title: "Order Update",
          body: `Your order status is now: ${status}`
        });
        try {
          await webpush.sendNotification(subRecord.subscription, payload);
        } catch (pushErr) {
          console.error("Push Notification Error:", pushErr);
        }
      }
    }
    res.redirect("/admin/orders");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/orders");
  }
};

// Toggle Stock Status
exports.toggleStock = async (req, res) => {
  try {
    const product = await Product.findById(req.body.itemId);
    if (product) {
      product.isOutOfStock = !product.isOutOfStock;
      await product.save();
    }
    res.redirect(req.get('Referer') || '/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect(req.get('Referer') || '/admin/dashboard');
  }
};

// Update Product Price
exports.updatePrice = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.body.itemId, { price: req.body.price });
    res.redirect("/admin/menu");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/menu");
  }
};

// Add New Menu Item (Quick Add)
exports.addMenuItem = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    
    // Create product with default image or placeholder if needed
    await Product.create({ 
      name, 
      category, 
      price, 
      description: "", // Default empty description to prevent validation error
      isOutOfStock: false,
      image: "/images/default-food.png" // Placeholder
    });
    res.redirect("/admin/menu");
  } catch (err) {
    console.error(err);
    res.redirect("/admin/menu");
  }
};