const Product = require("../models/Product");
const Order = require("../models/Order");

// Render Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const products = await Product.find();
    // Fetch orders and populate user details and product details
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 }); // Newest first

    res.render("admin/dashboard", { 
      user: req.user, 
      products, 
      orders,
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
    // Fetch active orders (not completed), sorted by pickup time
    const orders = await Order.find({ status: { $ne: "Completed" } })
      .populate("items.product")
      .sort({ createdAt: 1 }); // Oldest orders first

    res.render("admin/orders", { user: req.user, orders, title: "Kitchen Queue" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders");
  }
};

// Render Menu Management
exports.getMenu = async (req, res) => {
  try {
    const menuItems = await Product.find();
    res.render("admin/menu", { user: req.user, menuItems, title: "Menu Management" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching menu");
  }
};

// Render Add/Edit Product Form
exports.getProductForm = async (req, res) => {
  let product = null;
  if (req.params.id) {
    product = await Product.findById(req.params.id);
  }
  res.render("admin/product_form", { user: req.user, product, title: product ? "Edit Product" : "Add Product" });
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
    }
    // In a real app, you might emit a socket event here for real-time notification
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