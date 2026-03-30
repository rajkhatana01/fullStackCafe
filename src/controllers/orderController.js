const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// Add Item to Cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "Product ID required" });
    
    // Validate that the productId is a valid MongoDB ObjectId to prevent CastError crashes
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product format" });
    }
    const userId = req.user.id;

    // 1. Fetch product to ensure it exists and is in stock
    const product = await Product.findById(productId, "isOutOfStock").lean();

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.isOutOfStock) return res.status(400).json({ success: false, message: "Product is out of stock" });

    // Safely parse quantity to prevent NaN errors, fallback to 1
    const addQty = quantity ? parseInt(quantity, 10) : 1;
    const finalAddQty = (isNaN(addQty) || addQty < 1) ? 1 : addQty;

    // 2. Atomic Database Operation: Try to increment existing item quantity safely
    let cart = await Cart.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $inc: { "items.$.quantity": finalAddQty } },
      { new: true }
    ).lean();

    // 3. If item was not in cart (or cart didn't exist at all), push new item / upsert cart
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        { user: userId },
        { $push: { items: { product: productId, quantity: finalAddQty } } },
        { new: true, upsert: true }
      ).lean();
    }

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
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "name price image");

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
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "price").lean();

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
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID provided" });
    }
    const userId = req.user.id;

    // Use MongoDB's atomic $pull operator to cleanly remove the item at the database level.
    // This prevents race conditions and is significantly faster than filtering in memory.
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true } // Return the updated document
    );

    if (cart) {
      const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      return res.json({ success: true, message: "Item removed", cartCount });
    }
    res.status(404).json({ success: false, message: "Cart not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Item Quantity in Cart
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, action, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || (!action && quantity === undefined)) {
      return res.status(400).json({ success: false, message: "Product ID and action or quantity required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID format" });
    }

    // 1. Fast read to determine the current state
    let cart = await Cart.findOne({ user: userId }).lean();
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(p => p.product && p.product.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    // 2. Calculate the updated quantity
    let newQuantity = item.quantity;
    if (action === "increase") {
      newQuantity += 1;
    } else if (action === "decrease") {
      newQuantity -= 1;
    } else if (action === "set" || quantity !== undefined) {
      const parsedQty = parseInt(quantity, 10);
      if (!isNaN(parsedQty)) newQuantity = parsedQty;
    }

    // 3. Highly Optimized Atomic DB operations (Bypasses all Mongoose memory & validation bugs)
    if (newQuantity <= 0 || isNaN(newQuantity)) {
      cart = await Cart.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { product: productId } } },
        { new: true }
      ).lean();
      newQuantity = 0;
    } else {
      cart = await Cart.findOneAndUpdate(
        { user: userId, "items.product": productId },
        { $set: { "items.$.quantity": newQuantity } },
        { new: true }
      ).lean();
    }

    const cartCount = cart ? cart.items.reduce((acc, curr) => acc + curr.quantity, 0) : 0;
    return res.json({ success: true, message: "Cart updated", cartCount, newQuantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name image price")
      .lean()
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
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Order ID format" });
    }
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