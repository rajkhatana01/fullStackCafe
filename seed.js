const mongoose = require("mongoose");
const Product = require("./src/models/Product");
require("dotenv").config();

// Connect to MongoDB (using your .env URI or a local fallback)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fullStackCafe";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to DB for seeding"))
  .catch(err => console.error(err));

const products = [
  // --- Breakfast ---
  {
    name: "Classic Pancakes",
    price: 199,
    description: "Fluffy stack of 3 pancakes with maple syrup and butter.",
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80"
  },
  {
    name: "Masala Omelette",
    price: 120,
    description: "Spicy Indian style omelette with onions, tomatoes, and green chilies.",
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=500&q=80"
  },
  {
    name: "Aloo Paratha",
    price: 150,
    description: "Stuffed potato flatbread served with curd and pickle.",
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&q=80"
  },
  {
    name: "Fruit Salad Bowl",
    price: 180,
    description: "Fresh seasonal fruits topped with honey and mint.",
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1519996529931-28324d1a630e?w=500&q=80"
  },

  // --- Fast Food ---
  {
    name: "Veggie Burger",
    price: 149,
    description: "Crispy veg patty with fresh lettuce, tomatoes, and cheese.",
    category: "Fast Food",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"
  },
  {
    name: "Margherita Pizza",
    price: 299,
    description: "Classic pizza with tomato sauce, mozzarella, and basil.",
    category: "Fast Food",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80"
  },
  {
    name: "Crispy French Fries",
    price: 99,
    description: "Golden fried potato strips served with ketchup and mayo.",
    category: "Fast Food",
    image: "https://images.unsplash.com/photo-1518013431117-e5952c87455d?w=500&q=80"
  },
  {
    name: "Spicy Chicken Wrap",
    price: 179,
    description: "Grilled chicken strips wrapped in a tortilla with spicy sauce.",
    category: "Fast Food",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80"
  },

  // --- Lunch ---
  {
    name: "Chicken Biryani",
    price: 299,
    description: "Aromatic basmati rice cooked with tender chicken and spices.",
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&q=80"
  },
  {
    name: "Paneer Butter Masala",
    price: 249,
    description: "Cottage cheese cubes in a rich and creamy tomato gravy.",
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80"
  },
  {
    name: "Rajma Chawal",
    price: 199,
    description: "Comforting kidney beans curry served with steamed rice.",
    category: "Lunch",
    image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=500&q=80"
  },

  // --- Desserts ---
  {
    name: "Chocolate Lava Cake",
    price: 129,
    description: "Warm chocolate cake with a gooey molten center.",
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476d?w=500&q=80"
  },
  {
    name: "Gulab Jamun",
    price: 99,
    description: "Soft milk solids dumplings soaked in rose-flavored sugar syrup.",
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=500&q=80"
  },
  {
    name: "New York Cheesecake",
    price: 249,
    description: "Creamy cheesecake on a graham cracker crust.",
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1524351199678-941a58a3df26?w=500&q=80"
  },

  // --- Drinks ---
  {
    name: "Iced Latte",
    price: 119,
    description: "Chilled espresso with milk and a touch of vanilla.",
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80"
  },
  {
    name: "Mango Lassi",
    price: 89,
    description: "Refreshing yogurt-based drink blended with sweet mangoes.",
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=80"
  },
  {
    name: "Fresh Lime Soda",
    price: 69,
    description: "Sparkling soda with fresh lime juice and mint.",
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80"
  },

  // --- Dinner ---
  {
    name: "Grilled Salmon",
    price: 450,
    description: "Fresh salmon fillet grilled to perfection with asparagus.",
    category: "Dinner",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=500&q=80"
  },
  {
    name: "Mutton Rogan Josh",
    price: 399,
    description: "Traditional Kashmiri lamb curry with aromatic spices.",
    category: "Dinner",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?w=500&q=80"
  },
  {
    name: "Dal Makhani",
    price: 220,
    description: "Creamy black lentils cooked overnight with butter and cream.",
    category: "Dinner",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80"
  }
];

const seedDB = async () => {
  // Clear existing products so we don't get duplicates
  await Product.deleteMany({});
  // Insert new products
  await Product.insertMany(products);
  console.log("Products Seeded Successfully!");
  mongoose.connection.close();
};

seedDB();