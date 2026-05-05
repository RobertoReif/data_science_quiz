# Security Setup Instructions

## Firebase Security Rules Deployment

The `database.rules.json` file contains critical security rules that protect your quiz game from unauthorized access and data manipulation.

### How to Deploy Security Rules

#### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `data-science-quiz-77978`
3. Navigate to **Realtime Database** → **Rules**
4. Copy the contents of `database.rules.json`
5. Paste into the rules editor
6. Click **"Publish"**

#### Method 2: Firebase CLI

1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init database
   ```
   - Select your project
   - Choose `database.rules.json` as your rules file

4. Deploy the rules:
   ```bash
   firebase deploy --only database
   ```

### What These Rules Protect Against

1. **Unauthorized Game Creation**: Only authenticated users can create games
2. **Host-Only Operations**: Only the game host can:
   - Start the game
   - Advance questions
   - Set timer
   - Change game status
   - Update player scores

3. **Answer Manipulation**: Players can only submit their own answers (0-3 range validated)
4. **Name Validation**: Player names must be 1-30 characters
5. **Score Protection**: Only host can modify scores (prevents cheating)
6. **Timer Validation**: Timer duration must be between 3-300 seconds
7. **Data Type Validation**: All fields are validated for correct data types

### Firebase Authentication Required

These security rules require Firebase Anonymous Authentication to work. The app has been updated to:
- Automatically sign in users anonymously when they load the page
- Use `auth.uid` instead of random player IDs
- Verify user identity in all database operations

### Testing Security Rules

After deploying, test that:
1. ✅ You can create a game
2. ✅ Players can join games
3. ✅ Players can submit answers (0-3)
4. ✅ Players can change their answers
5. ✅ Only host can start/advance game
6. ❌ Players cannot modify other players' scores
7. ❌ Players cannot advance questions
8. ❌ Invalid answer values (e.g., 5) are rejected

### Important Notes

- **Authentication is now mandatory** - The app uses Firebase Anonymous Auth
- **Existing games will be incompatible** - Old games without proper hostId may not work
- **Clear your database** if upgrading from the old version without auth
- **GitHub Pages must use HTTPS** - Firebase requires secure connections

### Troubleshooting

**Error: "Permission denied"**
- Ensure you've deployed the rules to Firebase Console
- Check that Anonymous Authentication is enabled in Firebase Console
- Verify the user is signed in (check browser console for auth.uid)

**Error: "PERMISSION_DENIED: Permission denied"**
- Rules are too restrictive or not yet deployed
- Check Firebase Console → Realtime Database → Rules tab
- Verify rules match `database.rules.json`

**Players can't submit answers**
- Check that answer values are 0, 1, 2, or 3 (not strings)
- Verify playerId matches auth.uid
- Ensure game exists in database

### Security Best Practices

1. ✅ Never commit Firebase API keys to public repos (already exposed in client code is OK - rules protect data)
2. ✅ Always validate user input client-side AND server-side (via rules)
3. ✅ Use transactions for critical operations (score updates, question advancement)
4. ✅ Sanitize all user-generated content (player names) to prevent XSS
5. ✅ Monitor Firebase usage to detect abuse
6. ✅ Set up Firebase usage alerts to prevent unexpected costs

### Next Steps

After deploying security rules:
1. Enable Anonymous Authentication in Firebase Console
2. Test all game flows (host and player)
3. Monitor Firebase logs for errors
4. Consider upgrading to Email/Google auth for registered users (optional)
