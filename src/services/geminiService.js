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

// V8.0.0: OPTIMIZED Teacher Mode - Simple, efficient, accurate
// Based on original.html that works excellently with Telugu PDFs
// Key optimizations:
// 1. Limit content to 1500 chars (reduced token usage by ~70%)
// 2. Simplified prompt (reduced by ~60%)
// 3. Cleaner JSON structure (7 core fields)
// 4. Better language auto-detection
// 5. maxOutputTokens: 4096 (down from 6144/8192)
// Token savings: Input ~70% reduction, Output ~35% reduction = ~50-60% total savings
export async function generateTeacherMode(content, apiKey = null, languageHint = null, subject = 'General', chapterName = 'Unknown') {
  
  // OPTIMIZATION 1: Limit content to first 1500 chars (reduces input tokens by ~70%)
  // Original.html uses this limit and works excellently with regional languages
  const pageText = content && content.length > 1500 
    ? content.substring(0, 1500) 
    : content;
  
  console.log(`📖 Teacher Mode - Using ${pageText?.length || 0} chars (optimized from ${content?.length || 0})`);
  
  // OPTIMIZATION 2: Simplified, focused prompt (inspired by original.html)
  // This prompt is proven to work excellently with Telugu, Hindi, Tamil, and other regional languages
  const prompt = `You are an experienced and friendly teacher.

Subject: ${subject}
Chapter: ${chapterName}

Content Section (filtered to remove graphics):
"${pageText}"

Explain this page content as a teacher would in class.

IMPORTANT LANGUAGE INSTRUCTION:
- First, detect the language of the Page Content above
- If the content is in Telugu (తెలుగు), Hindi (हिंदी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), or any other Indian language, respond in THE SAME LANGUAGE
- If the content is in English, respond in English
- Your explanations should be in the SAME LANGUAGE as the textbook content

IMPORTANT: Return ONLY valid, properly formatted JSON. Use single spaces instead of newlines in HTML strings. Escape all quotes properly.

Return this exact structure:
{
    "summary": "2-3 sentence summary in the SAME LANGUAGE as the content (simple HTML with <b> tags only)",
    "keyPoints": ["point 1 in SAME LANGUAGE (plain text)", "point 2 in SAME LANGUAGE (plain text)", "point 3 in SAME LANGUAGE (plain text)"],
    "explanation": "Detailed explanation in SAME LANGUAGE (use <p> and <b> tags, keep in one line)",
    "importantDetails": "Any special details like questions, formulas, definitions in SAME LANGUAGE (use <ul><li> tags, keep in one line)",
    "examples": "Real-world examples in SAME LANGUAGE (use <p> and <b> tags, keep in one line)",
    "thinkAbout": "2-3 questions in SAME LANGUAGE (use <ul><li> tags, keep in one line)",
    "exam": "Exam tips in SAME LANGUAGE (use <p> and <b> tags, keep in one line)"
}

Make it engaging, clear, and encouraging like a good teacher! Remember to use the SAME LANGUAGE as the textbook content.`;

  // OPTIMIZATION 3: Increased maxTokens from 4096 to 8192 for comprehensive regional language support
  // V3.2: Doubled to ensure Telugu/Hindi content is never truncated
  const config = createLLMConfig('teacherMode', {
    temperature: 0.7,
    maxTokens: 8192  // Doubled for better multilingual responses
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
    maxTokens: 8192  // V3.2: Doubled for comprehensive resource recommendations
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
    maxTokens: 8192  // V3.2: Increased for comprehensive translations
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
    maxTokens: 4096  // V3.2: Doubled for regional language OCR cleanup + explanations
  });
}

