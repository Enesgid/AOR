const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. The Bouncer asks for the ID Card (checks the headers)
  const authHeader = req.header('Authorization');

  // 2. No ID card? Kick them out immediately.
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    // Tokens usually look like "Bearer eyJhbGci...", so we split it to grab just the token part
    const token = authHeader.split(" ")[1];

    // 3. The Bouncer checks if the ID is fake using our secret key
    // NOTE: This must match exactly what you used in server.js!
    const verified = jwt.verify(token, 'your_super_secret_key'); 

    // 4. ID is real! The Bouncer pins the user's info to the request so the route knows who they are
    req.user = verified;

    // 5. Open the door to the route!
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid or Expired ID Card." });
  }
};

module.exports = verifyToken;