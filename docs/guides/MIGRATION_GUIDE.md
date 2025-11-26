# Migration Guide: HTML to React

## Overview

This document explains the migration from the original single-file HTML application to the new React-based application with Material-UI.

## Key Changes

### 1. Architecture

**Before (HTML):**
- Single `index.html` file with embedded React via CDN
- All components in one file
- Inline styles and Tailwind CSS
- Direct script tags for dependencies

**After (React):**
- Proper React project structure with Create React App
- Modular component architecture
- Material-UI component library
- npm package management

### 2. Layout

**Before:**
- Various views switching between dashboard and reader
- PDF and controls in the same vertical space

**After:**
- Side-by-side layout using MUI Grid
- **Left side (50%)**: PDF viewer
- **Right side (50%)**: AI modes panel with tabs
- Responsive design that stacks on mobile

### 3. Styling

**Before:**
```html
<div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg">
```

**After:**
```javascript
<Button 
  sx={{ 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
  }}
>
```

Material-UI provides:
- Consistent theming
- Built-in responsive utilities
- Accessible components
- Better maintainability

### 4. Component Structure

#### Dashboard Component
- File upload interface
- Feature cards
- Welcome section

#### PDFViewer Component
- Canvas-based PDF rendering
- Text layer for selection
- Navigation controls
- Zoom functionality

#### AIModePanel Component
- Tabbed interface for different AI modes
- Teacher Mode tab
- Explain tab
- Activities tab
- Notes tab

#### AuthButton Component
- Google Sign-In integration
- User menu dropdown

#### SettingsDialog Component
- API key management
- Account information

#### FocusMonitor Component
- Camera-based focus tracking
- Minimizable widget
- Focus score display

### 5. State Management

**Before:**
```javascript
const [state, setState] = useState(initial);
// All in one component
```

**After:**
```javascript
// State lifted to App.js and passed as props
<PDFViewer 
  selectedFile={selectedFile}
  onTextSelect={setSelectedText}
/>
```

### 6. File Organization

```
src/
├── components/          # React components
│   ├── AIModePanel.js
│   ├── AuthButton.js
│   ├── Dashboard.js
│   ├── FocusMonitor.js
│   ├── PDFViewer.js
│   └── SettingsDialog.js
├── firebase/           # Firebase config
│   └── config.js
├── services/           # API services
│   └── geminiService.js
├── App.js             # Main app
├── index.js           # Entry point
└── theme.js           # MUI theme
```

## Migration Steps

### For Developers

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase** (if needed)
   Update `src/firebase/config.js` with your credentials

3. **Start Development Server**
   ```bash
   npm start
   ```

### For Users

The user experience remains largely the same:

1. **Upload PDF** - Same process, cleaner UI
2. **View PDF** - Now on the left side
3. **Use AI Features** - Now in tabbed panel on the right
4. **Settings** - Click settings icon in header

## Benefits of Migration

### 1. Better User Experience
- ✅ Side-by-side layout for easy reading and learning
- ✅ No need to switch between views
- ✅ More screen space utilization
- ✅ Smoother animations and transitions

### 2. Improved Code Quality
- ✅ Modular, maintainable components
- ✅ Proper separation of concerns
- ✅ TypeScript ready (can be added)
- ✅ Better testing capabilities

### 3. Enhanced Performance
- ✅ Code splitting
- ✅ Lazy loading capabilities
- ✅ Optimized production builds
- ✅ Better bundle management

### 4. Easier Customization
- ✅ Theme system for consistent styling
- ✅ Reusable components
- ✅ Clear component hierarchy
- ✅ Better documentation

### 5. Modern Development
- ✅ Hot module replacement
- ✅ Better debugging tools
- ✅ React DevTools support
- ✅ Standard React patterns

## API Compatibility

All APIs remain the same:
- ✅ Gemini API integration unchanged
- ✅ Firebase authentication works the same
- ✅ PDF.js rendering compatible
- ✅ Local storage for settings

## Backward Compatibility

- ✅ Existing API keys are read from localStorage
- ✅ Firebase projects work without changes
- ✅ Notes structure compatible
- ✅ No data migration needed

## Known Differences

### Visual Changes
1. **Colors**: Slightly adjusted for Material-UI theme
2. **Spacing**: MUI spacing system (8px base)
3. **Icons**: Using MUI icons instead of Lucide
4. **Buttons**: MUI button styles

### Functional Changes
1. **Layout**: Side-by-side instead of single view
2. **Navigation**: Tabs instead of separate views
3. **Focus Monitor**: Simplified implementation

### Removed Features
- None - all features migrated

### New Features
- Improved responsive design
- Better accessibility
- Keyboard navigation support
- Better error handling

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### PDF Not Rendering
- Check PDF.js CDN availability
- Verify file is valid PDF
- Check browser console for errors

### Firebase Issues
- Verify config in `src/firebase/config.js`
- Check Firebase console for auth settings
- Ensure authorized domains are set

## Future Enhancements

### Planned
- [ ] TypeScript conversion
- [ ] Unit tests with Jest
- [ ] E2E tests with Cypress
- [ ] Progressive Web App (PWA) features
- [ ] Offline mode improvements
- [ ] Multi-language support

### Under Consideration
- [ ] Dark mode
- [ ] Annotation tools
- [ ] Collaborative features
- [ ] Mobile app (React Native)

## Support

For issues or questions:
1. Check the README_REACT.md
2. Review this migration guide
3. Check browser console for errors
4. Open an issue on GitHub

---

**Migration completed successfully! 🎉**

