require('dotenv').config();

const { generateDirectorAdvice } = require('./services/geminiService');

(async () => {
  try {
    const sampleData = {
      summary: 'Test payload for Gemini connectivity check',
      schools: [],
      submissions: [],
    };

    const result = await generateDirectorAdvice(sampleData);

    console.log('=== Gemini Test Result ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Gemini test error:', error);
    process.exit(1);
  }
})();
