# 🚀 Groq API Setup Guide for Ekamanam v3.0

## 🎯 Why Groq?

Groq is **10-100x faster** and **90% cheaper** than other LLM providers:
- **Speed:** 300+ tokens/second (vs 40-60 for Gemini)
- **Cost:** ~90% cheaper than Gemini
- **Free tier:** 30 requests/minute, 6,000 requests/day
- **Technology:** LPU (Language Processing Unit) - specialized for AI

---

## 📝 Step-by-Step Setup

### **1. Get Your Groq API Key**

1. **Go to:** https://console.groq.com/
2. **Sign up** for a free account (Google/GitHub/Email)
3. **Click** "API Keys" in the left sidebar
4. **Click** "Create API Key"
5. **Name it:** "Ekamanam" (or any name you want)
6. **Copy** the API key (starts with `gsk_...`)
   ⚠️ **IMPORTANT:** Save it now - you can't see it again!

---

### **2. Add API Key to Ekamanam**

#### **Method 1: Via Settings (Recommended)**

1. **Open Ekamanam** in your browser
2. **Click** the ⚙️ **Settings** icon in the header
3. Scroll to **"Multi-Provider LLM Settings"**
4. Find **"Groq API Key"**
5. **Paste** your API key (starts with `gsk_...`)
6. **Click** "Save All Keys"
7. **Refresh** the page

#### **Method 2: Browser Console (Quick)**

1. **Open Ekamanam**
2. **Press** F12 (Windows) or Cmd+Option+I (Mac)
3. **Go to** Console tab
4. **Paste** and press Enter:
   ```javascript
   localStorage.setItem('groq_api_key', 'YOUR_API_KEY_HERE');
   location.reload();
   ```
   (Replace `YOUR_API_KEY_HERE` with your actual key)

---

### **3. Verify It's Working**

1. **Upload a PDF** as admin
2. **Check console** (F12) for:
   ```
   🤖 [examPrep] Trying groq...
   ✅ [examPrep] groq succeeded in XXXms
   ```
3. **Click "Exam Prep"** tab
4. Should load **instantly** from cache
5. **Generate Long Answer**
   - Should complete in **< 1 second**
   - Console should show: `🤖 [longAnswer] Trying groq...`

---

## 🔍 Troubleshooting

### **"No API key configured for groq"**

**Solution:**
- Make sure you saved the API key in Settings
- Check localStorage: Open Console, type `localStorage.getItem('groq_api_key')`
- Should return your API key
- If null, add it again

### **"All providers failed"**

**Solution:**
- Check if Groq API key is correct
- Verify you have Gemini API key as fallback
- Check console for specific error messages

### **"Rate limit exceeded"**

**Solution:**
- Groq free tier: 30 requests/minute
- Wait a minute and try again
- Or upgrade to Groq paid plan (very cheap!)

### **Groq is slow**

**Not possible!** 😄 
- Groq is 10-100x faster than others
- If slow, check your internet connection
- Or Groq might be having issues (rare)

---

## 📊 Free Tier Limits

| Limit | Free Tier | Paid (pay-as-you-go) |
|-------|-----------|----------------------|
| **Requests/minute** | 30 | 300+ |
| **Requests/day** | 6,000 | Unlimited |
| **Tokens/minute** | 7,000 | 14,400+ |
| **Cost** | $0 | ~$0.10/million tokens |

For typical usage (100 PDFs + 1000 answers/month):
- **Free tier:** Plenty!
- **Paid:** ~$0.10-0.20/month

---

## 🎓 Usage in Ekamanam

Groq is used for:
- ✅ **Exam Prep generation** (background, after PDF upload)
- ✅ **Long Answer generation** (when you click "Generate Answer")
- ✅ **Falls back to Gemini** if unavailable

Other features still use Gemini/other providers:
- Teacher Mode
- Smart Explain
- Activities
- Resources
- Word Analysis

---

## 🔐 Security

- API keys stored in **browser localStorage** only
- Never sent to any server except Groq
- Client-side encryption recommended for production
- For admin only (students can't see)

---

## 💡 Tips

1. **Set up both Groq and Gemini** for best reliability
2. **Monitor usage** in Groq console
3. **Upgrade to paid** if you hit limits (very cheap!)
4. **Report issues** if Groq fails unexpectedly

---

## 🔗 Useful Links

- **Groq Console:** https://console.groq.com/
- **Groq Docs:** https://console.groq.com/docs
- **API Reference:** https://console.groq.com/docs/api-reference
- **Pricing:** https://wow.groq.com/pricing/

---

## 🆘 Still Need Help?

**Check:**
1. API key is correct (starts with `gsk_`)
2. Saved in Settings properly
3. Page refreshed after saving
4. Console shows no errors

**If still failing:**
- Groq might be down (check https://status.groq.com/)
- Your API key might be invalid
- Rate limit exceeded (wait a minute)

**Fallback:**
- Ekamanam automatically uses Gemini if Groq fails
- So you'll still get answers, just slower

---

**Happy Fast Learning with Groq! ⚡🚀**

