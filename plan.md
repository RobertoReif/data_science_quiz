# Implementation Plan: Data Science Quiz Game

## Overview
Building a **real-time multi-device** data science quiz game for 16-50 simultaneous players using Firebase Realtime Database. Features a clean, minimal design following the Roberto Reif style guide.

## Technical Architecture
- **Frontend**: Single HTML file with embedded CSS/JavaScript (GitHub Pages compatible)
- **Backend**: Firebase Realtime Database (real-time synchronization)
- **Hosting**: GitHub Pages (static hosting)
- **Data**: Separate questions.json file (loaded via fetch)
- **Session Management**: URL-based game codes (e.g., `index.html?game=ABC123`)
- **Roles**: Host (controls game flow) + Players (answer questions)

---

## Key Technical Decisions

### Why Firebase Realtime Database?
- **GitHub Pages Compatible**: Works perfectly with static hosting (no server required)
- **Real-Time Sync**: Built-in WebSocket connections for instant updates across 16-50 devices
- **Free Tier (Spark Plan)**:
  - **100 simultaneous connections** (supports 2 concurrent 50-player games OR 6 concurrent 16-player games)
  - 1GB stored data (sufficient for hundreds of game sessions)
  - 10GB/month data transfer (approximately 1,500-2,000 game sessions per month)
- **No Server Code**: All logic runs client-side, no backend deployment needed
- **Proven Scale**: Handles 50 concurrent players per game easily
- **Simple API**: `.on('value')` for real-time listeners, `.set()` for updates

**IMPORTANT - Free Tier Connection Limits:**
- With 50 players per game: **Maximum 2 concurrent games** on free tier
- With 30 players per game: **Maximum 3 concurrent games** on free tier
- With 16 players per game: **Maximum 6 concurrent games** on free tier
- If you need more concurrent games, upgrade to **Blaze Plan (Pay-as-you-go)**:
  - $5/month minimum (includes 100k connections)
  - Additional: $1 per GB stored, $0.054 per GB downloaded
- **For single classroom/workshop use**: Free tier is sufficient
- **For public deployment**: Monitor usage and upgrade if needed

### Why Host-Controlled Game Flow?
- **Simpler Synchronization**: One source of truth (host) prevents race conditions
- **Intentional Pacing**: Host can control when to advance (e.g., explain answer before next question)
- **Classroom/Workshop Friendly**: Natural for instructor-led scenarios with 16-50 participants
- **Reduced Complexity**: No need for distributed consensus algorithms

### Why URL-Based Session Management?
- **Easy Sharing**: Copy/paste URL or QR code for quick joining
- **No Account System**: Players don't need to log in or create accounts
- **Bookmark-able**: Can save game URL for reference
- **Deep Linking**: Direct join via URL parameter

### Data Flow
```
Host Device                  Firebase                    Player Devices
    |                           |                             |
    |-- Create game ----------->|                             |
    |<-- Game code ABC123 ------|                             |
    |                           |<---- Join game (URL) -------|
    |<-- Player joined ---------|                             |
    |-- Start game ------------>|                             |
    |                           |---- Game started ---------->|
    |-- Timer start ----------->|                             |
    |                           |---- Timer sync ------------>|
    |                           |<---- Answer submitted ------|
    |<-- Answer count ----------|                             |
    |-- Next question --------->|                             |
    |                           |---- New question ---------->|
```

---

## Phase 1: Project Setup & Structure

### 1.1 File Structure
- Create `index.html` (main game file with embedded CSS/JS)
- Create `questions.json` (question bank - loaded via fetch)
- Create `README.md` with Firebase setup instructions

### 1.2 Firebase Setup
- Include Firebase SDK via CDN (Realtime Database only, ~50KB)
- Add Firebase configuration object (user will add their own credentials)
- Initialize Firebase connection
- Set up database security rules for game sessions

### 1.3 HTML Skeleton
- Set up semantic HTML5 structure
- Add viewport meta tag for mobile responsiveness
- Include Firebase SDK script tags
- Include basic page structure with containers for:
  - Host screen (create game)
  - Player screen (join game)
  - Game screen (questions)
  - Score display screen
  - Final results screen

---

## Phase 2: Core HTML Components

