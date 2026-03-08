const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // Get Authorization header
  const authHeader = req.header("Authorization");

  // Check if header exists
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallbackSecret"
    );

    // Attach user ID to request
    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;