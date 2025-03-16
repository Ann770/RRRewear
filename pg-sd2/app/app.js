const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const app = express();

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(
  session({
    secret: "rrrewear-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Debugging - Log paths
console.log("Views directory path:", path.join(__dirname, "views"));
console.log("Static files directory:", path.join(__dirname, "statics"));

// Set View Engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); // FIXED

// Set Static Files Directory
app.use(express.static(path.join(__dirname, "statics"))); //  FIXED

// Routes (Fix paths if app.js is inside "app/")
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
  res.render("index", { title: "RRRewear - Circular Fashion Swap" });
});

// Handle 404 Errors
app.use((req, res, next) => {
  res.status(404).render("error", { title: "Page Not Found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`RRRewear server running at http://localhost:${PORT}`);
});
