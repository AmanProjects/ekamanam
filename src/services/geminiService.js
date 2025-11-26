const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGeminiAPI(prompt, apiKey, config = {}) {
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
      }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxOutputTokens || 4096
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate response');
  }

  const data = await response.json();
  
  // Check if response has candidates
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    console.error('Invalid API response:', data);
    throw new Error('No response from AI - candidates array is missing or empty');
  }
  
  // Check for safety blocks or other issues
  const candidate = data.candidates[0];
  if (!candidate) {
    throw new Error('No response from AI');
  }
  
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Content was blocked by AI safety filters');
  }
  
  if (candidate.finishReason === 'RECITATION') {
    throw new Error('AI detected copyrighted content');
  }
  
  // Check if truncated due to token limit
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('⚠️ Response was truncated due to token limit.');
    throw new Error('Response truncated - try with smaller text chunk or increase maxOutputTokens');
  }
  
  // Safely access the text content
  if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
    console.error('Invalid candidate structure:', candidate);
    throw new Error('Response structure is invalid - parts array is missing');
  }
  
  const text = candidate.content.parts[0]?.text || '';
  
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from AI');
  }
  
  return text;
}

export async function generateTeacherMode(pageText, apiKey) {
  const prompt = `You are an experienced teacher helping students understand textbook content.

Page Content:
${pageText}

IMPORTANT INSTRUCTION:
- Detect the language of the Page Content above
- Provide explanation in the SAME LANGUAGE as the textbook content
- If Telugu, explain in Telugu. If Hindi, explain in Hindi. If English, explain in English.

Return ONLY this valid JSON (no extra text before or after):
{
  "summary": "Brief summary in the SAME LANGUAGE as the textbook (2-3 sentences with <p> tags)",
  "keyPoints": ["point 1 in same language", "point 2 in same language", "point 3 in same language"],
  "explanation": "Detailed explanation in the SAME LANGUAGE (use <p> and <b> tags for formatting)",
  "examples": "Real-world examples in same language (use <p> tags)",
  "exam": "Exam tips in same language (use <p> and <ul><li> tags)"
}

IMPORTANT: Return ONLY the JSON object. No explanations, no markdown code blocks, just valid JSON. Make it engaging, clear, and helpful for students!`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.7,
    maxOutputTokens: 4096
  });
}

export async function translateTeacherModeToEnglish(teacherContent, apiKey) {
  const prompt = `You are a translator. Translate the following teacher explanation to English.

Original Content (JSON):
${JSON.stringify(teacherContent)}

Return ONLY this valid JSON translation (no extra text before or after):
{
  "summary_english": "English translation of summary (2-3 sentences with <p> tags)",
  "keyPoints_english": ["point 1 in English", "point 2 in English", "point 3 in English"],
  "explanation_english": "Detailed explanation in English (use <p> and <b> tags for formatting)",
  "examples_english": "Real-world examples in English (use <p> tags)",
  "exam_english": "Exam tips in English (use <p> and <ul><li> tags)"
}

IMPORTANT: Return ONLY the JSON object with English translations. No explanations, no markdown code blocks, just valid JSON.`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.5,
    maxOutputTokens: 4096
  });
}

export async function translateExplanationToEnglish(explainContent, apiKey) {
  const prompt = `You are a translator. Translate the following explanation content to English.

Original Content (JSON):
${JSON.stringify(explainContent)}

Return ONLY this valid JSON translation (no extra text before or after):
{
  "explanation_english": "English translation of explanation",
  "analogy_english": "English translation of analogy",
  "pyq_english": "English translation of exam question",
  "exercises_english": [
    {
      "question": "Exercise question in English",
      "hints": ["Hint 1 in English", "Hint 2 in English"],
      "answerLocation": "Answer location in English",
      "keyTerms": ["terms in English"]
    }
  ],
  "importantNotes_english": [
    {
      "title": "Note title in English",
      "content": "Note content in English",
      "type": "same type"
    }
  ]
}

IMPORTANT: 
- Return ONLY the JSON object with English translations
- No markdown code blocks, just valid JSON
- Preserve all structure and types
- Translate all text content to English`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.5,
    maxOutputTokens: 6144
  });
}

