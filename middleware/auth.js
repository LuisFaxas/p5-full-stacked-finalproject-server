import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    console.log("Received token:", token);

    if (!token) {
      return res.status(401).send("Access Denied: No token provided");
    }

    if (token.startsWith("Bearer ")) {
      
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Verified token payload:", verified);
    req.user = verified;
    next();
  } catch (err) {
    // If it is a jwt-specific error, handle separately
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // For other errors, return a 500 status code
    return res.status(500).json({ error: err.message });
  }
};