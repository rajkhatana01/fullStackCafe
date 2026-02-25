const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// Add Item to Cart
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "Product ID required" });
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.isOutOfStock) return res.status(400).json({ success: false, message: "Product is out of stock" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    
    // Calculate new count
    const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    res.json({ success: true, message: "Added to cart", cartCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Render the Cart Page
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    // Cleanup: Remove items where the product has been deleted from DB
    if (cart && cart.items.length > 0) {
      const validItems = cart.items.filter(item => item.product != null);
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
      }
    }

    res.render("cart", { user: req.user, cart, title: "My Cart" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching cart");
  }
};

// Handle Checkout
exports.placeOrder = async (req, res) => {
  try {
    // Fetch cart from DB instead of req.body
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Build Order Items from Cart
    cart.items.forEach(cartItem => {
      const product = cartItem.product;
      if (product) {
        totalAmount += product.price * cartItem.quantity;
        orderItems.push({
          product: product._id,
          quantity: cartItem.quantity,
          price: product.price
        });
      }
    });

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: "No valid products in cart" });
    }

    // Create Order
    const newOrder = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount
    });

    // Clear the cart after order
    await Cart.findOneAndDelete({ user: req.user.id });

    res.json({ success: true, message: "Order placed successfully!", orderId: newOrder._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      // Filter out the item to remove it
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
      
      const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      return res.json({ success: true, message: "Item removed", cartCount });
    }
    res.status(404).json({ success: false, message: "Cart not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.render("orders", { user: req.user, orders, title: "My Orders" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders");
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    // Find order that belongs to this user
    const order = await Order.findOne({ _id: orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Cannot cancel order that is already processing" });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};