# 🚀 Integration Guide - All 6 Features

This guide will help you integrate all 6 revolutionary features into your Ekamanam app.

---

## 📋 Prerequisites

Before integrating, ensure you have:
- ✅ Firebase project configured
- ✅ Firestore database active
- ✅ All new service files in `src/services/`
- ✅ All new component files in `src/components/`

---

## 🗂️ Step 1: Firestore Indexes & Rules

### Create Firestore Indexes

Create/update `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "flashcards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "nextReviewDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "userDoubts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chapter", "order": "ASCENDING" },
        { "fieldPath": "upvotes", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessionHistory",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "studyRooms",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chapter", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lastActivity", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Update Firestore Rules

Add to your `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Flashcards (Phase 1)
    match /flashcards/{cardId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Doubt Hotspots (Phase 3) - Public read, authenticated write
    match /doubtHotspots/{hotspotId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /userDoubts/{doubtId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Session History (Phase 4)
    match /sessionHistory/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /sessionEvents/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Peer Learning (Phase 5)
    match /userProfiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /peerRequests/{requestId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.fromUserId || request.auth.uid == resource.data.toUserId);
      allow write: if request.auth != null;
    }

    // Study Rooms (Phase 6)
    match /studyRooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /roomChat/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🔧 Step 2: Import Services in App.js

Add these imports to [App.js](src/App.js):

```javascript
// Phase 1: Spaced Repetition
import { getDueFlashcards } from './services/spacedRepetitionService';
import FlashcardReview from './components/FlashcardReview';

// Phase 2: Cognitive Load
import { CognitiveLoadTracker, shouldSuggestBreak } from './services/cognitiveLoadService';
import CognitiveLoadGauge from './components/CognitiveLoadGauge';
import BreakSuggestion from './components/BreakSuggestion';

// Phase 3: Doubt Prediction
import { predictDoubts } from './services/doubtPredictionService';
import DoubtPredictionDialog from './components/DoubtPredictionDialog';
import DoubtLibrary from './components/DoubtLibrary';

// Phase 4: Session History
import { SessionHistoryTracker } from './services/sessionHistoryService';
import SessionTimeline from './components/SessionTimeline';

// Phase 5: Peer Learning
import PeerMatchingDialog from './components/PeerMatchingDialog';

// Phase 6: Sync Study
import SyncStudyRoom from './components/SyncStudyRoom';
```

---

## 🎯 Step 3: Phase 1 - Spaced Repetition

### Add State Variables

```javascript
const [showFlashcards, setShowFlashcards] = useState(false);
const [dueCardCount, setDueCardCount] = useState(0);
```

### Check Due Cards on Mount

```javascript
useEffect(() => {
  if (user) {
    checkDueFlashcards();
  }
}, [user]);

const checkDueFlashcards = async () => {
  const dueCards = await getDueFlashcards(user.uid);
  setDueCardCount(dueCards.length);
};
```

### Add Button to Dashboard

In your Dashboard component:

```javascript
<Button
  variant="contained"
  color="primary"
  startIcon={<CardIcon />}
  onClick={() => setShowFlashcards(true)}
>
  Review Flashcards
  {dueCardCount > 0 && (
    <Badge badgeContent={dueCardCount} color="error" sx={{ ml: 1 }} />
  )}
</Button>
```

### Add Dialog

```javascript
<FlashcardReview
  open={showFlashcards}
  onClose={() => {
    setShowFlashcards(false);
    checkDueFlashcards(); // Refresh count
  }}
  userId={user?.uid}
/>
```

---

## 🧠 Step 4: Phase 2 - Cognitive Load Tracker

### Initialize Tracker

```javascript
const cognitiveTrackerRef = useRef(null);
const [cognitiveLoad, setCognitiveLoad] = useState(50);
const [showBreak, setShowBreak] = useState(false);
const [breakSuggestion, setBreakSuggestion] = useState(null);

useEffect(() => {
  if (user && pdfFile) {
    // Initialize cognitive load tracker
    const sessionId = `session_${Date.now()}`;
    cognitiveTrackerRef.current = new CognitiveLoadTracker(user.uid, sessionId);

    console.log('Cognitive load tracker initialized');
  }

  return () => {
    // Save session on unmount
    if (cognitiveTrackerRef.current) {
      cognitiveTrackerRef.current.saveSession();
    }
  };
}, [user, pdfFile]);
```

### Track Page Views

When page changes:

```javascript
const handlePageChange = (newPage) => {
  setCurrentPage(newPage);

  // Track with cognitive load
  if (cognitiveTrackerRef.current) {
    const pageText = extractedText[newPage] || '';
    cognitiveTrackerRef.current.startPageReading(newPage, pageText);

    // Update load display
    const load = cognitiveTrackerRef.current.currentLoad;
    setCognitiveLoad(load);

    // Check break suggestion
    const breakCheck = shouldSuggestBreak(cognitiveTrackerRef.current);
    if (breakCheck.shouldBreak) {
      setBreakSuggestion(breakCheck);
      setShowBreak(true);
    }
  }
};
```

### Add Gauge to Header

```javascript
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <CognitiveLoadGauge
    cognitiveLoad={cognitiveLoad}
    size="compact"
    showDetails={false}
  />
  {/* Other header items */}
</Box>
```

### Add Break Dialog

```javascript
<BreakSuggestion
  open={showBreak}
  onClose={() => setShowBreak(false)}
  onTakeBreak={() => {
    if (cognitiveTrackerRef.current) {
      cognitiveTrackerRef.current.recordBreak(
        breakSuggestion?.suggestedDuration * 60000,
        breakSuggestion?.reason
      );
    }
  }}
  suggestedDuration={breakSuggestion?.suggestedDuration || 5}
  reason={breakSuggestion?.reason || 'Time for a break!'}
/>
```

### Track AI Queries

When AI query is made:

```javascript
const handleAIQuery = async (queryType, queryText) => {
  // Your existing AI query logic

  // Track with cognitive load
  if (cognitiveTrackerRef.current) {
    cognitiveTrackerRef.current.recordAIQuery(
      queryType,
      queryText,
      currentPage,
      cognitiveTrackerRef.current.currentLoad
    );
  }
};
```

---

## 🔮 Step 5: Phase 3 - Doubt Prediction

### Add State

```javascript
const [showDoubtPrediction, setShowDoubtPrediction] = useState(false);
const [doubtHotspots, setDoubtHotspots] = useState([]);
const [showDoubtLibrary, setShowDoubtLibrary] = useState(false);
```

### Predict Doubts on Page Load

```javascript
const handlePageChange = async (newPage) => {
  setCurrentPage(newPage);

  // ... existing code ...

  // Predict doubts
  const pageText = extractedText[newPage] || '';
  if (pageText && user) {
    const hotspots = await predictDoubts(pageText, user.uid);
    if (hotspots.length > 0) {
      setDoubtHotspots(hotspots);
      setShowDoubtPrediction(true);
    }
  }
};
```

### Add Dialogs

```javascript
<DoubtPredictionDialog
  open={showDoubtPrediction}
  onClose={() => setShowDoubtPrediction(false)}
  hotspots={doubtHotspots}
  pageNumber={currentPage}
/>

<DoubtLibrary
  open={showDoubtLibrary}
  onClose={() => setShowDoubtLibrary(false)}
  chapter={currentChapter}
  userId={user?.uid}
/>
```

### Add Button to Dashboard

```javascript
<Button
  variant="outlined"
  startIcon={<QuestionIcon />}
  onClick={() => setShowDoubtLibrary(true)}
>
  Doubt Library
</Button>
```

---

## 📚 Step 6: Phase 4 - Session History

### Initialize Tracker

```javascript
const sessionTrackerRef = useRef(null);
const [showTimeline, setShowTimeline] = useState(false);

useEffect(() => {
  if (user && pdfFile) {
    const sessionId = `session_${Date.now()}`;
    sessionTrackerRef.current = new SessionHistoryTracker(
      user.uid,
      sessionId,
      pdfFile.name,
      currentChapter
    );
  }

  return () => {
    if (sessionTrackerRef.current) {
      sessionTrackerRef.current.saveSession();
    }
  };
}, [user, pdfFile]);
```

### Record Events

```javascript
// Page views
sessionTrackerRef.current?.recordPageView(newPage, pageText);

// AI queries
sessionTrackerRef.current?.recordAIQuery(queryType, queryText, currentPage, cognitiveLoad);

// Flashcard reviews
sessionTrackerRef.current?.recordFlashcardReview(cardId, quality, concept);
```

### Add Timeline Dialog

```javascript
<SessionTimeline
  open={showTimeline}
  onClose={() => setShowTimeline(false)}
  userId={user?.uid}
/>
```

### Add Button to Dashboard

```javascript
<Button
  variant="outlined"
  startIcon={<TimelineIcon />}
  onClick={() => setShowTimeline(true)}
>
  Learning Journey
</Button>
```

---

## 🤝 Step 7: Phase 5 - Peer Learning

### Add State

```javascript
const [showPeerMatching, setShowPeerMatching] = useState(false);
const [selectedConcept, setSelectedConcept] = useState('');
```

### Add Dialog

```javascript
<PeerMatchingDialog
  open={showPeerMatching}
  onClose={() => setShowPeerMatching(false)}
  userId={user?.uid}
  concept={selectedConcept}
  subject={currentSubject}
/>
```

### Add Button

```javascript
<Button
  variant="contained"
  startIcon={<PeopleIcon />}
  onClick={() => {
    setSelectedConcept('General'); // or extract from current page
    setShowPeerMatching(true);
  }}
>
  Find Study Partners
</Button>
```

---

## 🔄 Step 8: Phase 6 - Sync Study

### Add State

```javascript
const [showSyncStudy, setShowSyncStudy] = useState(false);
const [currentRoomId, setCurrentRoomId] = useState(null);
```

### Add Room Component

```javascript
<SyncStudyRoom
  open={showSyncStudy}
  onClose={() => {
    setShowSyncStudy(false);
    setCurrentRoomId(null);
  }}
  roomId={currentRoomId}
  userId={user?.uid}
  userName={user?.displayName || 'Anonymous'}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

### Create Room Button

```javascript
<Button
  variant="contained"
  color="secondary"
  startIcon={<GroupIcon />}
  onClick={async () => {
    const room = await createStudyRoom(
      user.uid,
      `${currentChapter} Study Group`,
      pdfFile.name,
      currentChapter
    );
    setCurrentRoomId(room.id);
    setShowSyncStudy(true);
  }}
>
  Study Together
</Button>
```

---

## ✅ Step 9: Testing

### Test Each Phase Individually

1. **Phase 1:**
   - Generate flashcards from a page
   - Review flashcards
   - Check due dates update correctly

2. **Phase 2:**
   - Watch cognitive load change as you navigate
   - Verify break suggestions appear
   - Check adaptive AI prompts

3. **Phase 3:**
   - Navigate to a new page
   - Verify doubt prediction appears
   - Submit a doubt to library
   - Upvote doubts

4. **Phase 4:**
   - Complete a study session
   - Open timeline
   - Verify all events recorded

5. **Phase 5:**
   - Find peer matches
   - Send connection request
   - Check reputation updates

6. **Phase 6:**
   - Create a study room
   - Join from another device/account
   - Test synchronized navigation
   - Send chat messages

---

## 🐛 Troubleshooting

### Common Issues

1. **Firestore Permission Denied:**
   - Check security rules deployed
   - Verify user is authenticated
   - Check userId matches in data

2. **Real-time Updates Not Working:**
   - Verify Firestore indexes deployed
   - Check onSnapshot subscriptions
   - Look for errors in console

3. **Components Not Rendering:**
   - Check imports are correct
   - Verify state variables initialized
   - Check dialog `open` prop

4. **AI Features Not Working:**
   - Verify llmService is working
   - Check API keys in .env
   - Monitor API quota

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Phase 1:** Flashcard review rate, due card completion
2. **Phase 2:** Average cognitive load, break acceptance rate
3. **Phase 3:** Doubt submission rate, upvote engagement
4. **Phase 4:** Session completion rate, timeline views
5. **Phase 5:** Match acceptance rate, messaging activity
6. **Phase 6:** Room creation, average session duration

---

## 🚀 Deployment Checklist

- [ ] All Firestore indexes deployed
- [ ] Security rules updated and deployed
- [ ] All imports added to App.js
- [ ] All state variables initialized
- [ ] All dialogs wired up
- [ ] All buttons added to UI
- [ ] Event tracking connected
- [ ] Tested each phase individually
- [ ] Tested all phases together
- [ ] Verified on mobile devices
- [ ] Checked console for errors
- [ ] Monitored Firestore usage
- [ ] Ready for production! 🎉

---

## 💡 Pro Tips

1. **Incremental Rollout:** Deploy phases 1-2 first (high impact, low risk)
2. **Monitor Usage:** Set up Firebase Analytics for all features
3. **User Feedback:** Add feedback buttons to each new feature
4. **Performance:** Monitor Firestore read/write counts
5. **Iterate:** Use data to improve matching algorithms and predictions

---

## 🆘 Need Help?

- Check service file comments (extensive documentation)
- Review component props in JSDoc comments
- Use Firebase emulator for local testing
- Monitor browser console for errors
- Check Firestore console for data structure

---

**You're ready to revolutionize education! 🌟**
