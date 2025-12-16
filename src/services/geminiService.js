/**
 * 🔄 MIGRATION TO MULTI-LLM SERVICE
 * 
 * This service now uses the new llmService for multi-provider support with automatic fallback.
 * All functions have been updated to use callLLM instead of direct Gemini API calls.
 * 
 * Supports: Gemini (primary), Groq (fallback), Perplexity (web), Mistral (optional)
 * 
 * V3.1: REGIONAL LANGUAGE HANDLING
 * - Groq is TERRIBLE at Telugu/Hindi/Tamil (generates generic placeholder text)
 * - Gemini is EXCELLENT at all Indian languages
 * - We FORCE Gemini for all regional language content
 */

import { callLLM, PROVIDERS } from './llmService';

/**
 * Detect if content contains regional Indian language or if language hint suggests it
 * @param {string} content - Text content to analyze
 * @param {string} languageHint - Manual language selection (e.g., "Telugu (తెలుగు)")
 * @returns {boolean} - True if regional language detected
 */
function isRegionalLanguageContent(content = '', languageHint = null) {
  // Check language hint first (most reliable)
  if (languageHint) {
    const regionalLanguages = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 
                               'Bengali', 'Gujarati', 'Punjabi', 'Odia', 'Marathi'];
    if (regionalLanguages.some(lang => languageHint.includes(lang))) {
      return true;
    }
  }
  
  // Check for Unicode script ranges in content
  if (content && typeof content === 'string') {
    const hasDevanagari = /[\u0900-\u097F]/.test(content); // Hindi, Marathi
    const hasTelugu = /[\u0C00-\u0C7F]/.test(content);
    const hasTamil = /[\u0B80-\u0BFF]/.test(content);
    const hasBengali = /[\u0980-\u09FF]/.test(content);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(content);
    const hasGurmukhi = /[\u0A00-\u0A7F]/.test(content); // Punjabi
    const hasOriya = /[\u0B00-\u0B7F]/.test(content); // Odia
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(content);
    const hasKannada = /[\u0C80-\u0CFF]/.test(content);
    
    if (hasDevanagari || hasTelugu || hasTamil || hasBengali || hasGujarati || 
        hasGurmukhi || hasOriya || hasMalayalam || hasKannada) {
      return true;
    }
  }
  
  return false;
}

/**
 * Create config object that forces Gemini for regional languages
 * @param {string} feature - Feature name (teacherMode, explain, etc.)
 * @param {object} baseConfig - Base configuration
 * @param {string} content - Content to analyze
 * @param {string} languageHint - Language hint
 * @returns {object} - Configuration with preferredProvider set if needed
 */
