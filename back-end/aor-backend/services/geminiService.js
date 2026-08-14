const { GoogleGenAI } = require("@google/genai");

const buildFallbackRecommendation = (universityData, reason = "AI service unavailable") => ({
  overallAssessment:
    "The university data was loaded successfully, but the live AI recommendation service is currently unavailable. The institution should continue with scheduled reviews and re-run the refresh once connectivity is restored.",
  criticalIssues: [
    {
      title: "AI recommendation temporarily unavailable",
      description: `The system could not generate a live recommendation because the AI service returned an error. This affects the latest advisory summary only, not the underlying university data.`,
      impact: "Directors may not receive the latest AI-based insight until the service is restored.",
      recommendedAction: "Verify the Gemini API key, network connectivity, and service availability, then refresh the recommendation again.",
    },
  ],
  warnings: [
    {
      title: "Monitoring required",
      description: `The request failed while generating a live recommendation for the university. The cause was: ${reason}.`,
      impact: "Decision support may be delayed until the AI service is restored.",
      recommendedAction: "Keep reviewing the institutional data manually and retry the AI refresh after the service is healthy.",
    },
  ],
  performanceInsights: [
    {
      title: "Data integrity confirmed",
      description: "The university dataset was retrieved successfully even though the live AI model could not complete the advisory generation.",
      recommendedAction: "Continue monitoring institutional performance from the dashboard while the AI service is unavailable.",
    },
  ],
  positiveFindings: [
    {
      title: "System remains operational",
      description: "The AOR and dashboard data pipeline is still active, which allows institutional monitoring to continue despite the temporary AI outage.",
    },
  ],
  priorityActions: [
    {
      priority: "High",
      action: "Restore the AI service and re-run the summary refresh.",
      reason: "The system cannot provide the latest AI-generated advice until the external model is reachable again.",
      destination: "approvals",
    },
  ],
});

const ai = new GoogleGenAI({
apiKey: process.env.GEMINI_API_KEY,
});

const generateDirectorAdvice = async (
universityData
) => {
const prompt = `
You are an intelligent university management and decision-support assistant.

Analyse the university Assignment of Responsibility Management System data below.

Your job is to identify important institutional problems, risks, positive developments, and actionable recommendations for the Director.

University Data:

${JSON.stringify(universityData, null, 2)}

Return ONLY valid JSON.

Use exactly this structure:

{
"overallAssessment": "A concise professional assessment of the current university situation.",

"criticalIssues": [
{
"title": "Short title of the critical issue",
"description": "Clear explanation of the problem",
"impact": "How this issue affects the university",
"recommendedAction": "Specific action the Director should take"
}
],

"warnings": [
{
"title": "Short warning title",
"description": "Explanation of the potential concern",
"impact": "Possible consequence",
"recommendedAction": "Recommended preventive action"
}
],

"performanceInsights": [
{
"title": "Insight title",
"description": "Important performance observation",
"recommendedAction": "Suggested action"
}
],

"positiveFindings": [
{
"title": "Positive finding title",
"description": "Explanation of the positive development"
}
],

"priorityActions": [
{
"priority": "High",
"action": "Specific action required",
"reason": "Why this should be prioritised"
"destination": "approvals"
}
]
}

Rules:

1. Be professional and suitable for university management.
2. Do not invent statistics.
3. Base all findings only on the supplied university data.
4. Identify retirement risks where relevant.
5. Identify submission and approval problems.
6. Identify performance differences between schools or departments where available.
7. Recognise positive institutional performance where supported by the data.
8. Recommendations must be practical and actionable.
9. Critical issues should only contain serious issues requiring attention.
10. Warnings should identify developing risks.
11. Priority actions should be ordered from most important to least important.
12. Return JSON only.
13. Do not include markdown.
14. Do not wrap the JSON in code blocks.
    `;

try {
const response =
await ai.models.generateContent({
model: "gemini-3.6-flash",
contents: prompt,
});

const text =
  response.text?.trim();

if (!text) {
  throw new Error(
    "Gemini returned an empty response."
  );
}


const cleanedText = text
  .replace(/^```json\s*/i, "")
  .replace(/^```\s*/i, "")
  .replace(/\s*```$/i, "")
  .trim();

const recommendation =
  JSON.parse(cleanedText);

return recommendation;


}
 catch (error) {
  const reason = error?.message || "unknown AI provider error";
  console.error("Gemini Error:", reason);

  return buildFallbackRecommendation(universityData, reason);
}

};

module.exports = {
generateDirectorAdvice,
};