export async function generateReadAndUnderstand(paragraphText, withExplanation, apiKey) {
  const prompt = withExplanation ? 
    `You are helping students read an educational textbook. The text below was extracted using OCR (Optical Character Recognition) from a PDF.

OCR EXTRACTED TEXT:
${paragraphText}

YOUR TASK:
1. The text is from a Telugu (తెలుగు) / Hindi (हिंदी) / Tamil (தமிழ்) / English educational textbook
2. Clean up any OCR errors (spelling mistakes, spacing issues, etc.)
3. Present the text clearly in its original language
4. Provide a clear English explanation

Return JSON (no code blocks):
{
  "original": "Cleaned and properly formatted text in original language",
  "explanation": "Clear English explanation of what this paragraph discusses"
}` :
    `You are helping students read an educational textbook. The text below was extracted using OCR from a PDF.

OCR EXTRACTED TEXT:
${paragraphText}

TASK:
1. Clean up any OCR errors
2. Present the text properly in its original language (Telugu/Hindi/Tamil/English)

Return JSON:
{
  "original": "Cleaned text in original language"
}`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.3,
    maxOutputTokens: 2048
  });
}

export async function generateExplanation(selectedText, contextText, apiKey) {
  // Handle case where contextText might be an array (priorContext) or string
  const contextString = Array.isArray(contextText) 
    ? contextText.map(p => `Page ${p.pageNumber}: ${p.summary}`).join('\n')
    : (typeof contextText === 'string' ? contextText : '');
  
  const prompt = `You are an expert tutor. Analyze this educational content and provide a clear, structured explanation with visuals where helpful.

${contextString ? `PRIOR CONTEXT:\n${contextString}\n\n` : ''}

CONTENT TO ANALYZE:
"${selectedText}"

INSTRUCTIONS:
1. Detect language and respond in the SAME language
2. For regional languages: provide bilingual content (original + English)
3. For English: provide only English (no duplicate translations)
4. Identify content type: exercise, notes, or regular content
5. For exercises: provide complete step-by-step solutions with visuals
6. For "Draw" questions: MUST include visualizations

VISUALIZATION RULES:
- Use Chart.js for: pie/bar/line charts (data, statistics)
- Use 3D shapes for: "Draw a cube/sphere/pyramid" → {"type":"3d","shapeType":"cube",...}
- Use Plotly for: 3D graphs, surfaces → {"type":"plotly",...}
- Use Chemistry for: molecules → {"type":"chemistry","moleculeData":"water",...}
- Use SVG for: simple 2D shapes, angles, triangles
- Progressive visuals: Each step builds on previous (different visuals per step)
- Only add visuals when they ADD VALUE

Return ONLY valid JSON (no markdown, no extra text):
{
  "contentType": "exercise" | "notes" | "regular" | "mixed",
  "language": "Detected language name (Telugu, Hindi, Tamil, English, etc.)",
  "explanation": "Clear explanation in proper Unicode (NOT garbled characters)",
  "explanation_english": "English translation of explanation",
  "exercises": [
    {
      "question": "The exercise question in proper script",
      "question_english": "Question in English",
      "answer": "Complete answer to the question in original language",
      "answer_english": "Complete answer in English",
      "hints": ["Hint 1 in original language", "Hint 2"],
      "hints_english": ["Hint 1 in English", "Hint 2 in English"],
      "answerLocation": "Page reference if available from context",
      "answerLocation_english": "Page reference in English",
      "steps": [
        {
          "text": "Step 1 in original language",
          "text_english": "Step 1 in English",
          "visualAid": "SVG/HTML for THIS SPECIFIC step (only if it adds value, can be empty string)"
        },
        {
          "text": "Step 2 in original language",
          "text_english": "Step 2 in English", 
          "visualAid": "Different visual showing PROGRESSION from step 1"
        }
      ],
      "keyTerms": ["key", "terms"]
    }
  ],
  "importantNotes": [
    {
      "title": "Note title",
      "title_english": "Note title in English",
      "content": "Note content in proper script",
      "content_english": "Note content in English",
      "type": "definition" | "formula" | "reminder" | "warning"
    }
  ],
  "analogy": "Helpful analogy in same language",
  "analogy_english": "Analogy in English",
  "pyq": "Example exam question",
  "pyq_english": "Example exam question in English",
  "demo": "Interactive HTML demo if applicable, or empty string"
}

VISUALIZATION QUICK REFERENCE:
- 2D Chart: {"chartType":"pie|bar|line","data":{...}}
- 3D Shape: {"type":"3d","shapeType":"cube|sphere|pyramid","color":"#4FC3F7","dimensions":{...},"title":"..."}
- 3D Plot: {"type":"plotly","data":[{"type":"surface","x":[...],"y":[...],"z":[...]}],"title":"..."}
- Chemistry: {"type":"chemistry","moleculeData":"water|methane|benzene","format":"smiles","title":"..."}
- 2D SVG: <svg viewBox="0 0 400 300">...</svg>

EXAMPLES:
Cube: {"type":"3d","shapeType":"cube","color":"#4FC3F7","dimensions":{"width":2},"title":"Cube"}
Pie: {"chartType":"pie","data":{"labels":["A","B"],"datasets":[{"data":[60,40],"backgroundColor":["#FF6384","#36A2EB"]}]}}
Paraboloid: {"type":"plotly","data":[{"type":"surface","z":[[0,1,4],[1,2,5],[4,5,8]]}],"title":"z=x²+y²"}

CRITICAL RULES:
- Clean Unicode (no garbled text)
- Bilingual: Regional language + English (skip English duplicate if content already English)
- Complete answers for exercises (not just hints)
- Progressive visuals: each step different, showing progression
- Only include visuals when valuable (not forced on every step)
- "Draw" questions MUST have visuals

JSON STRUCTURE:

{
  "contentType": "exercise|notes|regular|mixed",
  "language": "Detected language",
  "explanation": "Clear explanation in original language",
  "explanation_english": "English translation (empty if already English)",
  "exercises": [
    {
      "question": "Question in original language",
      "question_english": "Question in English (empty if already English)",
      "answer": "Complete answer",
      "answer_english": "Answer in English",
      "hints": ["Hint 1", "Hint 2"],
      "hints_english": ["Hint 1 English", "Hint 2 English"],
      "answerLocation": "Page reference",
      "steps": [
        {
          "text": "Step description",
          "text_english": "Step in English",
          "visualAid": "JSON or SVG (empty string if not needed)"
        }
      ],
      "keyTerms": ["term1", "term2"]
    }
  ],
  "importantNotes": [
    {
      "title": "Note title",
      "title_english": "Title English",
      "content": "Note content",
      "content_english": "Content English",
      "type": "definition|formula|reminder|warning"
    }
  ],
  "analogy": "Helpful analogy",
  "analogy_english": "Analogy English",
  "pyq": "Exam question",
  "pyq_english": "Exam question English"
}

IMPORTANT: Keep response concise. Students need answers, not walls of text. Use visuals to explain complex concepts.`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.7,
    maxOutputTokens: 8192
  });
}

