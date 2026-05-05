# Data Science Quiz Game

A real-time multiplayer quiz game for 16-50 players, designed for data science education. Players join from separate devices and compete simultaneously.

## Features

- **Real-time Multiplayer**: 16-50 players on separate devices
- **Host-Controlled**: Host manages game flow and question advancement
- **30-Second Timer**: Synchronized across all devices using Firebase server timestamps
- **Live Leaderboard**: See rankings after each question
- **Mobile-Responsive**: Works on desktop, tablet, and mobile devices
- **Minimal Design**: Clean interface following professional design principles

## Prerequisites

- A Google/Firebase account (free)
- GitHub account (for deployment)
- Web browser with JavaScript enabled

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `data-science-quiz` (or your choice)
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2: Enable Realtime Database

1. In Firebase Console, go to **Build → Realtime Database**
2. Click **"Create Database"**
3. Select database location (choose closest to your users):
   - United States: `us-central1`
   - Europe: `europe-west1`
   - Asia: `asia-southeast1`
4. Start in **"test mode"** (we'll update security rules later)
5. Click **"Enable"**

### Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** → **Project settings**
2. Scroll to **"Your apps"** section
3. Click the **Web icon** (`</>`)
4. Register app name: `Quiz Game`
5. **Do NOT** enable Firebase Hosting
6. Copy the `firebaseConfig` object

### Step 4: Add Firebase Config to Your Code

1. Open `index.html` in a text editor
2. Find lines 505-513 (the firebaseConfig section)
3. Replace the placeholder values with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // Replace with your actual apiKey
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

4. Save the file

### Step 5: Set Up Security Rules

1. Go to Firebase Console → **Realtime Database** → **Rules** tab
2. Replace the rules with the following:

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

3. Click **"Publish"**

### Step 6: Test Locally

1. You need a local web server to test (browsers block file:// for security)
2. Using Python:
   ```bash
   cd /path/to/your/project
   python3 -m http.server 8000
   ```
3. Open browser to `http://localhost:8000`
4. Click **"Create Game"**
5. Copy the game URL
6. Open in another browser tab/window (or different browser)
7. Paste the URL to join as a player

### Step 7: Deploy to GitHub Pages

1. Create a new GitHub repository:
   - Go to https://github.com/new
   - Name: `data-science-quiz` (or your choice)
   - Set to **Public**
   - Do NOT initialize with README
   - Click **"Create repository"**

2. Push your code:
   ```bash
   cd /path/to/your/project
   git init
   git add index.html questions.json README.md
   git commit -m "Initial commit: Data Science Quiz Game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/data-science-quiz.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to repository **Settings** → **Pages**
   - Under **Source**: Select **main** branch, **/ (root)** folder
   - Click **"Save"**
   - Wait 1-2 minutes

4. Your game will be live at:
   `https://YOUR_USERNAME.github.io/data-science-quiz/`

## How to Use

### As Host:

1. Open the game URL
2. Click **"Create Game"**
3. Share the generated URL with players (or show QR code)
4. Wait for players to join (you'll see them in the list)
5. Click **"Start Game"** when ready
6. Monitor player progress during each question
7. Click **"Continue to Next Question"** after scores are shown
8. View final results at the end

### As Player:

1. Click the URL shared by the host
2. Enter your name
3. Click **"Join Game"**
4. Wait for host to start
5. Answer questions within 30 seconds
6. View your score after each question
7. See final ranking at the end

## Firebase Free Tier Limits

The free tier (Spark Plan) supports:
- **100 simultaneous connections**
- With 50 players per game: **Max 2 concurrent games**
- With 30 players per game: **Max 3 concurrent games**
- With 16 players per game: **Max 6 concurrent games**

For more concurrent games, upgrade to **Blaze Plan (Pay-as-you-go)**.

## Customization

### Adding More Questions

Edit `questions.json` and add questions in this format:

```json
{
  "question": "Your question here?",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct": 0
}
```

The `correct` field is the index (0-3) of the correct answer.

### Changing Timer Duration

In `index.html`, find line ~705:
```javascript
const remainingTime = Math.max(0, 30 - elapsedMs / 1000);
```

Change `30` to your desired seconds (e.g., `60` for 1 minute).

### Changing Scoring

In `index.html`, find line ~854:
```javascript
newScore += 10;
```

Change `10` to your desired points per correct answer.

## Troubleshooting

### "Failed to create game"
- Check that Firebase config is correct in `index.html`
- Verify Realtime Database is enabled in Firebase Console
- Check browser console for errors

### "Game not found"
- Ensure game code in URL is correct
- Check that host hasn't closed their browser
- Verify Firebase security rules are published

### Timer not synchronized
- Check that all devices have network connection
- Firebase uses server timestamps, so slight differences (<1 second) are normal

### Firebase connection failed
- Ensure you're using HTTPS (GitHub Pages auto-enables this)
- Check Firebase project has correct billing status
- Verify security rules allow reads/writes

### Players can't join after game starts
- This is intentional to prevent cheating
- Host must create a new game for late joiners

## Technical Details

- **Frontend**: Single HTML file with embedded CSS/JavaScript
- **Backend**: Firebase Realtime Database (WebSockets)
- **Hosting**: GitHub Pages (static hosting)
- **Timer Sync**: Firebase server timestamps (accuracy ~100-500ms)
- **Security**: Firebase security rules (no authentication required)
- **Mobile**: Responsive design with ≤640px breakpoint

## License

This project is provided as-is for educational purposes.

## Credits

- Design based on Roberto Reif style guide
- Firebase by Google
- Deployed on GitHub Pages

---

**Questions or Issues?**
Check the [Firebase documentation](https://firebase.google.com/docs/database) or open an issue on GitHub.