export async function generateExplanation(selectedText, contextText, options = {}) {
  // v7.2.25: Support educational level from PDF metadata
  const { apiKey = null, educationalLevel = null, subject = null } = options;
  
  // Handle case where contextText might be an array (priorContext) or string
  const contextString = Array.isArray(contextText) 
    ? contextText.map(p => `Page ${p.pageNumber}: ${p.summary}`).join('\n')
    : (typeof contextText === 'string' ? contextText : '');
  
  // v7.2.25: Determine education level context
  const getEducationContext = () => {
    if (!educationalLevel) return '';
    
    const level = educationalLevel.toString().toLowerCase();
    
    // University/College level (B.Tech, B.E., M.Tech, Diploma, 11, 12, UG, PG)
    if (level.includes('b.tech') || level.includes('b.e') || level.includes('m.tech') || 
        level.includes('diploma') || level.includes('engineering') || level.includes('ug') || 
        level.includes('pg') || level.includes('degree') || level.includes('university') ||
        level === '11' || level === '12' || level === 'class 11' || level === 'class 12' ||
        level.includes('intermediate') || level.includes('jr college') || level.includes('jntu') ||
        level.includes('anna university') || level.includes('vtu') || level.includes('iit')) {
      return `
🎓 EDUCATION LEVEL: UNIVERSITY/ADVANCED (${educationalLevel}${subject ? `, Subject: ${subject}` : ''})

CRITICAL REQUIREMENTS FOR UNIVERSITY-LEVEL RESPONSES:
1. Provide DETAILED, RIGOROUS explanations suitable for engineering/university students
2. Include theoretical background, derivations, and mathematical proofs where applicable
3. Use proper technical terminology and notation (LaTeX style: ∑, ∫, ∂, etc.)
4. For circuit/electronics questions: Include truth tables, K-maps, timing diagrams, state diagrams
5. For ROM/memory questions: Show complete address decoding, memory map, implementation details
6. Explain the "why" behind each step - university students need to understand the reasoning
7. Include edge cases, design considerations, and practical applications
8. Reference relevant theorems, laws, or principles (e.g., Boolean algebra, De Morgan's theorem)
9. For step-by-step solutions: Number each step clearly, show intermediate results
10. Tables should be formatted as HTML tables, not JSON

EXAMPLE FOR ROM IMPLEMENTATION:
- Show the truth table with all minterms
- Explain which outputs are HIGH for each input combination
- Show the ROM programming/content matrix
- Provide the final implementation with proper labeling

`;
    }
    
    // High school (9, 10)
    if (level === '9' || level === '10' || level === 'class 9' || level === 'class 10' ||
        level.includes('ssc') || level.includes('high school')) {
      return `
🎓 EDUCATION LEVEL: HIGH SCHOOL (${educationalLevel}${subject ? `, Subject: ${subject}` : ''})

REQUIREMENTS FOR HIGH SCHOOL RESPONSES:
1. Explain concepts clearly with examples
2. Use age-appropriate language
3. Connect to real-world applications students can relate to
4. Break down complex topics into digestible parts
5. Include practice questions similar to board exam patterns

`;
    }
    
    // Middle school (6, 7, 8)
    if (level === '6' || level === '7' || level === '8' || level.includes('middle school')) {
      return `
🎓 EDUCATION LEVEL: MIDDLE SCHOOL (${educationalLevel})

REQUIREMENTS FOR MIDDLE SCHOOL RESPONSES:
1. Use simple, clear language
2. Provide plenty of examples and analogies
3. Visual representations help understanding
4. Keep explanations concise but complete
5. Encourage curiosity with interesting facts

`;
    }
    
    // Elementary (1-5)
    if (['1', '2', '3', '4', '5'].includes(level) || level.includes('primary')) {
      return `
🎓 EDUCATION LEVEL: PRIMARY SCHOOL (${educationalLevel})

REQUIREMENTS FOR PRIMARY SCHOOL RESPONSES:
1. Use very simple language
2. Include fun facts and stories
3. Lots of pictures and visual aids
4. Short sentences and explanations
5. Make learning fun and engaging!

`;
    }
    
    return `\n🎓 EDUCATION LEVEL: ${educationalLevel}${subject ? ` (Subject: ${subject})` : ''}\n\n`;
  };
  
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
${getEducationContext()}
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
5. For TABLES: Always render as HTML tables with proper formatting, NOT JSON

VISUALIZATION FORMATS:
- Chart: {"chartType":"pie|bar|line","data":{"labels":[...],"datasets":[{...}]}}
- 3D Shapes: {"type":"3d","shapeType":"cube|sphere|cone|cylinder|pyramid|torus","color":"#4FC3F7","dimensions":{...},"rotate":true}
- Molecules: {"type":"chemistry","moleculeData":"water|ethanol|glucose|benzene|etc","format":"smiles","title":"Water Molecule"}
- Maps (Geography): {"type":"leaflet","center":[lat,lon],"zoom":6,"markers":[{"position":[lat,lon],"label":"City"}],"title":"Map Title"}
- Plotly Geo: {"type":"plotly","data":[{"type":"choropleth","locations":["IND"],"z":[1947],"locationmode":"ISO-3"}],"layout":{"geo":{"scope":"asia"}}}
- SVG: <svg viewBox="0 0 400 300">...</svg>
- HTML Tables: <table border="1"><tr><th>Header</th></tr><tr><td>Data</td></tr></table>

🔌 CIRCUIT VISUALIZATION FORMAT (for Digital Electronics/Logic questions):
When content involves logic gates, combinational circuits, ROM, multiplexers, decoders, flip-flops, etc., include a "circuitVisualization" field:
{
  "circuitVisualization": {
    "type": "logic_circuit",
    "title": "Circuit Name (e.g., 4x4 ROM Implementation)",
    "gates": [
      {"id": "g1", "type": "AND|OR|NOT|NAND|NOR|XOR|XNOR", "inputs": ["A", "B"], "output": "Y1", "position": {"x": 100, "y": 50}},
      {"id": "g2", "type": "OR", "inputs": ["Y1", "C"], "output": "F", "position": {"x": 200, "y": 50}}
    ],
    "inputs": [
      {"id": "A", "label": "A", "position": {"x": 0, "y": 30}},
      {"id": "B", "label": "B", "position": {"x": 0, "y": 70}}
    ],
    "outputs": [
      {"id": "F", "label": "F(A,B)", "position": {"x": 300, "y": 50}}
    ],
    "connections": [
      {"from": "A", "to": "g1.a"},
      {"from": "B", "to": "g1.b"},
      {"from": "g1.out", "to": "F"}
    ],
    "truthTable": {
      "inputs": ["A", "B"],
      "outputs": ["F"],
      "rows": [
        {"inputs": [0, 0], "outputs": [1]},
        {"inputs": [0, 1], "outputs": [1]},
        {"inputs": [1, 0], "outputs": [1]},
        {"inputs": [1, 1], "outputs": [0]}
      ],
      "minterms": [0, 1, 2]
    },
    "romContent": {
      "addressBits": 2,
      "dataBits": 1,
      "content": [1, 1, 1, 0]
    }
  }
}

CIRCUIT DETECTION KEYWORDS:
- ROM implementation, 4x4 ROM, 8x4 ROM, combinational circuit
- Logic gates: AND, OR, NOT, NAND, NOR, XOR, XNOR
- Multiplexer (MUX), Decoder, Encoder
- Truth table, K-map, Karnaugh map
- Boolean expression, minterms ∑m, maxterms ∏M
- Flip-flop, SR latch, D flip-flop, JK flip-flop
- Counter, shift register, sequential circuit

When these are detected:
1. Include the "circuitVisualization" field in the response
2. Provide accurate gate connections matching the Boolean expression
3. Include complete truth table with all input combinations
4. For ROM: Include complete programming content

Available shapes: cube, sphere, cone, cylinder, pyramid, torus
Available molecules: water, methane, ethanol, glucose, benzene, caffeine, aspirin, and 100M+ from PubChem!
Maps: Use for geographic locations, historical events, routes, territories

🔴 CRITICAL: 
- If step says "Draw X" or "Show on map", visualAid MUST contain the actual drawing/map (Chart.js JSON, SVG, 3D JSON, or Map JSON). NOT empty!
- For TRUTH TABLES and DATA TABLES: Use HTML <table> format, NOT JSON {"type":"table"} format!

Return ONLY this JSON (no markdown blocks):

FOR REGIONAL LANGUAGES (Telugu/Hindi/Tamil/etc):
{
  "contentType": "exercise|notes|regular",
  "language": "Telugu|Hindi|Tamil|etc",
  "explanation": "Clear explanation in ORIGINAL language with HTML tables if needed",
  "exercises": [{
    "question": "Question in original language",
    "answer": "Complete answer in original language (use <table> for tabular data)",
    "hints": ["Hint 1 in original language"],
    "steps": [{
      "text": "Step in original language ONLY (no English needed)",
      "visualAid": "Chart.js JSON / SVG / 3D JSON / HTML table (if drawing required)"
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
  "explanation": "Clear explanation in English (use HTML <table> for tabular data)",
  "exercises": [{
    "question": "Question in English",
    "answer": "Complete answer (use <table> for truth tables, ROM contents, etc.)",
    "hints": ["Hint 1"],
    "steps": [{
      "text": "Step in English with proper formatting",
      "visualAid": "Chart.js JSON / SVG / 3D JSON / HTML table (if needed)"
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

KEEP IT CONCISE. Use visuals for complex concepts. NO BILINGUAL for step-by-step solutions.

🔴 CRITICAL OUTPUT FORMAT:
- Return ONLY the raw JSON object, starting with { and ending with }
- Do NOT wrap the response in \`\`\`json code blocks
- Do NOT include any text before or after the JSON
- The first character of your response MUST be {`;

  // V3.1: Force Gemini for regional languages
  // V3.1.4: Increase tokens for regional languages (Telugu/Hindi need more space)
  // V3.2: Increased regional from 8K to 16K for comprehensive Telugu analysis
  const isRegional = isRegionalLanguageContent(selectedText + contextString, null);
  const config = createLLMConfig('explain', {
    temperature: 0.7,
    maxTokens: isRegional ? 16384 : 8192  // 16K for regional, 8K for English (doubled for better responses)
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
    maxTokens: isRegional ? 16384 : 8192  // V3.2: Doubled for comprehensive regional language activities
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
    maxTokens: 6144  // V3.2: Doubled for comprehensive resource generation
  });
}

export async function generateWordByWordAnalysis(pageText, apiKey = null, excludeWords = '', batchNumber = 1) {
  const sequentialInstruction = batchNumber === 1
    ? `\n\nEXTRACT WORDS SEQUENTIALLY: Start from the BEGINNING of the text and extract the first 10 important content words in the order they appear.`
    : `\n\nEXTRACT WORDS SEQUENTIALLY: You already covered these words: ${excludeWords}\nNow continue from where you left off and extract the NEXT 10 important words in sequential order.`;
  
  const prompt = `You are an expert in Indian languages. The text below is from a PDF and may appear garbled due to encoding issues.

YOUR CRITICAL TASK:
1. INTERPRET the garbled/encoded text and understand its ACTUAL meaning
2. Return ONLY proper, clean Unicode words in the CORRECT script (Telugu/Hindi/Tamil/etc.)
3. Extract words IN THE ORDER THEY APPEAR in the text (sequential, not random)
4. Provide simple pronunciation guide and English meaning

🚨 EXTREMELY IMPORTANT FOR TEXT-TO-SPEECH:
- The "word" field MUST contain ONLY clean Unicode Telugu/Hindi/Tamil characters
- ABSOLUTELY NO garbled characters like #·+Á÷ÿþü°¤ or dü÷
- Check each word: Does it look like proper Telugu స్వ Telugu? If not, FIX IT!
- Example of CORRECT Telugu Unicode: "పుస్తకం", "చదువు", "విద్య"
- Example of WRONG (garbled): "d¸¤C°·", "#Ü÷·", "dqÖÁ" ❌

${sequentialInstruction}

Text from PDF (may be garbled):
${pageText}

Return ONLY this valid JSON (no markdown, no extra text):
{
  "language": "Telugu|Hindi|Tamil|English",
  "summary": "1 sentence summary in English",
  "words": [
    {
      "word": "CLEAN UNICODE WORD (e.g., పుస్తకం)",
      "pronunciation": "simple phonetic (e.g., pus-ta-kam)",
      "meaning": "brief English meaning",
      "partOfSpeech": "noun|verb|adjective|etc"
    }
  ]
}

STRICT VALIDATION RULES:
- Extract exactly 10 words (batch ${batchNumber})
- Extract words IN SEQUENTIAL ORDER as they appear in the text
- Each "word" field MUST be in proper regional script Unicode (Telugu: \u0C00-\u0C7F, Hindi: \u0900-\u097F, etc.)
- NO ASCII special characters in the "word" field (#·+Á÷ÿþü°¤)
- If you cannot determine the clean Unicode, skip that word and extract the next one
- Focus on important content words (nouns, verbs, adjectives) but maintain sequential order
- Skip common filler words (the, is, and, etc.) but maintain sequence
- Brief English meanings (under 5 words)
- Simple pronunciation guide using English letters
- Return ONLY valid JSON (no code blocks, no explanations)

BEFORE RETURNING: Verify each "word" field contains ONLY Telugu/Hindi/Tamil Unicode characters!`;

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
    maxTokens: 8192  // V3.2: Doubled for comprehensive exam prep in regional languages
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
    maxTokens: 6144  // V3.2: Doubled for comprehensive answers in regional languages
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
