const mongoose = require("mongoose");

const aiIntelligenceSchema = new mongoose.Schema(
  {
    intelligence: {
      type: Object,
      required: true,
    },

    aiRecommendation: {
      type: Object,
      required: true,
    },

    lastGenerated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AIIntelligence",
  aiIntelligenceSchema
);