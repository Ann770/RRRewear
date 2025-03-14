const express = require("express");
const db = require("../config/db");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "../statics")));

// Import Routes
const userRoutes = require("./routes/users");
const listingRoutes = require("./routes/listings");
const swapRequestRoutes = require("./routes/swap_requests");
const messagingRoutes = require("./routes/messages");
const paymentRoutes = require("./routes/payment");
const adminRoutes = require("./routes/admin");
const wishlistRoutes = require("./routes/wishlist");
const searchRoutes = require("./routes/search");
const matchingRoutes = require("./routes/matching");

app.use("/users", userRoutes);
app.use("/listings", listingRoutes);
app.use("/swap_requests", swapRequestRoutes);
app.use("/messages", messagingRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/search", searchRoutes);
app.use("/matching", matchingRoutes);

// Home Route
app.get("/", (req, res) => {
    res.render("index", { title: "RRRewear - Circular Fashion Swap" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
