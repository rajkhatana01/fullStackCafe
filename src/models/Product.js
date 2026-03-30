const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String ,
  category: String,
  isOutOfStock: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Product", productSchema);
//chage name
