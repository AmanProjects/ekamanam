# NCERT Textbook Library Integration

## ⚠️ FEATURE STATUS: DISABLED (Awaiting Copyright Permission)

This feature is **currently disabled** and will remain so until proper copyright permissions are obtained from NCERT for using their educational materials.

All NCERT Library code has been **commented out** in the codebase but **NOT deleted**. Once copyright permissions are secured, the feature can be easily re-enabled by uncommenting the relevant code sections.

---

## Overview
This feature would allow students to access and read NCERT textbooks directly from NCERT servers without downloading PDFs manually.

## Features

### 📚 Comprehensive Coverage
- **50+ NCERT Textbooks** from Classes 6-12
- All major subjects: Mathematics, Science, English, Hindi, Social Science, Physics, Chemistry, Biology
- Direct access from NCERT's official servers

### 🎯 Easy Navigation
- **Browse by Class**: Select from Class 6 to Class 12
- **Filter by Subject**: Choose Mathematics, Science, English, Hindi, Social Science, Physics, Chemistry, or Biology
- **One-Click Access**: Click any book to start reading immediately

### 🔄 Dual Mode Support
- **NCERT Library**: Access all NCERT textbooks directly from official servers
- **My Books**: Upload and read your own PDF files (local mode)

## How to Use

### Accessing NCERT Library

1. **Open the Dashboard**
   - Start the app and you'll see the main dashboard

2. **Select NCERT Library Mode**
   - Click the "NCERT Library" button (blue button with library icon)
   - This will show the NCERT textbook browser

3. **Choose Your Class**
   - Select your class from the dropdown (Class 6 to Class 12)

4. **Select Subject**
   - Choose the subject you want to study
   - Available subjects vary by class

5. **Pick a Book**
   - All available books for that class and subject will be displayed
   - Click on any book card to start reading

6. **Start Reading**
   - The book will load directly from NCERT servers
   - No download required!
   - All AI features (Teacher Mode, Activities, Explain with AI) work seamlessly

### Switching Modes

- **To NCERT Library**: Click "NCERT Library" button on the dashboard
- **To My Books**: Click "My Books" button to upload your own PDFs

## Available Textbooks

### Class 6
- Mathematics, Science, English (Poorvi), Hindi (Vasant), Social Science

### Class 7
- Mathematics, Science, English (Poorvi), Hindi (Vasant), Social Science

### Class 8
- Mathematics (Ganita Prakash)
- Science (Curiosity)
- English (Poorvi, Honeydew)
- Hindi (Vasant)
- Social Science (History, Geography)

### Class 9
- Mathematics
- Science
- English (Beehive, Moments)
- Hindi (Kshitij, Kritika)
- Social Science (History, Geography, Civics, Economics)

### Class 10
- Mathematics
- Science
- English (First Flight, Footprints without Feet)
- Hindi (Kshitij, Kritika)
- Social Science (History, Geography, Civics, Economics)

### Class 11
- Mathematics
- Physics (Part 1 & 2)
- Chemistry (Part 1 & 2)
- Biology

### Class 12
- Mathematics (Part 1 & 2)
- Physics (Part 1 & 2)
- Chemistry (Part 1 & 2)
- Biology

## Technical Details

### Direct Loading
- Books are loaded directly from `https://ncert.nic.in/textbook/pdf/`
- No server-side storage required
- Reduces bandwidth and storage costs
- Always access the latest versions

### Compatibility
- Works with all existing features:
  - ✅ Teacher Mode with AI explanations
  - ✅ Activity Generation (CBL, RBL, SEA)
  - ✅ Explain with AI
  - ✅ Chapter Notes
  - ✅ Text-to-Speech
  - ✅ Focus Monitoring

### URL Structure
Books are loaded using their official NCERT codes:
```
https://ncert.nic.in/textbook/pdf/[bookcode]dd.pdf
```

Example:
- Class 8 Mathematics: `https://ncert.nic.in/textbook/pdf/hemh1dd.pdf`
- Class 9 Science: `https://ncert.nic.in/textbook/pdf/iesc1dd.pdf`

## Benefits

### For Students
- ✅ No need to download PDFs
- ✅ Instant access to any NCERT textbook
- ✅ Save device storage space
- ✅ Always up-to-date content
- ✅ Easy to switch between books

### For Educators
- ✅ Students can access all reference materials
- ✅ No need to share PDF files
- ✅ Consistent learning experience across all devices

