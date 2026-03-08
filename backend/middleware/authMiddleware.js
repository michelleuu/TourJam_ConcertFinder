const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

  const authHeader = req.headers.authorization;

  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  let token;

  // Handle "Bearer token"
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = authHeader;
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallbackSecret"
    );

    req.userId = decoded.id;

    console.log("Token verified. User ID:", req.userId);

    next();

  } catch (error) {

    console.error("Token verification failed:", error);

    return res.status(401).json({ error: "Invalid token" });

  }
}

module.exports = verifyToken;