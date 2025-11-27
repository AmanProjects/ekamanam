# 📝 All AI Prompts Used in Ekamanam

This document contains ALL the actual prompts used by the application. These are the real, complete prompts sent to AI models.

Last Updated: Nov 27, 2025

---

## 1. Teacher Mode (`generateTeacherMode`)

**Purpose:** Generate comprehensive teacher-style explanations in the same language as the content

**Max Tokens:** 4096  
**Temperature:** 0.7  
**Feature:** `teacherMode`

```
You are an experienced teacher helping students understand textbook content.

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

IMPORTANT: Return ONLY the JSON object. No explanations, no markdown code blocks, just valid JSON. Make it engaging, clear, and helpful for students!
```

---

## 2. Teacher Mode Translation (`translateTeacherModeToEnglish`)

**Purpose:** Translate Teacher Mode content to English on demand

**Max Tokens:** 4096  
**Temperature:** 0.5  
**Feature:** `resources`

```
You are a translator. Translate the following teacher explanation to English.

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

IMPORTANT: Return ONLY the JSON object with English translations. No explanations, no markdown code blocks, just valid JSON.
```

---

## 3. Smart Explain (`generateExplanation`)

**Purpose:** Comprehensive content explanation with exercises, visualizations, and bilingual support

**Max Tokens:** 6144  
**Temperature:** 0.7  
**Feature:** `explain`

```
Analyze and explain this content. Detect language, respond in same language. For regional languages: bilingual (original + English).

${contextString ? `CONTEXT:\n${contextString}\n\n` : ''}CONTENT:
"${selectedText}"

RULES:
1. Detect content type: exercise|notes|regular
2. For exercises: complete step-by-step solutions
3. For "Draw" commands: provide actual visualizations in visualAid field

VISUALIZATION FORMATS:
- Chart: {"chartType":"pie|bar|line","data":{"labels":[...],"datasets":[{...}]}}
- 3D: {"type":"3d","shapeType":"cube|sphere","color":"#4FC3F7","dimensions":{...}}
- SVG: <svg viewBox="0 0 400 300">...</svg>

🔴 CRITICAL: If step says "Draw X", visualAid MUST contain the actual drawing (Chart.js JSON, SVG, or 3D JSON). NOT empty when you write "draw"!

Return JSON:
{
  "contentType": "exercise|notes|regular",
  "language": "Detected language",
  "explanation": "Clear explanation",
  "explanation_english": "English (empty if already English)",
  "exercises": [{
    "question": "Question in original",
    "question_english": "Question in English",
    "answer": "Complete answer",
    "answer_english": "Answer in English",
    "hints": ["Hint 1", "Hint 2"],
    "hints_english": ["Hint 1 English", "Hint 2 English"],
    "steps": [{
      "text": "Step in original",
      "text_english": "Step in English",
      "visualAid": "Chart.js JSON / SVG / 3D JSON (if needed)"
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

KEEP IT CONCISE. Use visuals for complex concepts.
```

---

## 4. Activities (`generateActivities`)

**Purpose:** Generate interactive learning activities (MCQs, practice questions, etc.)

**Max Tokens:** 6144  
**Temperature:** 0.7  
**Feature:** `activities`

```
IMPORTANT LANGUAGE INSTRUCTION:
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
Return ONLY the JSON.
```

---

## 5. Additional Resources (`generateAdditionalResources`)

**Purpose:** Find web resources and related topics

**Max Tokens:** 3072  
**Temperature:** 0.7  
**Feature:** `resources`

```
Based on this educational content, provide additional learning resources. First detect the language of the content, then provide practice questions in BOTH the original language AND English.

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

Return ONLY the JSON.
```

---

## 6. Word-by-Word Analysis (`generateWordByWordAnalysis`)

**Purpose:** Break down regional language text into individual words with pronunciation and meaning

**Max Tokens:** 8192  
**Temperature:** 0.7  
**Feature:** `explain`

```
You are an expert in Indian languages. The text below is from a PDF and may appear garbled due to encoding issues. Your task is to:
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
- ONLY valid JSON (no code blocks)
```

