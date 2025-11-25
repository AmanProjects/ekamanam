const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGeminiAPI(prompt, apiKey) {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate response');
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
}

export async function generateTeacherMode(pageText, apiKey) {
  const prompt = `You are an expert teacher explaining NCERT textbook content to students. 

Page Content:
${pageText}

Provide a comprehensive explanation of this page as if you're teaching in a classroom. Include:

1. **Overview**: Brief summary of what this page covers
2. **Key Concepts**: Explain the main ideas in simple terms
3. **Examples**: Give real-world examples to illustrate concepts
4. **Important Points**: Highlight crucial information students should remember
5. **Common Misconceptions**: Address common mistakes students make
6. **Exam Tips**: What might be asked in exams about this topic

Make it engaging, clear, and helpful for students studying this material.`;

  return await callGeminiAPI(prompt, apiKey);
}

export async function generateExplanation(selectedText, contextText, apiKey) {
  const prompt = `You are helping a student understand a specific part of their textbook.

Selected Text: "${selectedText}"

Context from the page:
${contextText}

Provide a detailed explanation that includes:

1. **Simple Explanation**: Explain in easy-to-understand language
2. **Analogy**: Provide a relatable analogy or example
3. **Why It Matters**: Explain the significance or application
4. **Related Concepts**: Mention how this connects to other topics
5. **Memory Tip**: Provide a mnemonic or tip to remember this

Be concise but thorough, and make it student-friendly.`;

  return await callGeminiAPI(prompt, apiKey);
}

export async function generateActivities(pageText, apiKey) {
  const prompt = `Based on the following textbook content, generate engaging learning activities:

Page Content:
${pageText}

Create three types of activities:

## 🎯 Research-Based Learning (RBL) Activities
1. [Activity 1]
2. [Activity 2]

## 🧩 Challenge-Based Learning (CBL) Activities
1. [Activity 1]
2. [Activity 2]

## 🔬 Scientific Enquiry Activities (SEA)
1. [Activity 1]
2. [Activity 2]

Make activities practical, engaging, and suitable for the content level.`;

  return await callGeminiAPI(prompt, apiKey);
}

const geminiService = {
  generateTeacherMode,
  generateExplanation,
  generateActivities
};

export default geminiService;

