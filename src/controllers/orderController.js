const Order = require("../models/Order");
const Product = require("../models/Product");

// Render the Cart Page
exports.getCart = (req, res) => {
  res.render("cart", { user: req.user, title: "My Cart" });
};

// Handle Checkout
exports.placeOrder = async (req, res) => {
  try {
    const { cartItems } = req.body; // Expecting [{ productId, quantity }]

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 1. Fetch products from DB to get real prices (Security check)
    const productIds = cartItems.map(item => item.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    let totalAmount = 0;
    const orderItems = [];

    // 2. Build Order Items
    cartItems.forEach(cartItem => {
      const product = dbProducts.find(p => p._id.toString() === cartItem.productId);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        totalAmount += itemTotal;
        orderItems.push({
          product: product._id,
          quantity: cartItem.quantity,
          price: product.price
        });
      }
    });

    // 3. Create Order
    const newOrder = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount
    });

    res.json({ success: true, message: "Order placed successfully!", orderId: newOrder._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};