### 2.1 Role Selection Screen
- "Create Game" button (become host)
- "Join Game" button (become player)
- Display current role

### 2.2 Host Screen - Game Creation
- Generate unique game code (6-character alphanumeric)
- Display shareable URL: `yoursite.github.io/game?game=ABC123`
- Copy URL button
- QR code generation (optional, for easy mobile joining)
- Live player list showing who has joined
- "Start Game" button (enabled when 1+ players joined)

### 2.3 Player Screen - Join Game
- Detect game code from URL parameter
- Name input field
- "Join Game" button
- Waiting screen: "Waiting for host to start..."
- Display other players who have joined

### 2.4 Game Screen (Both Host and Players)
**Host View:**
- Question display area
- Timer countdown (host controls timer start)
- Four answer option buttons (host also plays)
- Live indicator: "X/Y players answered"
- Player answer status list (who answered, who's still thinking)
- "Next Question" button (appears when all answered OR time expires)

**Player View:**
- Question display area
- Timer countdown (synced from host)
- Four answer option buttons
- "Waiting for other players..." message after answering
- Cannot see other players' chosen answers (prevent cheating)

### 2.5 Score Display Screen (After Each Question)
- Show correct answer highlighted
- Leaderboard: all players sorted by current score
- Show score changes (+10 or +0) next to each name
- Visual indicator for top 3 players
- Host controls: "Next Question" button
- Players see: "Waiting for host to continue..."

### 2.6 End Screen
- Final leaderboard (top 10 if 50 players, or all if fewer)
- Winner announcement (1st, 2nd, 3rd highlighted)
- Host controls: "New Game" button
- Players see: "Game Over" message with final ranking
- Option to copy results as text

---

## Phase 3: CSS Styling

### 3.1 Apply Style Guide Fundamentals
- **Colors:**
  - Background: `#ffffff`
  - Primary text: `#333333`
  - Secondary text: `#666666`
  - Borders: `#e0e0e0`

- **Typography:**
  - Font family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
  - H1: ~2.5rem, font-weight 400
  - Body: 1rem to 1.1rem, line-height 1.6-1.7

### 3.2 Layout & Spacing
- Max content width: 1000px, centered
- Desktop padding: 80px
- Mobile padding: 20px
- Section spacing: 40px-60px

### 3.3 Interactive Elements
- Button styling (padding, hover states)
- Answer option buttons (distinct selected/hover states)
- Smooth transitions (0.3s ease)
- Focus states for accessibility

### 3.4 Responsive Design
- Mobile breakpoint: ≤640px
- Flexible layouts (flexbox/grid)
- Touch-friendly button sizes (minimum 44px)
- Reduced spacing on mobile

---

## Phase 4: JavaScript Functionality

### 4.1 Firebase Integration
- Initialize Firebase app with config object
- Connect to Realtime Database
- Set up database reference structure:
  ```
  /games/{gameCode}/
    - hostId: string
    - status: 'waiting' | 'playing' | 'showing-scores' | 'ended'
    - currentQuestion: number
    - timerStartedAt: timestamp
    - players: {
        {playerId}: {
          name: string,
          score: number,
          connected: boolean
        }
      }
    - answers: {
        {questionIndex}: {
          {playerId}: {
            answer: number (0-3),
            timestamp: number
          }
        }
      }
  ```

### 4.2 Data Management
- Load questions from `questions.json` (fetch API)
- Parse JSON structure
- Cache questions in memory
- Validate question format

### 4.3 Game Code Generation & URL Handling
- Generate random 6-character alphanumeric code
- Check for URL parameter: `?game=ABC123`
- If present, extract game code and switch to "Join" mode
- If not present, show "Create Game" / "Join Game" options

### 4.4 Host Logic - Game Creation
- Generate unique game code
- Create Firebase database entry at `/games/{gameCode}`
- Set host ID (generated unique identifier)
- Listen for player joins in real-time
- Display shareable URL with game code
- Enable "Start Game" when 1+ players present
- On start: update game status to 'playing'

### 4.5 Player Logic - Joining Game
- Extract game code from URL
- Validate game exists in Firebase
- Prompt for player name
- Check for duplicate names in real-time
- Generate unique player ID
- Write player data to Firebase: `/games/{gameCode}/players/{playerId}`
- Set connected status to true
- Listen for game state changes

### 4.6 Real-Time Synchronization
- **Host listeners:**
  - Player joins/disconnections
  - Player answer submissions
  - All answered or timer expiration

- **Player listeners:**
  - Game status changes (waiting → playing → showing-scores → ended)
  - Current question updates
  - Timer synchronization
  - Score updates

- **Both listeners:**
  - Connection status (detect disconnections)
  - Use Firebase `.on('value')` for real-time updates

### 4.7 Game Loop Logic (Host-Controlled)

**Host Actions - Using Transactions to Prevent Race Conditions:**

```javascript
// Advance to next question (atomic operation)
function advanceToNextQuestion() {
  // Prevent double-clicking
  if (isAdvancing) return;
  isAdvancing = true;

  const questionRef = firebase.database().ref(`games/${gameCode}/currentQuestion`);

  // Use transaction to atomically increment
  questionRef.transaction((currentValue) => {
    if (currentValue === null) return 0;
    return currentValue + 1;
  }, (error, committed, snapshot) => {
    if (error) {
      console.error('Transaction failed:', error);
    } else if (committed) {
      const newQuestion = snapshot.val();

      // Update status based on question number
      if (newQuestion >= totalQuestions) {
        // Game ended
        firebase.database().ref(`games/${gameCode}/status`).set('ended');
      } else {
        // Show scores, then continue to next question
        firebase.database().ref(`games/${gameCode}/status`).set('showing-scores');

        // Start timer for new question
        setTimeout(() => {
          firebase.database().ref(`games/${gameCode}/status`).set('playing');
          firebase.database().ref(`games/${gameCode}/timerStartedAt`)
            .set(firebase.database.ServerValue.TIMESTAMP);
        }, 3000); // 3-second score display
      }
    }

    // Re-enable button after 1 second debounce
    setTimeout(() => { isAdvancing = false; }, 1000);
  });
}

// Auto-advance when timer expires
let timerExpiredHandled = false;
function onTimerExpired() {
  if (timerExpiredHandled) return; // Prevent duplicate calls
  timerExpiredHandled = true;

  advanceToNextQuestion();

  // Reset flag after 2 seconds
  setTimeout(() => { timerExpiredHandled = false; }, 2000);
}

// Auto-advance when all players answer
let allAnsweredHandled = false;
function onAllPlayersAnswered() {
  if (allAnsweredHandled) return; // Prevent duplicate calls
  allAnsweredHandled = true;

  advanceToNextQuestion();

  // Reset flag after 2 seconds
  setTimeout(() => { allAnsweredHandled = false; }, 2000);
}

// Monitor answer count
firebase.database().ref(`games/${gameCode}/answers/${currentQuestion}`)
  .on('value', (snap) => {
    const answerCount = snap.numChildren();
    const playerCount = getTotalPlayers();

    if (answerCount >= playerCount) {
      onAllPlayersAnswered();
    }
  });
```

**Why Transactions:**
- ✅ Prevents double-advance if timer expires AND last player answers simultaneously
- ✅ Atomic increment ensures currentQuestion never skips or duplicates
- ✅ Debouncing prevents rapid clicking "Next Question" button
- ✅ Handles race conditions gracefully

**Player Reactions:**
- Listen to `currentQuestion` change → display new question
- Listen to `timerStartedAt` → calculate remaining time client-side
- Submit answer → write to Firebase `/answers/{questionIndex}/{playerId}`
- Display "waiting..." after answering
- UI updates automatically from Firebase listeners

### 4.8 Timer Implementation

**CRITICAL**: Use Firebase server timestamps to prevent clock skew issues.

**Initial Setup (All Clients):**
```javascript
// Calculate offset between client and Firebase server time
let serverTimeOffset = 0;
firebase.database().ref('.info/serverTimeOffset').on('value', (snap) => {
  serverTimeOffset = snap.val() || 0;
});
```

**Host Timer Start:**
```javascript
// Write server timestamp (not Date.now()!)
firebase.database().ref(`games/${gameCode}/timerStartedAt`)
  .set(firebase.database.ServerValue.TIMESTAMP);
```

**All Clients (Host + Players) - Timer Display:**
```javascript
// Listen to timer start
firebase.database().ref(`games/${gameCode}/timerStartedAt`).on('value', (snap) => {
  const timerStartedAt = snap.val();
  if (!timerStartedAt) return;

  // Calculate current server time using offset
  const estimatedServerTime = Date.now() + serverTimeOffset;
  const elapsedMs = estimatedServerTime - timerStartedAt;
  const remainingTime = Math.max(0, 30 - elapsedMs / 1000);

  // Update UI countdown
  updateTimerDisplay(Math.ceil(remainingTime));

  // Auto-disable answers when time expires
  if (remainingTime <= 0) {
    disableAnswerButtons();
  }
});

// Update display every 1 second (not 100ms - better performance)
setInterval(() => {
  // Recalculate and update display
}, 1000);
```

**Why Server Timestamps:**
- ✅ Eliminates clock skew (devices with wrong time)
- ✅ All clients synchronized to Firebase server time
- ✅ Accurate within ~100-500ms (network latency)
- ✅ Works even if device clock is hours/days off

**Performance Note:**
- Update timer display every **1 second** (not 100ms)
- Reduces CPU/battery usage, especially with 50 players
- 1-second granularity is acceptable for 30-second timer

### 4.9 Scoring Logic
- Read all answers from Firebase: `/answers/{questionIndex}/`
- Compare each player's answer to `questions[index].correct`
- Award +10 for correct, +0 for incorrect/no answer
- Update player scores in Firebase: `/games/{gameCode}/players/{playerId}/score`
- Real-time listeners update all player screens automatically

### 4.10 Score Display Screen Logic
- Host updates status to 'showing-scores'
- All devices listen and switch to score display view
- Fetch current question's correct answer
- Fetch all player answers from Firebase
- Display leaderboard sorted by score
- Highlight who got it right/wrong
- Show score deltas (+10, +0)
- Host clicks "Next Question" or "End Game"

### 4.11 Disconnection Handling

**Player Disconnection:**
```javascript
// Set up disconnection tracking for each player
const playerRef = firebase.database().ref(`games/${gameCode}/players/${playerId}`);
const connectedRef = firebase.database().ref('.info/connected');

connectedRef.on('value', (snap) => {
  if (snap.val() === true) {
    // Mark as connected
    playerRef.child('connected').set(true);

    // Set up automatic disconnect handler
    playerRef.child('connected').onDisconnect().set(false);
    playerRef.child('lastSeen').onDisconnect()
      .set(firebase.database.ServerValue.TIMESTAMP);
  }
});
```

- Host sees "(Disconnected)" next to player name
- Disconnected players marked as no-answer (0 points) for remaining questions
- Game continues without pausing
- Players cannot rejoin after disconnection (prevents cheating)

**Host Disconnection - CRITICAL RECOVERY:**

```javascript
// Monitor host connection status
const hostRef = firebase.database().ref(`games/${gameCode}/players/${hostId}`);
hostRef.child('connected').on('value', (snap) => {
  const isHostConnected = snap.val();

  if (!isHostConnected) {
    // Start countdown timer
    hostDisconnectedAt = Date.now();
    showHostDisconnectedWarning();

    // Check if host reconnects within 2 minutes
    setTimeout(() => {
      hostRef.child('connected').once('value', (reconnectSnap) => {
        if (!reconnectSnap.val()) {
          // Host still disconnected after 2 minutes
          offerHostMigration();
        }
      });
    }, 120000); // 2 minutes
  } else {
    hideHostDisconnectedWarning();
  }
});
```

**Host Migration (After 2 Minutes):**
1. Display to all players: "Host disconnected. Would you like to become the new host?"
2. First player to click "Become Host" button gets promoted
3. Update Firebase: `firebase.database().ref(`games/${gameCode}/hostId`).set(newHostId)`
4. New host gains full game control (Next Question, End Game buttons)
5. Original host (if reconnects) becomes regular player

**Alternative: Auto-End Game**
- If no players volunteer to be host within 1 minute, auto-end game
- Display final scores as-is
- Mark game status as 'ended'

**Implementation Note:**
This ensures games don't freeze permanently when host loses connection, which is critical for 16-50 player games.

### 4.12 End Screen Logic
- Host updates status to 'ended'
- All devices switch to final results view
- Fetch final scores from Firebase
- Sort players by score (highest first)
- Display top 10 (or all if <10 players)
- Highlight top 3 with visual distinction
- Host option to create new game (resets state)

### 4.13 Edge Case Handling

**Connection Issues:**
- Host disconnects: Host migration after 2 minutes (see section 4.11)
- Player disconnects: Marked disconnected, receives 0 for remaining questions
- Firebase connection failure: Show offline message, queue writes for retry
- Network reconnection: Firebase automatically resumes sync

**Game State Issues:**
- Invalid game code in URL: Show "Game not found" error
- Late joiners: Cannot join after game status is 'playing'
- Question index out of bounds: Validate against `questions.length`
- Empty questions.json: Show error "No questions available"

**Race Conditions (Handled by Transactions):**
- Timer expires AND last player answers simultaneously → Transaction ensures single advance
- Rapid clicking "Next Question" → Debouncing prevents duplicate advances
- Multiple players join with same name simultaneously → Use Firebase push() for unique IDs

**Data Validation:**
- Duplicate names: Append number (e.g., "John", "John 2", "John 3")
- Invalid score values: Validate `score >= 0 && score <= 10000`
- Invalid answer submissions: Validate `answer >= 0 && answer <= 3`
- Malformed player data: Check required fields before rendering

---

## Phase 5: JSON Question Bank

### 5.1 Create questions.json
- Structure with "questions" array
- Each question object contains:
  - `question`: string
  - `options`: array of 4 strings
  - `correct`: number (0-3 index)

### 5.2 Sample Data Science Questions
- Create 10-15 sample questions covering:
  - Statistics concepts
  - Machine learning basics
  - Data visualization
  - Python/R programming
  - Data manipulation

---

## Phase 6: Polish & Testing

### 6.1 UI/UX Enhancements
- Loading state while fetching questions
- Smooth transitions between screens
- Visual feedback for correct/incorrect answers
- Disabled state for answered questions
- Clear current player turn indicator (if turn-based)
- Animate score changes

### 6.2 Error Handling
- JSON load failure handling
- Empty player list validation
- Minimum 1 player requirement

### 6.3 Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast

### 6.4 Testing Scenarios

**Single Device Testing:**
- Game code generation uniqueness
- URL parameter extraction
- Firebase connection establishment
- Questions loading from JSON

**Multi-Device Testing:**
- 2-player game (basic functionality)
- 5-player game (small group)
- 15-player game (medium group)
- 30-50 player game (stress test with simulated devices)

**Timer Synchronization:**
- All players see same countdown (within 1 second)
- Timer expires correctly on all devices
- Auto-advance works when time runs out
- Manual answer submission before time expires

**Answer Submission:**
- Player submits answer → sees "waiting..." message
- Host sees real-time answer count update
- All players answer quickly (< 10 seconds)
- Some players answer, some don't (mixed scenario)
- Last player answers → auto-advance triggers

**Disconnection Scenarios:**
- Player disconnects mid-game → marked disconnected, game continues
- Player reconnects → cannot rejoin (late join prevention)
- Host disconnects → game pauses, "Host disconnected" message
- Network interruption → Firebase reconnection handling

**Scoring:**
- Correct answer awards +10 points
- Incorrect answer awards 0 points
- No answer (timeout) awards 0 points
- Score display shows accurate deltas
- Leaderboard sorts correctly
- Ties handled appropriately (same score, same rank)

**Edge Cases:**
- Duplicate player names → auto-numbered
- Invalid game code in URL → error message
- Game code doesn't exist → "Game not found"
- Trying to join after game started → "Game in progress"
- Empty player name → validation error
- Firebase connection failure → offline message
- Rapid clicking "Next Question" → debounced

**Mobile Responsiveness:**
- Test on iPhone (Safari)
- Test on Android (Chrome)
- Test on tablet (iPad)
- Portrait and landscape orientations
- Virtual keyboard doesn't break layout
- Touch targets adequate (44px)
- URL copying works on mobile

**Cross-Browser:**
- Chrome (desktop & mobile)
- Safari (desktop & mobile)
- Firefox
- Edge

---

## Phase 7: Optimization

### 7.1 Performance
- Minimize DOM manipulations (use DocumentFragment for lists)
- Efficient Firebase listeners (detach when not needed)
- Debounce rapid updates (e.g., timer countdown)
- Lazy load questions (only fetch when needed)
- Optimize for 50 concurrent connections

### 7.2 Code Quality
- Clean, readable code with ES6+ syntax
- Consistent naming conventions (camelCase)
- Comments for Firebase listeners and complex logic
- DRY principles (avoid duplicate Firebase queries)
- Modular functions for reusability

### 7.3 Firebase Optimization
- Use `.once()` for one-time reads (game code validation)
- Use `.on()` only for real-time updates
- Properly detach listeners with `.off()` to prevent memory leaks
- Index database paths for faster queries (if needed)
- Set appropriate security rules

---

## Phase 8: Firebase Setup & Deployment

### 8.1 Firebase Project Setup
- Create Firebase project at https://console.firebase.google.com
- Enable Realtime Database
- Get Firebase config object (apiKey, databaseURL, etc.)
- Add config to HTML file

### 8.2 Database Security Rules

**IMPORTANT**: These rules balance security with simplicity for a client-side-only app without authentication.

Set up Firebase Realtime Database rules:
```json
{
  "rules": {
    "games": {
      "$gameCode": {
        ".read": "data.exists()",
        ".write": "!data.exists()",

        "hostId": {
          ".write": "!data.exists()",
          ".validate": "newData.isString() && newData.val().length > 0"
        },

        "status": {
          ".write": "data.parent().child('hostId').val() === newData.parent().child('hostId').val()",
          ".validate": "newData.isString() && (newData.val() === 'waiting' || newData.val() === 'playing' || newData.val() === 'showing-scores' || newData.val() === 'ended')"
        },

        "currentQuestion": {
          ".write": "data.parent().child('hostId').val() === newData.parent().child('hostId').val()",
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },

        "timerStartedAt": {
          ".write": "data.parent().child('hostId').val() === newData.parent().child('hostId').val()",
          ".validate": "newData.isNumber()"
        },

        "questionData": {
          ".write": "data.parent().child('hostId').val() === newData.parent().child('hostId').val()",
          ".validate": "newData.hasChildren(['question', 'options'])"
        },

        "metadata": {
          ".write": "!data.exists() || data.parent().child('hostId').val() === newData.parent().child('hostId').val()"
        },

        "players": {
          "$playerId": {
            ".write": true,
            ".validate": "newData.hasChildren(['name', 'score', 'connected'])",
            "name": {
              ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 30"
            },
            "score": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 10000"
            },
            "connected": {
              ".validate": "newData.isBoolean()"
            }
          }
        },

        "answers": {
          "$questionIndex": {
            "$playerId": {
              ".write": "!data.exists()",
              ".validate": "newData.hasChildren(['answer', 'timestamp'])",
              "answer": {
                ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 3"
              },
              "timestamp": {
                ".validate": "newData.isNumber()"
              }
            }
          }
        }
      }
    }
  }
}
```

**What These Rules Allow:**
- ✅ Anyone can read existing game data
- ✅ Anyone can create new games (but not overwrite)
- ✅ Players can add themselves and update their own data
- ✅ Players can submit answers (once per question)
- ✅ Answers cannot be modified after submission
- ❌ Players cannot modify game state (status, currentQuestion, timer)
- ❌ Players cannot delete other players
- ❌ Score values are capped at 10,000 (prevents overflow attacks)

**Security Limitations (No Authentication):**
- ⚠️ Host identification relies on storing hostId - not cryptographically secure
- ⚠️ Malicious users could still spam player joins
- ⚠️ A determined attacker could impersonate host if they know hostId
- ✅ For classroom/workshop use with trusted participants, this is acceptable
- 💡 For public deployment, consider enabling Firebase Anonymous Auth for stronger security

### 8.3 GitHub Pages Deployment
- Push code to GitHub repository
- Enable GitHub Pages in repository settings
- Set source to main branch / root
- Access at: `https://username.github.io/repository-name/`
- Share game URL: `https://username.github.io/repository-name/?game=ABC123`

### 8.4 Testing Deployment
- Test game creation from deployed URL
- Test joining from multiple devices (phone, tablet, desktop)
- Verify Firebase connection works from GitHub Pages
- Check HTTPS compatibility (Firebase requires secure connection)
- Test with multiple simultaneous game sessions

---

## Implementation Order

1. **Setup & Structure** (2-3 hours)
   - Create HTML structure with all screens (host, player, game, scores, end)
   - Add Firebase SDK via CDN
   - Apply CSS styling following style guide
   - Ensure mobile responsiveness

2. **Data Layer** (1 hour)
   - Create questions.json with 15-20 sample data science questions
   - Implement fetch logic to load questions

3. **Firebase Integration** (2-3 hours)
   - Initialize Firebase connection
   - Set up database structure
   - Implement game code generation
   - Create Firebase database references

4. **Host Functionality** (3-4 hours)
   - Game creation and code generation
   - URL sharing with game code
   - Real-time player list
   - Start game trigger
   - Next question controls
   - Timer management

5. **Player Functionality** (2-3 hours)
   - URL parameter detection
   - Join game with name validation
   - Real-time game state listeners
   - Answer submission
   - Synchronized timer display

6. **Game Loop & Synchronization** (4-5 hours)
   - Question display logic
   - Timer synchronization across devices
   - Answer collection and tracking
   - Auto-advance logic (all answered OR time expires)
   - State transitions (playing → showing-scores → playing)

7. **Scoring System** (2-3 hours)
   - Answer validation logic
   - Score calculation (+10/0)
   - Real-time score updates in Firebase
   - Score display screen implementation
   - Leaderboard sorting

8. **End Game & Results** (2 hours)
   - Final scoreboard
   - Top 3 highlighting
   - Results display for 16-50 players
   - New game functionality

9. **Error Handling & Edge Cases** (3-4 hours)
   - Disconnection handling
   - Invalid game codes
   - Duplicate names
   - Firebase connection failures
   - Host disconnection scenarios
   - Late join prevention

10. **Testing & Polish** (3-4 hours)
    - Test with multiple devices (2-5, then 10-20 simulated)
    - Mobile responsiveness testing
    - Timer synchronization accuracy
    - Network latency handling
    - Transitions and animations
    - Accessibility improvements

**Estimated Total: 24-32 hours**

---

## Success Criteria

### Functional Requirements
- [ ] Single HTML file with embedded CSS/JavaScript
- [ ] Firebase Realtime Database integration (CDN-based, no local dependencies)
- [ ] Loads questions from separate questions.json file
- [ ] Supports 16-50 simultaneous players on separate devices
- [ ] Host can create game and generate shareable URL
- [ ] Players can join via URL with game code parameter
- [ ] 30-second timer per question, synchronized across all devices
- [ ] Host controls game flow (start, next question, end)
- [ ] All players see same question simultaneously
- [ ] Real-time answer tracking (host sees who answered)
- [ ] Scores calculated accurately (+10 correct, 0 incorrect/no answer)
- [ ] Scores displayed after each question with leaderboard
- [ ] Final scoreboard shows all players ranked by score
- [ ] Disconnected players marked and game continues
- [ ] Auto-advance when all players answer OR timer expires

### Technical Requirements
- [ ] Works on GitHub Pages static hosting
- [ ] Mobile responsive (≤640px breakpoint)
- [ ] Firebase connection within 2 seconds
- [ ] Timer sync accuracy within 1 second across devices
- [ ] Handles 50 concurrent player connections per game
- [ ] Free tier supports 2 concurrent 50-player games (100 total connections)
- [ ] No page refreshes during game (all updates via Firebase)
- [ ] Graceful error messages for connection issues
- [ ] Warning displayed if connection limit approaching

### Design Requirements
- [ ] Follows Roberto Reif style guide
- [ ] Clean, minimal aesthetic
- [ ] Color palette: white background, dark gray text, light gray borders
- [ ] System font stack for typography
- [ ] Smooth transitions between screens (0.3s ease)
- [ ] Touch-friendly buttons (44px minimum)
- [ ] Clear visual hierarchy
- [ ] Accessible (ARIA labels, keyboard navigation, color contrast)

### User Experience
- [ ] Clear instructions on host screen ("Share this URL with players")
- [ ] Real-time feedback (player joined, answer submitted, etc.)
- [ ] Waiting states clearly communicated
- [ ] Leaderboard updates smoothly
- [ ] Top 3 players visually distinguished
- [ ] No confusing states or dead ends
- [ ] Copy URL button works reliably
