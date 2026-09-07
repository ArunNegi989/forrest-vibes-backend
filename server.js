require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");

// ================================
// Database Connection
// ================================

connectDB();

// ================================
// Server Configuration
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Forest Vibe API Server");
  console.log(`   Status: Running ✅`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});