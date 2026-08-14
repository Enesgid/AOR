const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const {
  universityIntelligence,
  refreshUniversityIntelligence,
} = require("../controllers/aiController");

// Get the latest saved AI recommendation
router.get(
  "/summary",
  verifyToken,
  universityIntelligence
);

// Generate a completely new AI recommendation
router.post(
  "/refresh",
  verifyToken,
  refreshUniversityIntelligence
);

module.exports = router;