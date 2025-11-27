# 🔍 Regional Language PDF Debugging Guide

## 🐛 **Issue Report**

For Telugu/Hindi PDFs:
- ❌ Smart Explain doesn't work
- ❌ Multilingual tab is disabled (should be enabled)
- ❌ Exam Prep doesn't work  
- ✅ Teacher Mode works (GREAT!)

---

## 📋 **Debugging Steps**

### **1. Open Telugu/Hindi PDF**

1. Open Ekamanam
2. Load a Telugu or Hindi PDF
3. **Open Console** (F12 or Cmd+Option+I)
4. Go to **Console** tab

### **2. Check Text Extraction**

Look for these logs in console:

```
📝 [PDFViewer] Text extracted: {
  length: XXXX,
  preview: "తెలుగు text here..." or "हिंदी text here...",
  hasDevanagari: true/false,
  hasTelugu: true/false,
  hasTamil: true/false
}
```

**What to check:**
- ✅ **length > 0?** Text was extracted
- ✅ **preview shows Telugu/Hindi?** Text is correct
- ✅ **hasTelugu/hasDevanagari = true?** Language detected
- ❌ **length = 0?** Text extraction failed!
- ❌ **preview is garbled?** Encoding issue!

### **3. Check Language Detection**

Look for:

```
🔍 [isEnglishContent] Checking text: {
  textLength: XXXX,
  textPreview: "తెలుగు text..."
}

✅ Regional language detected: {
  hasDevanagari: false,
  hasTelugu: true,  ← Should be TRUE for Telugu
  ...
}
```

**Expected for Telugu PDF:**
- `hasTelugu: true`
- `isEnglish: false`
- `readTabDisabled: false` (Multilingual should be ENABLED)

**Expected for Hindi PDF:**
- `hasDevanagari: true`
- `isEnglish: false`
- `readTabDisabled: false` (Multilingual should be ENABLED)

###  **4. Check Tab State**

Look for:

```
🔍 [Language Detection] {
  pageText: "తెలుగు...",
  pageTextLength: XXXX,
  isEnglish: false,  ← Should be FALSE
  readTabDisabled: false,  ← Should be FALSE
  currentPage: 1
}
```

### **5. Try Smart Explain**

1. Click **"Smart Explain"** tab
2. Click **"Analyze this page"** button
3. Check console for errors

Look for:
```
🔄 Analyzing full page for exercises...
✅ Explanation generated
```

Or errors like:
```
❌ Error: ...
```

### **6. Try Exam Prep**

1. Click **"Exam Prep"** tab
2. Click **"Generate Exam Questions"** button
3. Check console

Look for:
```
📖 Extracting full PDF text...
🔄 Processing chunk 1/X...
✅ Exam prep generation complete
```

Or errors.

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: Text Not Extracted**

**Symptom:**
```
📝 [PDFViewer] Text extracted: { length: 0, preview: "" }
```

**Cause:** PDF might be image-based (scanned)

**Solution:**
- PDF needs OCR (not currently supported)
- Use "Teacher Mode" which handles scanned PDFs better

### **Issue 2: Garbled Text**

**Symptom:**
```
📝 [PDFViewer] Text extracted: { 
  preview: "????????" or "ã¤¤¾¤" 
}
```

**Cause:** Encoding issues or custom fonts

**Solution:**
- PDF.js should handle this automatically
- If persists, PDF has non-standard encoding
- Use "Teacher Mode" as workaround

### **Issue 3: Multilingual Tab Disabled for Regional PDF**

**Symptom:**
```
✅ Regional language detected: { hasTelugu: true }
🔍 [Language Detection] { 
  isEnglish: false, 
  readTabDisabled: false  ← FALSE means ENABLED
}
```
But tab still appears disabled in UI.

**Cause:** React state not updating

**Solution:**
- Hard refresh: Ctrl+Shift+R
- Clear browser cache
- Check if admin config disabled it

### **Issue 4: Smart Explain / Exam Prep Fails**

**Symptom:**
Clicking button does nothing, or error in console.

**Possible Causes:**
1. **Empty pageText** - Text extraction failed
2. **API error** - LLM provider issue
3. **Token limit** - Text too large
4. **JSON parse error** - AI returned invalid format

**Solution:**
- Check console for specific error
- Verify API keys are set
- Try with shorter text/page

---

## 📊 **Expected Console Output (Telugu PDF)**

### **When Page Loads:**

```
📄 PDFViewer: Loading file: { name: "telugu.pdf", ... }
📝 [PDFViewer] Text extracted: {
  length: 1234,
  preview: "తెలుగు భాష...",
  hasDevanagari: false,
  hasTelugu: true,  ✅
  hasTamil: false
}
🔍 [isEnglishContent] Checking text: {
  textLength: 1234,
  textPreview: "తెలుగు భాష..."
}
✅ Regional language detected: { 
  hasTelugu: true,  ✅
  ... 
}
🔍 [Language Detection] {
  pageText: "తెలుగు భాష...",
  pageTextLength: 1234,
  isEnglish: false,  ✅
  readTabDisabled: false,  ✅ (ENABLED!)
  currentPage: 1
}
```

### **When Clicking Smart Explain:**

```
🔄 Analyzing full page for exercises...
🤖 [explain] Trying groq...
✅ [explain] groq succeeded in XXXms
✅ Explanation generated
```

### **When Clicking Exam Prep:**

```
⚡ [V3.0] Loaded exam prep from cache instantly!
```
Or if not cached:
```
📖 Extracting full PDF text for exam prep...
🔄 Processing chunk 1/3...
🤖 [examPrep] Trying groq...
✅ [examPrep] groq succeeded in XXXms
✅ Exam prep generation complete
```

---

## 🛠️ **How to Share Debug Info**

If issues persist, share these console logs:

1. **Text Extraction Log:**
   - Copy the `📝 [PDFViewer] Text extracted` log
   
2. **Language Detection Log:**
   - Copy the `✅ Regional language detected` log
   
3. **Tab State Log:**
   - Copy the `🔍 [Language Detection]` log

4. **Any Errors:**
   - Copy any red error messages

5. **Feature Attempt:**
   - Copy logs when clicking Smart Explain or Exam Prep

---

## 🎯 **Quick Test**

**Test with Telugu PDF:**
1. Open PDF → Check extraction log → Should show `hasTelugu: true`
2. Check Multilingual tab → Should be ENABLED (not grayed out)
3. Click Teacher Mode → Should work ✅
4. Click Smart Explain → Check console for errors
5. Click Exam Prep → Check console for errors

**If all logs look correct but features still don't work:**
- The issue is in the AI service layer
- Check for API errors
- Check for JSON parsing errors
- Check for token limit errors

---

## 📝 **What to Send Back**

Copy all console logs from:
1. Page load
2. Clicking Smart Explain
3. Clicking Exam Prep
4. Any error messages

This will help identify the exact issue!

---

**Version with Debug Logging: 3.0.2**

