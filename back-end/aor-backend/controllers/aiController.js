const {
  getUniversityIntelligence,
} = require("../services/directorAIEngine");

const {
  generateDirectorAdvice,
} = require("../services/geminiService");

const AIIntelligence = require(
  "../models/AIIntelligence"
);


// GET SAVED AI INTELLIGENCE
const universityIntelligence = async (
  req,
  res
) => {
  try {

    const latestReport =
      await AIIntelligence.findOne()
        .sort({
          createdAt: -1,
        });


    // If an existing AI report exists,
    // return it without calling Gemini
    if (latestReport) {
      return res.status(200).json({
        cached: true,

        intelligence:
          latestReport.intelligence,

        aiRecommendation:
          latestReport.aiRecommendation,

        generatedAt:
          latestReport.lastGenerated,
      });
    }


    // No report exists yet,
    // so generate one
    const intelligence =
      await getUniversityIntelligence();


    const aiRecommendation =
      await generateDirectorAdvice(
        intelligence
      );


    const savedReport =
      await AIIntelligence.create({
        intelligence,

        aiRecommendation,

        lastGenerated:
          new Date(),
      });


    res.status(200).json({
      cached: false,

      intelligence:
        savedReport.intelligence,

      aiRecommendation:
        savedReport.aiRecommendation,

      generatedAt:
        savedReport.lastGenerated,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Unable to generate intelligence report.",
    });

  }
};


// REFRESH AI INTELLIGENCE
const refreshUniversityIntelligence =
  async (req, res) => {

    try {

      // Director only
      if (
        req.user.role !== "Director"
      ) {
        return res.status(403).json({
          message:
            "Only the Director can refresh university intelligence.",
        });
      }


      const intelligence =
        await getUniversityIntelligence();


      const aiRecommendation =
        await generateDirectorAdvice(
          intelligence
        );


      const savedReport =
        await AIIntelligence.create({
          intelligence,

          aiRecommendation,

          lastGenerated:
            new Date(),
        });


      res.status(200).json({
        message:
          "University intelligence refreshed successfully.",

        intelligence:
          savedReport.intelligence,

        aiRecommendation:
          savedReport.aiRecommendation,

        generatedAt:
          savedReport.lastGenerated,
      });

  //   } catch (error) {

  //     console.error(error);

  //     res.status(500).json({
  //       message:
  //         "Unable to refresh university intelligence.",
  //     });

  //   }

  // };

} catch (error) {
  console.error("REFRESH AI ERROR:", error);

  res.status(500).json({
    message: "Unable to refresh university intelligence.",
    error: error.message,
    stack: error.stack,
  });
}
  };
module.exports = {
  universityIntelligence,
  refreshUniversityIntelligence,
};