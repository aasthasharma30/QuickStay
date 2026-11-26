import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import connectCloudinary from "./configs/cloudinary.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ✅ Fix for ES Modules (__dirname equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Force dotenv to load from server folder
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("✅ ENV CHECK - Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("✅ ENV CHECK - API Key:", process.env.CLOUDINARY_API_KEY);
console.log("✅ ENV CHECK - Mongo URI:", process.env.MONGODB_URI);

// Register all models at startup
import "./models/User.js";
import "./models/Hotel.js";
import "./models/Room.js";
import "./models/Booking.js";

// ✅ Connect DB & Cloudinary AFTER env loads
connectDB();
connectCloudinary();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Stripe Webhook (must be before express.json)
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Middleware
app.use(clerkMiddleware());  // ✅ must run first so req.auth is ready
app.use(express.json());

// Clerk Webhook
app.use("/api/clerk", clerkWebhooks);

// Routes
app.get("/", (req, res) => res.send("API is working"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);