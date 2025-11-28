/**
 * 🔄 MIGRATION TO MULTI-LLM SERVICE
 * 
 * This service now uses the new llmService for multi-provider support with automatic fallback.
 * All functions have been updated to use callLLM instead of direct Gemini API calls.
 * 
 * Supports: Gemini (primary), Groq (fallback), Perplexity (web), Mistral (optional)
 */

import { callLLM, PROVIDERS } from './llmService';

// Legacy function for backward compatibility
// Now routes through llmService with multi-provider support
async function callGeminiAPI(prompt, apiKey, config = {}) {
  // Note: apiKey parameter is now ignored as llmService manages keys internally
  return await callLLM(prompt, {
    feature: config.feature || 'general',
    temperature: config.temperature || 0.7,
    maxTokens: config.maxOutputTokens || 4096,
    systemPrompt: config.systemPrompt || null
  });
}

export async function generateTeacherMode(content, apiKey = null, languageHint = null) {
  // V3.0.3: Accept optional language hint from manual selection
  const languageInstruction = languageHint 
    ? `LANGUAGE: This content is in ${languageHint}. Provide explanation in ${languageHint}.`
    : `IMPORTANT INSTRUCTION:
- Detect the language of the content above
- Provide explanation in the SAME LANGUAGE as the textbook content
- If Telugu, explain in Telugu. If Hindi, explain in Hindi. If English, explain in English.`;
  
  // Determine if this is a long chapter or a single page
  const isChapter = content && content.length > 5000;
  const contentType = isChapter ? 'Chapter' : 'Page';
  const maxLength = isChapter ? 30000 : 5000;
  const truncatedContent = content.substring(0, maxLength);
  
  const prompt = `You are an experienced teacher helping students understand textbook content.

${contentType} Content:
${truncatedContent}

${languageInstruction}

${isChapter ? `
NOTE: This is a FULL CHAPTER. Provide:
- A comprehensive summary of the entire chapter's key concepts
- Important themes and main ideas
- Connections between different sections
- Broader context and applications
` : `
NOTE: This is a SINGLE PAGE. Provide:
- Focused explanation of this specific page
- Key concepts on this page
- Direct examples related to this content
`}

Return ONLY this valid JSON (no extra text before or after):
{
  "summary": "${isChapter ? 'Comprehensive chapter summary' : 'Brief page summary'} in the SAME LANGUAGE (${isChapter ? '5-7' : '2-3'} sentences with <p> tags)",
  "keyPoints": ["${isChapter ? '5-8 major themes/concepts' : '3-5 key points'} in same language"],
  "explanation": "Detailed ${isChapter ? 'chapter overview' : 'page explanation'} in the SAME LANGUAGE (use <p>, <b>, <ul>, <li> tags for rich formatting)",
  "examples": "Real-world examples and applications in same language (use <p> tags)",
  "exam": "Exam tips and important topics to remember in same language (use <p> and <ul><li> tags)"
}

IMPORTANT: 
- Return ONLY the JSON object
- No explanations, no markdown code blocks, just valid JSON
- Use HTML tags (<p>, <b>, <ul>, <li>, <strong>) for formatting
- Make it ${isChapter ? 'comprehensive, well-organized, and covering all major concepts' : 'clear, focused, and engaging'}!`;

  return await callLLM(prompt, {
    feature: 'teacherMode',
    temperature: 0.7,
    maxTokens: isChapter ? 6144 : 4096, // More tokens for chapter explanations
    languageHint // Pass language hint to callLLM for provider selection
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

  return await callLLM(prompt, {
    feature: 'resources',
    temperature: 0.5,
    maxTokens: 4096
  });
}

export async function translateExplanationToEnglish(explainContent, apiKey = null) {
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

  return await callLLM(prompt, {
    feature: 'explain',
    temperature: 0.5,
    maxTokens: 6144
  });
}

export async function generateReadAndUnderstand(paragraphText, withExplanation, apiKey = null) {
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

  return await callLLM(prompt, {
    feature: 'explain',
    temperature: 0.3,
    maxTokens: 2048
  });
}

export async function generateExplanation(selectedText, contextText, apiKey = null) {
  // Handle case where contextText might be an array (priorContext) or string
  const contextString = Array.isArray(contextText) 
    ? contextText.map(p => `Page ${p.pageNumber}: ${p.summary}`).join('\n')
    : (typeof contextText === 'string' ? contextText : '');
  
  const prompt = `🎓 EDUCATIONAL CONTENT ANALYZER

🔴 CRITICAL LANGUAGE INSTRUCTION:
The content below is from an Indian textbook and may contain:
- Telugu script (తెలుగు): Unicode range U+0C00 to U+0C7F
- Hindi/Devanagari (हिंदी): Unicode range U+0900 to U+097F  
- Tamil (தமிழ்): Unicode range U+0B80 to U+0BFF
- Other regional Indian languages

⚠️ DO NOT say the content is "corrupted" or "encoded"! 
These are VALID Unicode characters used in Indian education.
PROCESS THE CONTENT NORMALLY.

📚 LANGUAGE HANDLING (V3.0.3 - Simplified):
- If content is in Telugu → Explain in Telugu ONLY (no English translation for steps)
- If content is in Hindi → Explain in Hindi ONLY (no English translation for steps)
- If content is in Tamil → Explain in Tamil ONLY (no English translation for steps)
- If content is in English → Explain in English only

⚠️ CRITICAL: For regional languages, provide step-by-step solutions ONLY in the original language.
Students who can read Telugu/Hindi/Tamil don't need bilingual step-by-step explanations.

${contextString ? `PRIOR CONTEXT (for answering exercises):\n${contextString}\n\n` : ''}

📖 CONTENT TO ANALYZE:
${selectedText}

ANALYSIS RULES:
1. Detect content type: exercise|notes|regular
2. For exercises: provide complete step-by-step solutions using prior context
3. For "Draw" commands: provide actual visualizations in visualAid field
4. Identify important notes in highlighted boxes

VISUALIZATION FORMATS:
- Chart: {"chartType":"pie|bar|line","data":{"labels":[...],"datasets":[{...}]}}
- 3D: {"type":"3d","shapeType":"cube|sphere","color":"#4FC3F7","dimensions":{...}}
- SVG: <svg viewBox="0 0 400 300">...</svg>

🔴 CRITICAL: If step says "Draw X", visualAid MUST contain the actual drawing (Chart.js JSON, SVG, or 3D JSON). NOT empty!

Return ONLY this JSON (no markdown blocks):

FOR REGIONAL LANGUAGES (Telugu/Hindi/Tamil/etc):
{
  "contentType": "exercise|notes|regular",
  "language": "Telugu|Hindi|Tamil|etc",
  "explanation": "Clear explanation in ORIGINAL language (తెలుగు/हिंदी/தமிழ்)",
  "exercises": [{
    "question": "Question in original language",
    "answer": "Complete answer in original language",
    "hints": ["Hint 1 in original language"],
    "steps": [{
      "text": "Step in original language ONLY (no English needed)",
      "visualAid": "Chart.js JSON / SVG / 3D JSON (if drawing required)"
    }]
  }],
  "importantNotes": [{
    "title": "Note title in original language",
    "content": "Note content in original language",
    "type": "definition|formula|reminder"
  }],
  "analogy": "Helpful analogy in original language",
  "pyq": "Exam question in original language"
}

FOR ENGLISH:
{
  "contentType": "exercise|notes|regular",
  "language": "English",
  "explanation": "Clear explanation in English",
  "exercises": [{
    "question": "Question in English",
    "answer": "Complete answer",
    "hints": ["Hint 1"],
    "steps": [{
      "text": "Step in English",
      "visualAid": "Chart.js JSON / SVG / 3D JSON (if drawing required)"
    }]
  }],
  "importantNotes": [{
    "title": "Note title",
    "content": "Note content",
    "type": "definition|formula|reminder"
  }],
  "analogy": "Helpful analogy",
  "pyq": "Exam question"
}

KEEP IT CONCISE. Use visuals for complex concepts. NO BILINGUAL for step-by-step solutions.`;

  return await callLLM(prompt, {
    feature: 'explain',
    temperature: 0.7,
    maxTokens: 6144  // Reduced from 8192 for speed
  });
}

export async function generateActivities(pageText, apiKey = null) {
  const prompt = `IMPORTANT LANGUAGE INSTRUCTION (V3.0.3 - Simplified):
- First, detect the language of the Page Content below
- If the content is in a regional language (Telugu, Hindi, Tamil, etc.), provide content in ORIGINAL LANGUAGE ONLY
- If the content is already in English, only provide English content

⚠️ STUDENTS READING REGIONAL LANGUAGE PDFs UNDERSTAND THAT LANGUAGE
⚠️ NO NEED FOR BILINGUAL ACTIVITIES - USE ORIGINAL LANGUAGE ONLY

Page Content:
${pageText}

Generate engaging learning activities based on this content. Use the SAME LANGUAGE as the content.

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
For regional language content, use the ORIGINAL LANGUAGE ONLY (students reading Telugu PDFs understand Telugu).
Return ONLY the JSON.`;

  return await callLLM(prompt, {
    feature: 'activities',
    temperature: 0.7,
    maxTokens: 6144
  });
}

export async function generateAdditionalResources(selectedText, contextText, apiKey = null) {
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

  return await callLLM(prompt, {
    feature: 'resources',
    temperature: 0.7,
    maxTokens: 3072
  });
}

export async function generateWordByWordAnalysis(pageText, apiKey = null, excludeWords = '', batchNumber = 1) {
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

  return await callLLM(prompt, {
    feature: 'explain',
    temperature: 0.7,
    maxTokens: 8192
  });
}

/**
 * Generate Exam Preparation Questions
 * @param {string} fullPdfText - Complete text from all pages
 * @param {string} currentChunk - Current text chunk being processed
 * @param {number} chunkNumber - Current chunk number
 * @param {number} totalChunks - Total number of chunks
 * @returns {Promise<Object>} - Exam questions in structured format
 */
export const generateExamPrep = async (fullPdfText, currentChunk, chunkNumber, totalChunks) => {
  const prompt = `Expert exam creator. Generate questions from this text.

LANGUAGE INSTRUCTION:
- Detect the language of the text (Telugu, Hindi, Tamil, English, etc.)
- If regional language: provide BILINGUAL content (original + English)
- If already English: provide only English

TEXT (Chunk ${chunkNumber}/${totalChunks}):
${currentChunk.substring(0, 2500)}

JSON format (for regional languages, include both "original" and "english" fields):
{
  "mcqs": [
    {
      "assertion": { "original": "తెలుగులో", "english": "In English" },
      "reason": { "original": "తెలుగులో", "english": "In English" },
      "correctAnswer": 0,
      "explanation": { "original": "తెలుగులో", "english": "In English" }
    }
  ],
  "shortAnswer": [
    {
      "question": { "original": "తెలుగులో", "english": "In English" },
      "answer": { "original": "తెలుగులో", "english": "In English" },
      "keywords": ["term1", "term2"]
    }
  ],
  "longAnswer": [
    {
      "question": { "original": "తెలుగులో", "english": "In English" },
      "hints": [{ "original": "తెలుగులో", "english": "In English" }],
      "pageReferences": [1]
    }
  ]
}

For ENGLISH content ONLY, use simple strings:
{
  "mcqs": [{ "assertion": "text", "reason": "text", "correctAnswer": 0, "explanation": "text" }],
  "shortAnswer": [{ "question": "text", "answer": "text", "keywords": ["term1"] }],
  "longAnswer": [{ "question": "text", "hints": ["hint"], "pageReferences": [1] }]
}

Generate:
- 3 MCQs (Assertion & Reasoning)
- 3 Short Answer (with answers)
- 2 Long Answer (with hints)

MCQ Options (always same):
0: Both A and R true, R explains A
1: Both A and R true, R doesn't explain A
2: A true, R false
3: A false, R true

Return ONLY JSON, no markdown.`;

  const response = await callLLM(prompt, {
    feature: 'examPrep',
    temperature: 0.7,
    maxTokens: 4096
  });

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    }
    
    const parsed = JSON.parse(cleanedResponse);
    return parsed;
  } catch (error) {
    console.error('Error parsing exam prep JSON:', error);
    throw new Error('Failed to parse exam preparation data');
  }
};