export async function generateActivities(pageText, apiKey) {
  const prompt = `IMPORTANT LANGUAGE INSTRUCTION:
- First, detect the language of the Page Content below
- If the content is in a regional language (Telugu, Hindi, Tamil, etc.), provide BILINGUAL content (original language + English) to help non-native students
- If the content is already in English, only provide English content

Page Content:
${pageText}

Generate engaging learning activities based on this content. For regional language content, provide BILINGUAL format.

Return ONLY this valid JSON (no extra text before or after):
{
  "mcqs": [
    {
      "question": {
        "original": "MCQ question in original language (empty if English)",
        "english": "MCQ question in English"
      },
      "options": {
        "original": ["Option A in original language", "Option B", "Option C", "Option D"],
        "english": ["Option A in English", "Option B", "Option C", "Option D"]
      },
      "correctAnswer": {
        "original": "Correct option in original language",
        "english": "Correct option in English"
      },
      "explanation": {
        "original": "Explanation in original language (empty if English)",
        "english": "Explanation in English"
      }
    }
  ],
  "practiceQuestions": [
    {
      "original": "Question in original language if not English, otherwise empty string",
      "english": "Question in English"
    }
  ],
  "handsOnActivities": [
    {
      "original": "Activity description in original language (empty if English)",
      "english": "Activity description in English"
    }
  ],
  "discussionPrompts": [
    {
      "original": "Prompt in original language (empty if English)",
      "english": "Prompt in English"
    }
  ],
  "realWorldApplications": [
    {
      "original": "Application in original language (empty if English)",
      "english": "Application in English"
    }
  ]
}

Generate 5 MCQs, 5 practice questions, 3 hands-on activities, 3 discussion prompts, and 3 real-world applications.
For regional language content, provide BOTH original language and English for everything to help non-native students learn.
Return ONLY the JSON.`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.7,
    maxOutputTokens: 6144
  });
}

