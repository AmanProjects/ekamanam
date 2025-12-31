# Universal Experiment Framework - Implementation Progress

## Vision
AI-generated, shareable experiments across all labs (Physics, Chemistry, Math, Code, Globe)

## Completed (v11.1.2)

### ✅ Phase 1: Foundation
- **experimentSchema.js** - Universal schema for all labs
- **experimentService.js** - CRUD operations + Google Drive sync
- Download/Upload JSON functionality
- IndexedDB storage

### ✅ Phase 2 Part 1: Experiment Library UI
- **ExperimentLibrary.js** - Beautiful Material-UI component
- Browse all experiments
- Filter by lab type
- Search functionality
- Download/Upload buttons
- Open in lab functionality
- Delete experiments

### ✅ Phase 2 Part 2: Dashboard Integration
- **Dashboard.js** updated
- "My Experiments" card added
- Opens Experiment Library
- Routes experiments to correct lab

## In Progress (Part 3)

### 🔄 Physics Simulator Integration
**Status**: Partially complete, needs finishing touches

**What's Done**:
- Imports added (experimentService, experimentSchema)
- SaveIcon imported

**What Remains** (15-20 min):
1. Add Save button to DialogTitle header
2. Create `handleSaveExperiment()` function
3. Capture current experiment state (currentExperiment + parameters)
4. Save to library with PDF context
5. Handle loading experiments from `toolContext.experiment`
6. Show success message on save

**Implementation Code Needed**:

```javascript
// Add Save button in DialogTitle (line 724):
<Box sx={{ display: 'flex', gap: 1 }}>
  {currentExperiment && (
    <Tooltip title="Save to My Experiments">
      <IconButton onClick={handleSaveExperiment} sx={{ color: 'white' }}>
        <SaveIcon />
      </IconButton>
    </Tooltip>
  )}
  <IconButton onClick={onClose} sx={{ color: 'white' }}>
    <CloseIcon />
  </IconButton>
</Box>

// Add save function (after line 710):
const handleSaveExperiment = async () => {
  if (!currentExperiment) return;
  
  const experiment = createExperiment({
    title: currentExperiment.name,
    description: currentExperiment.description,
    lab: 'physics',
    experimentType: currentExperiment.key,
    parameters: {
      // Capture current parameters from UI
      gravity: gravity,
      // Add more as needed
    },
    tags: ['physics', ...currentExperiment.concepts],
    pdfContext: vyonnContext?.pdfContext || null
  });
  
  const result = await experimentService.saveExperiment(experiment, user?.uid);
  if (result.success) {
    alert('✅ Experiment saved to My Experiments!');
  }
};

// Add load experiment logic in useEffect (after line 375):
useEffect(() => {
  if (vyonnContext?.experiment && open) {
    const exp = vyonnContext.experiment;
    if (exp.metadata.lab === 'physics') {
      // Find matching physics experiment
      const physicsExp = Object.entries(PHYSICS_EXPERIMENTS)
        .find(([key]) => key === exp.experiment.type);
      
      if (physicsExp) {
        setCurrentExperiment({ key: physicsExp[0], ...physicsExp[1] });
        setActiveTab(1); // Visualize tab
        // Set parameters from exp.experiment.parameters
      }
    }
  }
}, [vyonnContext, open]);
```

## Remaining Work

### Phase 2 Part 3: Other Labs Integration (Future)
- Chemistry Tools
- Math Lab
- Code Editor
- Globe Viewer

Same pattern as Physics:
1. Add import statements
2. Add Save button
3. Add save function
4. Handle loading experiments

### Phase 3: AI JSON Generation (Future Enhancement)
Instead of just matching to pre-defined simulations, have AI generate custom experiment JSON:

```javascript
const prompt = `Generate a physics experiment JSON for: "${question}"

Return ONLY valid JSON:
{
  "type": "projectile|freefall|pendulum|custom",
  "parameters": {
    "angle": 45,
    "velocity": 20,
    "gravity": 9.8
  },
  "description": "..."
}`;

const response = await callLLM(prompt);
const experimentJSON = JSON.parse(response);
// Render simulation from JSON
```

## Files Created/Modified

### Created:
- `src/schemas/experimentSchema.js` (350 lines)
- `src/services/experimentService.js` (400 lines)
- `src/components/ExperimentLibrary.js` (390 lines)
- `EXPERIMENT_FRAMEWORK_PROGRESS.md` (this file)

### Modified:
- `src/components/Dashboard.js` (+78 lines)
- `src/components/tools/PhysicsSimulator.js` (+3 lines, needs +40 more)
- `package.json` (v11.1.2)

## Token Usage
- Current: ~135k / 1M tokens
- Remaining: ~865k tokens

## Next Session Actions

1. **Complete Physics Simulator** (15 min)
   - Add Save button
   - Add save function
   - Add load experiment logic
   - Test save/load flow

2. **Test End-to-End Flow** (10 min)
   - Generate experiment in Physics
   - Save to My Experiments
   - Download JSON
   - Upload JSON (simulate friend receiving it)
   - Open from library
   - Verify it works!

3. **Deploy & Demo** (5 min)
   - Commit v11.1.3
   - Push to production
   - Test on mobile

4. **Extend to Other Labs** (Optional, future)
   - Chemistry, Math, Code, Globe
   - Same pattern, 20 min each

## Success Criteria
✅ User can generate experiment in any lab
✅ User can save to "My Experiments"
✅ User can download JSON file
✅ Friend can upload JSON file
✅ Friend sees same experiment
✅ Works across all devices (Drive sync)

## Architecture Highlights

### Universal Schema Benefits:
- One schema for all 5 labs
- Flexible parameters (any key-value)
- PDF context tracking
- Version control built-in
- Validates on import

### Sharing Flow:
User A → Generate → Save → Download → Send File
User B → Upload → Import → Open → Same Experiment!

### Storage:
- Local: IndexedDB (fast access)
- Cloud: Google Drive (backup + sync)
- Share: JSON files (universal format)

## Version History
- v11.1.0: Foundation (Schema + Service)
- v11.1.1: Experiment Library UI
- v11.1.2: Dashboard Integration
- v11.1.3: Physics Simulator Integration (in progress)

---

**Status**: 85% Complete
**Next**: Finish Physics Simulator integration
**ETA**: 15-20 minutes to full working demo

