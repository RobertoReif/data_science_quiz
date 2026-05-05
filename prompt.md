Create an index.html file for a data science multiple-choice quiz game with the following specifications:

**Core Functionality:**
- Display one question at a time with four answer choices
- 30-second timer per question (visual countdown)
- Support multiple players (players enter names at start)
- Track individual scores throughout the game
- Display final scoreboard ranking all players after all questions

**Game Flow:**
1. Start screen: Players enter their names
2. For each question:
   - Display question and 4 options
   - Show 30-second countdown timer
   - Allow one answer submission per player
   - Auto-advance when all players answer OR timer expires
   - After each question, display current scores for all players before moving to next question
3. End screen: Show ranked scoreboard with all player scores

**Data Structure:**
- Questions stored in a separate JSON file with this structure:
  ```json
  {
    "questions": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correct": 0
      }
    ]
  }
  ```

**Scoring:**
- Correct answer: +10 points
- Incorrect/no answer: 0 points
- Display current scores for all players after each question is answered
- Show score update/change after each question

**Design:**
- Apply the Roberto Reif style guide (robertoreif-style-guide.md):
  - Color palette: white background (#ffffff), dark gray text (#333333)
  - Typography: System font stack, clear hierarchy
  - Minimal design with ample whitespace
  - Responsive (mobile-friendly)
  - Subtle hover effects and transitions

**Multiplayer Architecture:**
- Players join from **separate devices** simultaneously (16-50 players expected)
- Host creates game and gets shareable URL with game code (e.g., `?game=ABC123`)
- Host controls game flow (starts questions, advances to next, ends game)
- Real-time synchronization using Firebase Realtime Database
- Players who disconnect are marked as disconnected and receive 0 points for remaining questions

**Technical Requirements:**
- Single HTML file with embedded CSS and JavaScript
- Firebase Realtime Database for real-time multiplayer (free tier, CDN-based)
- Questions loaded from separate `questions.json` file
- Deployable to GitHub Pages (static hosting)
- Mobile-responsive (≤640px breakpoint)
- Works across devices (desktop, tablet, mobile)