### For App Performance
- ✅ Reduced local storage requirements
- ✅ Lower bandwidth usage (books loaded on-demand)
- ✅ No need for file upload infrastructure
- ✅ Centralized content management

## Troubleshooting

### Book Not Loading?
- **Check Internet Connection**: NCERT books load from online servers
- **Try Refreshing**: Click back and select the book again
- **Check NCERT Servers**: Occasionally NCERT servers may be under maintenance

### URL Not Working?
- The app automatically handles URL generation
- If a specific book doesn't work, it may have been updated on NCERT servers
- You can still upload the PDF manually using "My Books" mode

### Missing Book?
- Not all subjects are available for all classes
- Some specialized subjects may not be included in the current catalog
- You can request additions by updating the `ncertLibrary` object in the code

## Future Enhancements

Potential future features:
- State board textbooks integration
- Offline caching for downloaded books
- Bookmark and progress tracking across devices
- Book search functionality
- Direct chapter navigation from table of contents

## How to Re-Enable This Feature

### When You Receive Copyright Permission from NCERT:

1. **Open `index.html`**

2. **Uncomment the NCERT Library Data** (around line 240):
   ```javascript
   // Search for this comment:
   // NCERT LIBRARY - COMMENTED OUT (Awaiting Copyright Permission)
   
   // Remove the /* and */ around the ncertLibrary object
   ```

3. **Uncomment the NCERTBrowser Component** (around line 2074):
   ```javascript
   // Search for this comment:
   // NCERT BROWSER COMPONENT - COMMENTED OUT
   
   // Remove the /* and */ around the entire NCERTBrowser component
   ```

4. **Uncomment the Dashboard Toggle** (around line 2166):
   ```javascript
   // Search for these comments:
   // NCERT LIBRARY TOGGLE - COMMENTED OUT
   // NCERT Library Handler - COMMENTED OUT
   
   // Remove the /* and */ comments
   ```

5. **Uncomment the Auto-Load PDF Feature** (around line 1697):
   ```javascript
   // Search for this comment:
   // AUTO-LOAD PDF - NCERT Library Feature (Commented Out)
   
   // Remove the /* and */ around the useEffect hook
   ```

6. **Test the Feature**:
   - Refresh your browser
   - You should see "NCERT Library" and "My Books" toggle buttons on the dashboard
   - Try selecting a class and subject to browse books

### Code Sections to Uncomment

All commented sections are clearly marked with:
```
// ============================================================================
// [SECTION NAME] - COMMENTED OUT (Awaiting Copyright Permission)
// ============================================================================
```

Look for these markers and uncomment the code between them.

## Legal & Copyright Information

### Why This Feature is Disabled

This feature directly accesses NCERT textbooks from their servers. While NCERT textbooks are often considered educational resources, it's important to:

1. **Obtain Formal Permission**: Request written permission from NCERT to use their materials in your app
2. **Review NCERT's Copyright Policy**: Check [NCERT's official website](https://ncert.nic.in) for their copyright and usage terms
3. **Consider Fair Use**: Educational use may fall under fair use, but it's best to be certain
4. **Attribution**: Ensure proper attribution to NCERT for all their materials

### How to Request Permission

1. Visit the [NCERT official website](https://ncert.nic.in)
2. Contact their copyright/permissions department
3. Explain your educational app and how you plan to use their materials
4. Request written permission to:
   - Link to their PDF files
   - Display their content in your app
   - Use their textbooks for AI-powered educational features

### Alternative Approaches While Awaiting Permission

Until you receive permission, you can:
- ✅ **Use "My Books" mode**: Students upload their own PDFs
- ✅ **Focus on AI features**: Enhance the AI tutoring capabilities
- ✅ **State Board Integration**: Explore partnerships with state education boards
- ✅ **Public Domain Materials**: Use textbooks in the public domain

## Support

For issues or suggestions regarding the NCERT Library feature:
1. Check that your internet connection is stable
2. Verify that NCERT servers are accessible
3. Try using "My Books" mode as an alternative
4. Report persistent issues with specific book codes

---

**Important Note**: This feature requires an active internet connection as books are loaded directly from NCERT servers. For offline use, download PDFs and use the "My Books" mode.

**Legal Disclaimer**: The NCERT Library feature is disabled pending copyright permissions. Do not enable this feature without proper authorization from NCERT.