export async function generateAdditionalResources(selectedText, contextText, apiKey) {
  // Handle case where contextText might be an array (priorContext) or string
  const contextString = Array.isArray(contextText) 
    ? contextText.map(p => `Page ${p.pageNumber}: ${p.summary}`).join('\n')
    : (typeof contextText === 'string' ? contextText : '');
    
  const prompt = `Based on this educational content, provide additional learning resources. First detect the language of the content, then provide practice questions in BOTH the original language AND English.

Selected Text:
"${selectedText}"

Context:
${contextString ? contextString.substring(0, 500) : 'No context'}

Return ONLY this JSON:
{
  "webResources": [
    {
      "title": "Resource title", 
      "url": "https://example.com/full-url", 
      "type": "article/video/tutorial", 
      "description": "Brief description"
    }
  ],
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

IMPORTANT: 
- For webResources, provide REAL, working URLs to educational websites, Wikipedia, Khan Academy, etc.
- For practiceQuestions, if the content is in a regional language (Hindi, Telugu, Tamil, etc.), provide BOTH original language and English. If already in English, leave "original" as empty string.
- Generate 5 practice questions minimum.

Return ONLY the JSON.`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.7,
    maxOutputTokens: 3072
  });
}

export async function generateWordByWordAnalysis(pageText, apiKey, excludeWords = '', batchNumber = 1) {
  const sequentialInstruction = batchNumber === 1
    ? `\n\nEXTRACT WORDS SEQUENTIALLY: Start from the BEGINNING of the text and extract the first 10 important content words in the order they appear.`
    : `\n\nEXTRACT WORDS SEQUENTIALLY: You already covered these words: ${excludeWords}\nNow continue from where you left off and extract the NEXT 10 important words in sequential order.`;
  
  const prompt = `You are an expert in Indian languages. The text below is from a PDF and may appear garbled due to encoding issues. Your task is to:
1. INTERPRET the garbled text and understand its meaning
2. Return proper, clean Unicode words (NOT the garbled characters)
3. Extract words IN THE ORDER THEY APPEAR in the text (sequential, not random)
4. Provide pronunciation and English meaning

CRITICAL: DO NOT copy garbled characters. Write words in proper Unicode script.${sequentialInstruction}

Garbled text from PDF:
${pageText}

Return ONLY this valid JSON (no markdown, no extra text):
{
  "language": "Detected language",
  "summary": "1 sentence summary",
  "words": [
    {
      "word": "proper Unicode word (NOT garbled)",
      "pronunciation": "simple phonetic",
      "meaning": "brief English meaning",
      "partOfSpeech": "type"
    }
  ]
}

RULES:
- Extract exactly 10 words (batch ${batchNumber})
- Extract words IN SEQUENTIAL ORDER as they appear in the text
- Write words in proper Telugu/Hindi/Tamil script (clean Unicode)
- NO garbled or special characters like #·+Á or dü÷
- Focus on important content words (nouns, verbs, adjectives) but keep their sequential order
- Skip very common words (the, is, and, etc.) but maintain sequence
- Brief meanings (under 5 words)
- Simple pronunciation
- ONLY valid JSON (no code blocks)`;

  return await callGeminiAPI(prompt, apiKey, {
    temperature: 0.7,
    maxOutputTokens: 8192
  });
}

const geminiService = {
  generateTeacherMode,
  translateTeacherModeToEnglish,
  generateExplanation,
  generateActivities,
  generateAdditionalResources,
  generateReadAndUnderstand,
  generateWordByWordAnalysis
};

export default geminiService;
