import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;  // ✅ won't crash if req.auth is null

    if (!userId) {
      return res.json({ success: false, message: "not authenticated" });
    }

    const user = await User.findById(userId);
    req.user = user;
    next();

  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.json({ success: false, message: "not authenticated" });
  }
};