function createLLMConfig(feature, baseConfig, content = '', languageHint = null) {
  const config = { ...baseConfig, feature };
  
  // FORCE Gemini for regional languages (Groq is bad at Telugu/Hindi/Tamil)
  if (isRegionalLanguageContent(content, languageHint)) {
    config.preferredProvider = PROVIDERS.GEMINI;
    const langName = languageHint || 'Regional Language';
    console.log(`🌐 [${feature}] ${langName} detected → FORCING Gemini (Groq is bad at this)`);
  }
  
  return config;
}

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
  // V3.1: Detect if this is a regional language (Telugu, Hindi, etc.)
  const isRegionalLanguage = languageHint && (
    languageHint.includes('Telugu') ||
    languageHint.includes('Hindi') ||
    languageHint.includes('Tamil') ||
    languageHint.includes('Kannada') ||
    languageHint.includes('Malayalam') ||
    languageHint.includes('Bengali') ||
    languageHint.includes('Gujarati') ||
    languageHint.includes('Punjabi') ||
    languageHint.includes('Odia') ||
    languageHint.includes('Marathi')
  );
  
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
  
  const prompt = `You are an EXCEPTIONAL teacher who brings learning to life! Your explanations should be engaging, memorable, and perfectly suited to the content type.

${contentType} Content:
${truncatedContent}

${languageInstruction}

🎯 CRITICAL: CONTENT TYPE DETECTION & ADAPTATION

FIRST, analyze the content and determine its type:
- 📜 **RHYME/NURSERY RHYME**: Short, rhythmic verses for young children (look for: simple words, repetition, AABB/ABAB patterns, playful themes)
- 📝 **POEM**: Artistic expression with deeper meaning (look for: literary devices, metaphors, emotions, structured stanzas)
- 📖 **STORY/NARRATIVE**: A tale with characters, plot, beginning-middle-end
- 🔬 **ACADEMIC/SCIENCE**: Facts, concepts, formulas, explanations
- 📊 **HISTORICAL/SOCIAL**: Events, dates, places, social concepts
- 🎨 **CREATIVE/ACTIVITY**: Art, craft, or activity instructions

THEN adapt your explanation style accordingly:

🎵 FOR RHYMES/NURSERY RHYMES:
- Explain that this is meant to be SUNG with a melody (suggest the tune if popular)
- Describe the rhythm pattern (clap-clap-clap rhythm, bouncy beat, etc.)
- Use words like "Let's sing together!" "This rhyme goes like this..."
- Explain actions/gestures that go with the rhyme
- Make it FUN and PLAYFUL - use emojis, enthusiasm!
- Example: "🎶 This is a delightful rhyme that should be sung with a bouncy rhythm! Clap your hands as you say each line..."

📝 FOR POEMS:
- Describe how it should be RECITED with expression and emotion
- Explain the rhythm and meter (iambic, free verse, etc.)
- Highlight where to pause, emphasize, whisper, or raise voice
- Discuss the imagery and deeper meaning
- Example: "📖 This beautiful poem should be read slowly, letting each word paint a picture in your mind. Pause at the commas..."

📖 FOR STORIES:
- Describe this as a tale to be TOLD with animation and expression
- Suggest character voices and dramatic moments
- Build suspense and excitement in your explanation
- Use storytelling language: "Once upon a time...", "And then, something magical happened..."
- Example: "📚 This is a wonderful story that comes alive when you tell it with different voices for each character..."

🔬 FOR ACADEMIC CONTENT:
- Be clear, structured, and informative
- Use analogies and real-world examples
- Break complex topics into digestible parts

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
  "contentType": "rhyme|poem|story|academic|historical|creative",
  "performanceStyle": "How this content should be performed/delivered - be specific! For rhymes: describe the tune, rhythm, actions. For poems: describe recitation style. For stories: describe how to tell it engagingly.",
  "summary": "${isChapter ? 'Comprehensive chapter summary' : 'Brief summary that captures the essence'} in the SAME LANGUAGE (${isChapter ? '5-7' : '2-3'} sentences with <p> tags). For rhymes/poems, include the mood and feeling.",
  "keyPoints": ["${isChapter ? '5-8 major themes/concepts' : '3-5 key points'} in same language - for creative content, include performance tips"],
  "explanation": "${isChapter ? 
    'COMPREHENSIVE chapter overview (500-800 words).' : 
    'Detailed, ENGAGING explanation (200-400 words) that brings the content to life.'
  } in the SAME LANGUAGE. 
  
  FOR RHYMES: Include rhythm markings (/ for stress), suggest melody if known, describe hand actions, make it sound FUN!
  FOR POEMS: Include recitation guidance, emotional beats, pauses, and interpretation.
  FOR STORIES: Retell with drama, suggest character voices, build excitement!
  FOR ACADEMIC: Clear explanations with examples.
  
  Use <p>, <b>, <ul>, <li>, <h4> tags for rich formatting",
  "examples": "${isChapter ? 'Multiple real-world examples from different sections' : 'Engaging examples and connections to child\'s world'} in same language (use <p> tags). For rhymes/poems: include similar rhymes they might know. For stories: connect to familiar tales.",
  "exam": "${isChapter ? 'Comprehensive exam strategy' : 'What to remember and how to recite/perform if applicable'} in same language (use <p> and <ul><li> tags). For creative content, include performance tips for recitation competitions.",
  "flashcards": [
    {
      "front": "Question or concept to remember (in same language as content)",
      "back": "Answer or explanation (concise, memorable)",
      "tags": ["relevant", "topic", "tags"]
    }
  ]
}

📚 FLASHCARD GENERATION RULES:
- Generate ${isChapter ? '8-12' : '3-5'} flashcards from the key concepts
- For RHYMES/POEMS: Create cards like "What is the first line of [rhyme name]?" → "[first line]"
- For STORIES: Create cards about characters, plot points, moral lessons
- For ACADEMIC: Create cards for definitions, formulas, key facts
- Front should be a clear question or prompt
- Back should be a concise, memorable answer
- Use the SAME LANGUAGE as the content

🎨 VISUALIZATION CAPABILITIES:

1. GEOMETRIC SHAPES - Add JSON directly in the explanation:
{"type": "3d", "shapeType": "cube", "color": "#4FC3F7", "dimensions": {"width": 2, "height": 2, "depth": 2}, "title": "Cube", "rotate": true}
Available shapes: cube, sphere, cone, cylinder, pyramid, torus

2. MOLECULES - Add JSON directly in the explanation:
{"type": "chemistry", "moleculeData": "water", "format": "smiles", "title": "Water Molecule"}
Available molecules: water, methane, ethanol, glucose, benzene, caffeine, aspirin, and 100M+ from PubChem!

3. INTERACTIVE MAPS (Geography/History) - Add JSON directly in the explanation:
For Leaflet maps (cities, routes, regions):
{"type": "leaflet", "center": [17.385, 78.486], "zoom": 6, "markers": [{"position": [17.385, 78.486], "label": "Hyderabad", "popup": "Capital of Telangana"}], "routes": [{"positions": [[28.7, 77.1], [19.0, 72.8]], "color": "#FF0000"}], "title": "Map of India"}

IMPORTANT: 
- Return ONLY the JSON object
- No explanations, no markdown code blocks, just valid JSON
- Use HTML tags (<p>, <b>, <ul>, <li>, <strong>, <h4>) for formatting
- Include 3D visualizations when discussing geometric shapes, molecules, or 3D concepts
- 🎯 MOST IMPORTANT: Make content COME ALIVE! A rhyme should make them want to SING, a poem should move them, a story should captivate them!
${isChapter ? '- CHAPTER MODE: Be VERY comprehensive' : '- PAGE MODE: Be engaging and memorable'}!`;

  // V3.1: Use helper to force Gemini for regional languages
  const config = createLLMConfig('teacherMode', {
    temperature: 0.7,
    maxTokens: isChapter ? 8192 : 6144 // Increased from 4096 to 6144 to prevent truncation
  }, content, languageHint);
  
  return await callLLM(prompt, config);
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
- 3D Shapes: {"type":"3d","shapeType":"cube|sphere|cone|cylinder|pyramid|torus","color":"#4FC3F7","dimensions":{...},"rotate":true}
- Molecules: {"type":"chemistry","moleculeData":"water|ethanol|glucose|benzene|etc","format":"smiles","title":"Water Molecule"}
- Maps (Geography): {"type":"leaflet","center":[lat,lon],"zoom":6,"markers":[{"position":[lat,lon],"label":"City"}],"title":"Map Title"}
- Plotly Geo: {"type":"plotly","data":[{"type":"choropleth","locations":["IND"],"z":[1947],"locationmode":"ISO-3"}],"layout":{"geo":{"scope":"asia"}}}
- SVG: <svg viewBox="0 0 400 300">...</svg>