/**
 * Generate answer for a long answer question
 * @param {string} question - The question to answer
 * @param {string} fullPdfText - Complete text from all pages
 * @param {Array<number>} pageReferences - Page numbers to focus on
 * @returns {Promise<string>} - Generated answer
 */
export const generateLongAnswer = async (question, fullPdfText, pageReferences = [], hints = []) => {
  // V3.0: OPTIMIZED - Use smart context instead of full PDF text
  // Only use first 6000 chars for better token efficiency
  const contextText = fullPdfText.substring(0, 6000);
  
  // Detect if question is bilingual (has "original" and "english" fields)
  const isBilingual = typeof question === 'object' && question.original && question.english;
  const questionText = isBilingual ? question.english : (typeof question === 'string' ? question : JSON.stringify(question));
  const originalQuestion = isBilingual ? question.original : '';
  
  const prompt = `Generate a comprehensive exam answer for this question:

${isBilingual ? `QUESTION (Original Language): ${originalQuestion}\n` : ''}QUESTION (English): ${questionText}

${hints && hints.length > 0 ? `HINTS:
${hints.map((h, i) => {
  if (typeof h === 'object' && h.english) {
    return `${i + 1}. ${h.original} / ${h.english}`;
  }
  return `${i + 1}. ${h}`;
}).join('\n')}` : ''}

${pageReferences && pageReferences.length > 0 ? `REFERENCE PAGES: ${pageReferences.join(', ')}` : ''}

RELEVANT CONTENT FROM PDF:
${contextText}

LANGUAGE INSTRUCTION:
${isBilingual ? `- This is a BILINGUAL question from a regional language (Telugu/Hindi/Tamil) textbook
- Provide answer in BOTH languages
- Return JSON format: 
{
  "original": "తెలుగులో లేదా हिंदी में पूरा उत्तर...",
  "english": "Complete answer in English..."
}` : `- This is an English question
- Provide answer in English only (plain text, not JSON)`}

REQUIREMENTS:
- Comprehensive, well-structured answer (250-350 words)
- Use the hints provided to guide your answer
- Academic language appropriate for exams
- Clear points with proper explanations
- Use ** for bold text (important terms)
- Include relevant examples from the content
- Structure: introduction, main points with explanations, conclusion
- If page references provided, prioritize that content

Generate a model answer that would score full marks:`;

  const response = await callLLM(prompt, {
    feature: 'longAnswer',
    temperature: 0.7,
    maxTokens: 3072  // V3.0: Increased from 2048 for longer answers
  });

  return response;
};

const geminiService = {
  generateTeacherMode,
  translateTeacherModeToEnglish,
  generateExplanation,
  generateActivities,
  generateAdditionalResources,
  generateReadAndUnderstand,
  generateWordByWordAnalysis,
  generateExamPrep,
  generateLongAnswer
};

export default geminiService;