---

## 7. Exam Preparation (`generateExamPrep`)

**Purpose:** Generate exam-style questions (MCQs with Assertion & Reasoning, Short Answer, Long Answer)

**Max Tokens:** 4096  
**Temperature:** 0.7  
**Feature:** `examPrep`

```
Expert exam creator. Generate questions from this text.

TEXT (Chunk ${chunkNumber}/${totalChunks}):
${currentChunk.substring(0, 2500)}

JSON format:
{
  "mcqs": [
    {
      "assertion": "Fact statement",
      "reason": "Reasoning",
      "correctAnswer": 0,
      "explanation": "Why correct"
    }
  ],
  "shortAnswer": [
    {
      "question": "Question",
      "answer": "Answer (2-3 sentences)",
      "keywords": ["term1", "term2"]
    }
  ],
  "longAnswer": [
    {
      "question": "Question",
      "hints": ["Hint"],
      "pageReferences": [1]
    }
  ]
}

Generate:
- 3 MCQs (Assertion & Reasoning)
- 3 Short Answer (with answers)
- 2 Long Answer (with hints)

Options for MCQs are always:
0: Both A and R true, R explains A
1: Both A and R true, R doesn't explain A
2: A true, R false
3: A false, R true

Return ONLY JSON, no markdown.
```

---

## 8. Long Answer Generation (`generateLongAnswer`)

**Purpose:** Generate comprehensive answers for long answer questions

**Max Tokens:** 1536  
**Temperature:** 0.7  
**Feature:** `longAnswer`

```
Generate exam answer for:

${question}

REFERENCE:
${fullPdfText.substring(0, 4000)}

${pageReferences.length > 0 ? `PAGES: ${pageReferences.join(', ')}` : ''}

Requirements:
- Comprehensive answer
- Academic language
- Clear points
- 200-250 words
- Use ** for bold

Answer:
```

---

## 9. Read & Understand (`generateReadAndUnderstand`)

**Purpose:** Clean OCR text and provide optional English explanations

**Max Tokens:** 2048  
**Temperature:** 0.3  
**Feature:** `explain`

**With Explanation:**
```
You are helping students read an educational textbook. The text below was extracted using OCR (Optical Character Recognition) from a PDF.

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
}
```

**Without Explanation:**
```
You are helping students read an educational textbook. The text below was extracted using OCR from a PDF.

OCR EXTRACTED TEXT:
${paragraphText}

TASK:
1. Clean up any OCR errors
2. Present the text properly in its original language (Telugu/Hindi/Tamil/English)

Return JSON:
{
  "original": "Cleaned text in original language"
}
```

---

## Token Limits Summary

| Feature | Max Tokens | Temperature | Purpose |
|---------|------------|-------------|---------|
| Teacher Mode | 4096 | 0.7 | Comprehensive explanation |
| Teacher Translation | 4096 | 0.5 | English translation |
| Smart Explain | 6144 | 0.7 | Exercises & visualizations |
| Activities | 6144 | 0.7 | Interactive learning |
| Resources | 3072 | 0.7 | Web links & topics |
| Word Analysis | 8192 | 0.7 | Pronunciation & meaning |
| Exam Prep | 4096 | 0.7 | MCQs & questions |
| Long Answer | 1536 | 0.7 | Detailed answers |
| Read & Understand | 2048 | 0.3 | OCR cleanup |

---

## Notes

1. All prompts are designed to handle **bilingual content** (regional language + English)
2. **Language detection** is automatic - AI responds in the same language as input
3. All responses are in **structured JSON format** for reliable parsing
4. **Visualization support** includes Chart.js, SVG, and 3D JSON
5. **Context-aware** - some prompts use prior page information for better understanding

---

## Editing Prompts

To modify these prompts:
1. Use the **Admin Dashboard** (click Admin button in header)
2. Go to "📝 AI Prompts (Advanced)" section
3. Edit system prompt and instructions
4. Click "Save Configuration"
5. Refresh page to apply changes

**Note:** Editing prompts requires technical knowledge of AI prompt engineering and JSON structures.