Available shapes: cube, sphere, cone, cylinder, pyramid, torus
Available molecules: water, methane, ethanol, glucose, benzene, caffeine, aspirin, and 100M+ from PubChem!
Maps: Use for geographic locations, historical events, routes, territories

🔴 CRITICAL: If step says "Draw X" or "Show on map", visualAid MUST contain the actual drawing/map (Chart.js JSON, SVG, 3D JSON, or Map JSON). NOT empty!

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

  // V3.1: Force Gemini for regional languages
  // V3.1.4: Increase tokens for regional languages (Telugu/Hindi need more space)
  const isRegional = isRegionalLanguageContent(selectedText + contextString, null);
  const config = createLLMConfig('explain', {
    temperature: 0.7,
    maxTokens: isRegional ? 8192 : 6144  // 8K for regional, 6K for English
  }, selectedText + contextString, null);

  return await callLLM(prompt, config);
}

export async function generateActivities(pageText, apiKey = null) {
  const prompt = `🎯 CRITICAL: FIRST DETECT CONTENT TYPE!

Analyze the content and determine its type:
- 🎵 **rhyme**: Nursery rhymes, children's songs, rhythmic verses (AABB patterns, repetition, playful)
- 📝 **poem**: Poetry, artistic expression (metaphors, imagery, emotions, stanzas)
- 📖 **story**: Narratives, tales (characters, plot, beginning-middle-end)
- 🔬 **academic**: Facts, concepts, science, math (formulas, definitions)
- 📊 **historical**: Events, dates, social studies (timelines, places)

LANGUAGE INSTRUCTION:
- Detect the language of the content below
- If regional language (Telugu, Hindi, Tamil, etc.), provide content in ORIGINAL LANGUAGE ONLY
- If English, provide English content

Page Content:
${pageText}

Generate engaging learning activities ADAPTED to the content type. Use the SAME LANGUAGE as the content.

Return ONLY this valid JSON (no extra text before or after):
{
  "contentType": "rhyme|poem|story|academic|historical",
  
  "singAlongText": "ONLY FOR RHYMES/POEMS/STORIES: The FULL text formatted for reading aloud/singing. Include the complete rhyme/poem/story text here. For rhymes, include rhythm markers (clap, clap) or melody hints. For poems, include pause markers (...). For stories, include character voice hints [excited], [whisper], etc. EMPTY for academic content.",
  
  "performanceInstructions": "ONLY FOR RHYMES/POEMS/STORIES: Brief instructions on HOW to perform - melody description for rhymes, emotion guidance for poems, voice modulation tips for stories. EMPTY for academic content.",

  "youtubeSearchQuery": "ONLY FOR KNOWN RHYMES/POEMS/STORIES: If this is a well-known rhyme like 'Twinkle Twinkle Little Star', 'Humpty Dumpty', 'Johny Johny Yes Papa', etc., provide the exact title for YouTube search. For example: 'Twinkle Twinkle Little Star nursery rhyme'. EMPTY if not a well-known piece or for academic content.",
  
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

🎵 FOR RHYMES - Generate:
- singAlongText: Full rhyme with rhythm hints like "(clap-clap)" or "🎵 (sing higher)" 
- performanceInstructions: "Sing with a bouncy tune! Clap on every 'twinkle'..."
- MCQs about rhyme, rhythm, vocabulary
- Activities: action songs, fill-in-the-rhyme, draw the scene
- Discussion: What does the rhyme teach us?

📝 FOR POEMS - Generate:
- singAlongText: Full poem with emotion markers like "[pause]" "[whisper]" "[emphasize]"
- performanceInstructions: "Read slowly with feeling. Pause at commas..."
- MCQs about meaning, literary devices, vocabulary
- Activities: illustrate stanzas, write similar poems
- Discussion: What emotions does this evoke?

📖 FOR STORIES - Generate:
- singAlongText: Story text with voice hints like "[excited]" "[scary voice]" "[gentle]"
- performanceInstructions: "Use different voices for each character..."
- MCQs about plot, characters, moral
- Activities: role play, alternate endings, character sketches
- Discussion: What would you do if...?

🔬 FOR ACADEMIC - Generate:
- Leave singAlongText and performanceInstructions EMPTY
- MCQs testing concepts and understanding
- Activities: experiments, calculations, diagrams
- Discussion: Real-world applications

Generate 5 MCQs, 3 practice questions, 3 hands-on activities, 3 discussion prompts, 2 real-world applications.
Return ONLY the JSON.`;

  // V3.1: Force Gemini for regional languages
  // V3.1.4: Increase tokens for regional languages
  const isRegional = isRegionalLanguageContent(pageText, null);
  const config = createLLMConfig('activities', {
    temperature: 0.7,
    maxTokens: isRegional ? 8192 : 6144
  }, pageText, null);

  return await callLLM(prompt, config);
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

  // V3.1: Force Gemini for regional languages
  // V3.1.4: Already 8K, increase to 16K for word analysis (lots of bilingual data)
  const isRegional = isRegionalLanguageContent(pageText, null);
  const config = createLLMConfig('wordAnalysis', {
    temperature: 0.7,
    maxTokens: isRegional ? 16384 : 8192  // 16K for regional, 8K for English
  }, pageText, null);

  return await callLLM(prompt, config);
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

  // V3.1: Force Gemini for regional languages
  const config = createLLMConfig('examPrep', {
    temperature: 0.7,
    maxTokens: 4096
  }, currentChunk, null);

  const response = await callLLM(prompt, config);

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
