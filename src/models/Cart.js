const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // The "Name Tag": Links this cart to a specific user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensures a user can only have one active cart
  },
  // The "Basket Contents"
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Links to the Product model for details (name, price, image)
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);