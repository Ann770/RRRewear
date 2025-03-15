const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const fileUpload = require("express-fileupload");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
  })
);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("statics"));

// Routes
app.use("/users", require("./routes/users"));
app.use("/listings", require("./routes/listings"));
app.use("/swap_requests", require("./routes/swap_requests"));
app.use("/messages", require("./routes/messages"));
app.use("/payment", require("./routes/payment"));
app.use("/admin", require("./routes/admin"));
app.use("/wishlist", require("./routes/wishlist"));
app.use("/search", require("./routes/search"));
app.use("/matching", require("./routes/matching"));

// Homepage Route
app.get("/", (req, res) => {
  res.render("index", { title: "PG-SD2 - Circular Fashion Swap" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
