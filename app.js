// Firebase Configuration (User needs to replace with their own)
const firebaseConfig = {
    apiKey: "AIzaSyA4847S6PuTcskb6du7Y0dCt7uh05zqmU0",
    authDomain: "data-science-quiz-77978.firebaseapp.com",
    databaseURL: "https://data-science-quiz-77978-default-rtdb.firebaseio.com",
    projectId: "data-science-quiz-77978",
    storageBucket: "data-science-quiz-77978.firebasestorage.app",
    messagingSenderId: "392795527631",
    appId: "1:392795527631:web:a96de2281136ccf8b01aba"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global variables
let gameCode = null;
let playerId = null;
let playerName = null;
let isHost = false;
let questions = [];
let currentQuestionIndex = 0;
let serverTimeOffset = 0;
let playerAnswer = null;
let isAdvancing = false;
let selectedQuizFile = 'questions-foundations.json';
let timerDuration = 30; // Default 30 seconds
let currentTimerStart = null; // Track current timer to prevent duplicates
let activeTimerInterval = null; // Track single active timer interval

// Track active listeners for cleanup
const activeListeners = {
    serverTimeOffset: null,
    connectionStatus: null,
    playersInLobby: null,
    playersJoining: null,
    gameStatus: null,
    gameStatusLobby: null,
    disconnectHandler: null,
    currentQuestion: null,
    timerStartedAt: null,
    gameStatusPlaying: null,
    answersMonitor: null
};

// Calculate server time offset
activeListeners.serverTimeOffset = database.ref('.info/serverTimeOffset');
activeListeners.serverTimeOffset.on('value', (snap) => {
    serverTimeOffset = snap.val() || 0;
});

// Monitor connection status
const connectedRef = database.ref('.info/connected');
activeListeners.connectionStatus = connectedRef;
connectedRef.on('value', (snap) => {
    const offlineDisplay = document.getElementById('offlineDisplay');
    if (snap.val() === true) {
        offlineDisplay.classList.add('hidden');
    } else {
        offlineDisplay.classList.remove('hidden');
    }
});

// Cleanup function to remove all active listeners
function cleanupListeners() {
    Object.keys(activeListeners).forEach(key => {
        if (activeListeners[key]) {
            activeListeners[key].off();
            activeListeners[key] = null;
        }
    });
}

// Load questions from JSON
async function loadQuestions(filename = 'questions.json') {
    try {
        const response = await fetch(`./${filename}`);
        if (!response.ok) throw new Error('Failed to load questions');
        const data = await response.json();
        questions = data.questions;
        return true;
    } catch (error) {
        showError(`Could not load quiz questions from ${filename}. Please refresh the page.`);
        return false;
    }
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Utility functions
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function showError(message) {
    const errorDisplay = document.getElementById('errorDisplay');
    errorDisplay.textContent = message;
    errorDisplay.classList.remove('hidden');
    setTimeout(() => {
        errorDisplay.classList.add('hidden');
    }, 5000);
}

// Sanitize HTML to prevent XSS attacks
function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Input validation functions
const Validators = {
    playerName: (name) => {
        if (!name || !name.trim()) {
            return { valid: false, error: 'Please enter your name' };
        }
        if (name.length > 30) {
            return { valid: false, error: 'Name must be 30 characters or less' };
        }
        // Check for HTML tags
        if (name !== name.replace(/<[^>]*>/g, '')) {
            return { valid: false, error: 'Name cannot contain HTML tags' };
        }
        return { valid: true, value: name.trim() };
    },

    timerDuration: (duration) => {
        const num = parseInt(duration);
        if (isNaN(num)) {
            return { valid: false, error: 'Timer duration must be a number' };
        }
        if (num < 3 || num > 300) {
            return { valid: false, error: 'Timer duration must be between 3 and 300 seconds' };
        }
        return { valid: true, value: num };
    },

    gameCode: (code) => {
        if (!code || typeof code !== 'string') {
            return { valid: false, error: 'Invalid game code' };
        }
        const upperCode = code.toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
            return { valid: false, error: 'Game code must be 6 alphanumeric characters' };
        }
        return { valid: true, value: upperCode };
    },

    answerIndex: (index) => {
        if (!Number.isInteger(index)) {
            return { valid: false, error: 'Answer must be a number' };
        }
        if (index < 0 || index > 3) {
            return { valid: false, error: 'Answer must be between 0 and 3' };
        }
        return { valid: true, value: index };
    }
};

// Event Listeners for Role Selection
document.getElementById('createGameBtn').addEventListener('click', async () => {
    // Get selected quiz
    selectedQuizFile = document.getElementById('quizSelector').value;

    // Get and validate timer duration
    const timerInput = document.getElementById('timerDurationInput').value;
    const timerValidation = Validators.timerDuration(timerInput);
    if (!timerValidation.valid) {
        showError(timerValidation.error);
        return;
    }
    timerDuration = timerValidation.value;

    const loaded = await loadQuestions(selectedQuizFile);
    if (!loaded) return;

    isHost = true;
    gameCode = generateGameCode();

    createGame();
});

// Function to handle joining a game (called when URL has game code)
function initiateJoinGame(code) {
    gameCode = code.toUpperCase();
    showScreen('playerJoinScreen');
    document.getElementById('joinStatus').innerHTML =
        `<div class="status-message info">Joining game: ${gameCode}</div>`;
}

// === HOST FUNCTIONALITY ===

async function createGame() {
    try {
        // Check if game code already exists
        const gameSnapshot = await database.ref(`games/${gameCode}`).once('value');
        if (gameSnapshot.exists()) {
            // Generate new code if collision
            gameCode = generateGameCode();
            return createGame();
        }

        // Create game in Firebase
        await database.ref(`games/${gameCode}`).set({
            hostId: playerId,
            status: 'waiting',
            currentQuestion: 0,
            timerStartedAt: null,
            quizFile: selectedQuizFile,
            timerDuration: timerDuration,
            metadata: {
                totalQuestions: questions.length,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }
        });

        // Add host as first player
        playerName = 'Host';
        await database.ref(`games/${gameCode}/players/${playerId}`).set({
            name: playerName,
            score: 0,
            connected: true
        });

        // Set up disconnect handler
        setupDisconnectHandler();

        // Display game code and URL
        document.getElementById('gameCodeDisplay').textContent = gameCode;
        const shareUrl = `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
        document.getElementById('shareUrlDisplay').textContent = shareUrl;

        showScreen('hostCreateScreen');

        // Listen for players joining
        listenForPlayers();

    } catch (error) {
        showError('Failed to create game. Please try again.');
    }
}

function listenForPlayers() {
    // Clean up old listener if exists
    if (activeListeners.playersInLobby) {
        activeListeners.playersInLobby.off();
    }

    const playersRef = database.ref(`games/${gameCode}/players`);
    activeListeners.playersInLobby = playersRef;

    playersRef.on('value', (snapshot) => {
        const players = snapshot.val() || {};
        const playerCount = Object.keys(players).length;

        document.getElementById('playerCountDisplay').textContent = playerCount;

        // Update player list
        const listEl = document.getElementById('hostPlayerList');
        listEl.innerHTML = '';

        Object.entries(players).forEach(([id, player]) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            if (!player.connected) li.classList.add('disconnected');
            li.innerHTML = `
                <span class="player-name">${sanitizeHTML(player.name)}</span>
                <span class="player-score">${player.connected ? 'Ready' : 'Disconnected'}</span>
            `;
            listEl.appendChild(li);
        });

        // Enable start button if at least 1 player
        document.getElementById('startGameBtn').disabled = playerCount < 1;
    });
}

// === PLAYER FUNCTIONALITY ===

async function joinGame() {
    const nameInput = document.getElementById('playerNameInput').value;

    // Validate player name
    const nameValidation = Validators.playerName(nameInput);
    if (!nameValidation.valid) {
        showError(nameValidation.error);
        return;
    }
    const name = nameValidation.value;

    try {
        // Check if game exists
        const gameSnapshot = await database.ref(`games/${gameCode}`).once('value');
        if (!gameSnapshot.exists()) {
            showError('Game not found. Please check the game code.');
            return;
        }

        const gameData = gameSnapshot.val();

        // Check if game already started
        if (gameData.status !== 'waiting') {
            showError('This game has already started. You cannot join.');
            return;
        }

        // Load the quiz file used by this game
        selectedQuizFile = gameData.quizFile || 'questions.json';
        const loaded = await loadQuestions(selectedQuizFile);
        if (!loaded) return;

        // Get timer duration from game settings
        timerDuration = gameData.timerDuration || 30;

        // Player ID already set from authentication
        playerName = name;

        // Check for duplicate names and modify if needed
        const players = gameData.players || {};
        let finalName = name;
        let counter = 2;
        while (Object.values(players).some(p => p.name === finalName)) {
            finalName = `${name} ${counter}`;
            counter++;
        }
        playerName = finalName;

        // Add player to game
        await database.ref(`games/${gameCode}/players/${playerId}`).set({
            name: playerName,
            score: 0,
            connected: true
        });

        // Set up disconnect handler
        setupDisconnectHandler();

        // Show waiting area
        document.getElementById('waitingArea').classList.remove('hidden');
        document.getElementById('submitJoinBtn').disabled = true;

        // Listen for other players and game start
        listenForLobbyUpdates();
        listenForGameStart();

    } catch (error) {
        showError('Failed to join game. Please try again.');
    }
}

function listenForLobbyUpdates() {
    // Clean up old listener if exists
    if (activeListeners.playersJoining) {
        activeListeners.playersJoining.off();
    }

    const playersRef = database.ref(`games/${gameCode}/players`);
    activeListeners.playersJoining = playersRef;

    playersRef.on('value', (snapshot) => {
        const players = snapshot.val() || {};
        const listEl = document.getElementById('playerLobbyList');
        listEl.innerHTML = '';

        Object.entries(players).forEach(([id, player]) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            li.textContent = player.name;
            listEl.appendChild(li);
        });
    });
}

function listenForGameStart() {
    // Clean up old listener if exists
    if (activeListeners.gameStatusLobby) {
        activeListeners.gameStatusLobby.off();
    }

    const statusRef = database.ref(`games/${gameCode}/status`);
    activeListeners.gameStatusLobby = statusRef;

    statusRef.on('value', (snapshot) => {
        const status = snapshot.val();
        if (status === 'playing') {
            startGameplay();
        }
    });
}

// === DISCONNECT HANDLING ===

function setupDisconnectHandler() {
    const playerRef = database.ref(`games/${gameCode}/players/${playerId}`);

    // Clean up old listener if exists
    if (activeListeners.disconnectHandler) {
        activeListeners.disconnectHandler.off();
    }

    activeListeners.disconnectHandler = connectedRef;

    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            playerRef.child('connected').set(true);
            playerRef.child('connected').onDisconnect().set(false);
            playerRef.child('lastSeen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        }
    });
}

// === GAME LOOP ===

async function startGameplay() {
    const loaded = questions.length > 0 || await loadQuestions(selectedQuizFile);
    if (!loaded) return;

    showScreen('gameScreen');

    // Show/hide host controls
    if (isHost) {
        document.getElementById('hostControls').classList.remove('hidden');
    }

    // Listen to game state
    listenToGameState();
}

function listenToGameState() {
    const gameRef = database.ref(`games/${gameCode}`);

    // Clean up old listeners if they exist
    if (activeListeners.currentQuestion) {
        activeListeners.currentQuestion.off();
    }
    if (activeListeners.timerStartedAt) {
        activeListeners.timerStartedAt.off();
    }
    if (activeListeners.gameStatusPlaying) {
        activeListeners.gameStatusPlaying.off();
    }

    // Listen to current question
    const currentQuestionRef = gameRef.child('currentQuestion');
    activeListeners.currentQuestion = currentQuestionRef;
    currentQuestionRef.on('value', (snapshot) => {
        const newQuestionIndex = snapshot.val() || 0;
        currentQuestionIndex = newQuestionIndex;
        displayQuestion();
    });

    // Listen to timer
    const timerRef = gameRef.child('timerStartedAt');
    activeListeners.timerStartedAt = timerRef;
    timerRef.on('value', (snapshot) => {
        const timerStart = snapshot.val();

        // Only start timer if it's a new timestamp (prevents duplicate timers)
        if (timerStart && timerStart !== currentTimerStart) {
            currentTimerStart = timerStart;
            startTimer(timerStart);
        }
    });

    // Listen to status changes
    const statusRef = gameRef.child('status');
    activeListeners.gameStatusPlaying = statusRef;
    statusRef.on('value', (snapshot) => {
        const status = snapshot.val();

        if (status === 'showing-scores') {
            showScoreScreen();
        } else if (status === 'ended') {
            showFinalResults();
        } else if (status === 'playing') {
            showScreen('gameScreen');
            // Show host controls if host
            if (isHost) {
                document.getElementById('hostControls').classList.remove('hidden');
            }
        }
    });

    // Host: Monitor answer count
    if (isHost) {
        monitorAnswers();
    }
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        return;
    }

    const question = questions[currentQuestionIndex];

    // Update UI
    document.getElementById('questionCounter').textContent =
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('questionText').textContent = question.question;

    // Update answer buttons
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach((btn, index) => {
        btn.textContent = question.options[index];
        btn.disabled = false;
        btn.classList.remove('selected', 'correct', 'incorrect');
        btn.onclick = () => submitAnswer(index);
    });

    // Reset answer status
    playerAnswer = null;
    document.getElementById('answerStatus').classList.add('hidden');
    document.getElementById('nextQuestionBtn').classList.add('hidden');
}

function startTimer(timerStartedAt) {
    // CRITICAL: Clear any existing timer first
    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
    }

    const timerDisplay = document.getElementById('timerDisplay');
    let hasExpired = false; // Prevent multiple expirations

    const updateTimer = () => {
        const estimatedServerTime = Date.now() + serverTimeOffset;
        const elapsedMs = estimatedServerTime - timerStartedAt;
        const remainingTime = Math.max(0, timerDuration - elapsedMs / 1000);

        const seconds = Math.ceil(remainingTime);
        timerDisplay.textContent = seconds;

        // Warning color when < 10 seconds
        if (seconds <= 10) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }

        // Disable answers when time expires
        if (remainingTime <= 0 && !hasExpired) {
            hasExpired = true;
            disableAnswerButtons();

            // Clear this timer
            if (activeTimerInterval) {
                clearInterval(activeTimerInterval);
                activeTimerInterval = null;
            }

            // Host: Auto-advance after 1 second (to show correct/incorrect feedback)
            if (isHost && !isAdvancing) {
                setTimeout(() => advanceToNextQuestion(), 1000);
            }
        }
    };

    // Update immediately and every second
    updateTimer();
    activeTimerInterval = setInterval(updateTimer, 1000);
}

function disableAnswerButtons() {
    const answerButtons = document.querySelectorAll('.answer-btn');
    const correctAnswer = questions[currentQuestionIndex].correct;

    answerButtons.forEach((btn, index) => {
        btn.disabled = true;

        // Show correct answer
        if (index === correctAnswer) {
            btn.classList.add('correct');
        }

        // Show player's wrong answer if they selected one
        if (playerAnswer !== null && index === playerAnswer && playerAnswer !== correctAnswer) {
            btn.classList.add('incorrect');
        }
    });

    // Update status message
    const statusEl = document.getElementById('answerStatus');
    if (playerAnswer === null) {
        statusEl.className = 'status-message warning';
        statusEl.textContent = 'Time\'s up! You didn\'t select an answer.';
    } else if (playerAnswer === correctAnswer) {
        statusEl.className = 'status-message success';
        statusEl.textContent = '✓ Correct! Well done!';
    } else {
        statusEl.className = 'status-message error';
        statusEl.textContent = '✗ Incorrect. The correct answer is highlighted in green.';
    }
    statusEl.classList.remove('hidden');
}

// === ANSWER SUBMISSION ===

async function submitAnswer(answerIndex) {
    // Validate answer index
    const answerValidation = Validators.answerIndex(answerIndex);
    if (!answerValidation.valid) {
        showError(answerValidation.error);
        return;
    }

    playerAnswer = answerValidation.value;

    // Update button styling - remove old selection, add new
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach((btn, index) => {
        btn.classList.remove('selected');
        if (index === answerIndex) {
            btn.classList.add('selected');
        }
    });

    // Submit to Firebase (will overwrite previous answer if changed)
    try {
        await database.ref(`games/${gameCode}/answers/${currentQuestionIndex}/${playerId}`).set({
            answer: answerIndex,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Show message that answer can be changed
        const statusEl = document.getElementById('answerStatus');
        statusEl.className = 'status-message info';
        statusEl.textContent = 'Answer selected! You can change your answer until time runs out.';
        statusEl.classList.remove('hidden');

    } catch (error) {
        showError('Failed to submit answer. Please try again.');
    }
}

// === HOST CONTROLS ===

function monitorAnswers() {
    // Clean up old listener if exists
    if (activeListeners.answersMonitor) {
        activeListeners.answersMonitor.off();
    }

    const answersRef = database.ref(`games/${gameCode}/answers/${currentQuestionIndex}`);
    activeListeners.answersMonitor = answersRef;

    answersRef.on('value', (snapshot) => {
        const answers = snapshot.val() || {};
        const answerCount = Object.keys(answers).length;

        // Get total connected players
        database.ref(`games/${gameCode}/players`).once('value', (playersSnap) => {
            const players = playersSnap.val() || {};
            const connectedPlayers = Object.values(players).filter(p => p.connected).length;

            document.getElementById('answeredCount').textContent = answerCount;
            document.getElementById('totalPlayers').textContent = connectedPlayers;

            // No auto-advance - wait for timer to expire so players can change answers
        });
    });
}

function advanceToNextQuestion() {
    if (isAdvancing) return;
    isAdvancing = true;

    const questionRef = database.ref(`games/${gameCode}/currentQuestion`);

    questionRef.transaction((current) => {
        if (current === null) return 0;
        return current + 1;
    }, async (error, committed, snapshot) => {
        if (error) {
            isAdvancing = false;
            return;
        }

        if (committed) {
            const newQuestion = snapshot.val();
            const justCompletedQuestion = newQuestion - 1;

            // Calculate scores for the question that was just completed
            await calculateScores(justCompletedQuestion);

            // Check if game ended
            if (newQuestion >= questions.length) {
                await database.ref(`games/${gameCode}/status`).set('ended');
            } else {
                // Show scores
                await database.ref(`games/${gameCode}/status`).set('showing-scores');
            }
        }

        setTimeout(() => { isAdvancing = false; }, 1000);
    });
}

async function calculateScores(questionIndex) {
    try {
        const answersSnap = await database.ref(`games/${gameCode}/answers/${questionIndex}`).once('value');
        const answers = answersSnap.val() || {};
        const correctAnswer = questions[questionIndex].correct;

        const playersSnap = await database.ref(`games/${gameCode}/players`).once('value');
        const players = playersSnap.val() || {};

        // Update scores
        const updates = {};
        Object.entries(players).forEach(([id, player]) => {
            const playerAnswerData = answers[id];
            let newScore = player.score || 0;

            if (playerAnswerData && playerAnswerData.answer === correctAnswer) {
                newScore += 10;
            }

            updates[`games/${gameCode}/players/${id}/score`] = newScore;
        });

        await database.ref().update(updates);

    } catch (error) {
        showError('Error calculating scores. Please try again.');
    }
}

// === SCORE DISPLAY ===

async function showScoreScreen() {
    showScreen('scoreScreen');

    // Clear active timer
    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
    }
    currentTimerStart = null; // Reset to allow new timer

    // Show correct answer for the PREVIOUS question (currentQuestionIndex has been incremented)
    const previousQuestionIndex = currentQuestionIndex - 1;
    const question = questions[previousQuestionIndex];

    // Check player's answer
    const answersSnap = await database.ref(`games/${gameCode}/answers/${previousQuestionIndex}`).once('value');
    const answers = answersSnap.val() || {};
    const myAnswer = answers[playerId];

    // Display the question with correct/incorrect highlighting
    document.getElementById('scoreQuestionCounter').textContent =
        `Question ${previousQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('scoreQuestionText').textContent = question.question;

    const scoreAnswerButtons = document.querySelectorAll('#scoreAnswerGrid .answer-btn');
    scoreAnswerButtons.forEach((btn, index) => {
        btn.textContent = question.options[index];
        btn.className = 'answer-btn';

        // Highlight correct answer in green
        if (index === question.correct) {
            btn.classList.add('correct');
        }

        // Highlight player's incorrect answer in red
        if (myAnswer && myAnswer.answer === index && index !== question.correct) {
            btn.classList.add('incorrect');
        }

        // Show selection for player's answer
        if (myAnswer && myAnswer.answer === index) {
            btn.classList.add('selected');
        }
    });

    // Display leaderboard
    await displayLeaderboard('currentLeaderboard');

    // Show appropriate controls
    if (isHost) {
        document.getElementById('scoreHostControls').classList.remove('hidden');
        document.getElementById('scorePlayerWaiting').classList.add('hidden');
    } else {
        document.getElementById('scoreHostControls').classList.add('hidden');
        document.getElementById('scorePlayerWaiting').classList.remove('hidden');
    }
}

async function displayLeaderboard(elementId) {
    const playersSnap = await database.ref(`games/${gameCode}/players`).once('value');
    const players = playersSnap.val() || {};

    // Sort by score
    const sortedPlayers = Object.entries(players)
        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));

    const leaderboardEl = document.getElementById(elementId);
    leaderboardEl.innerHTML = '';

    sortedPlayers.forEach(([id, player], index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-item';

        if (index === 0) div.classList.add('rank-1');
        else if (index === 1) div.classList.add('rank-2');
        else if (index === 2) div.classList.add('rank-3');

        div.innerHTML = `
            <div>
                <span class="rank-number">#${index + 1}</span>
                <span class="player-name">${sanitizeHTML(player.name)}</span>
                ${!player.connected ? ' <em>(Disconnected)</em>' : ''}
            </div>
            <span class="player-score">${player.score || 0} pts</span>
        `;

        leaderboardEl.appendChild(div);
    });
}

// === FINAL RESULTS ===

async function showFinalResults() {
    showScreen('resultsScreen');

    // Clear active timer
    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
    }
    currentTimerStart = null; // Reset timer tracking

    // Display winner
    const playersSnap = await database.ref(`games/${gameCode}/players`).once('value');
    const players = playersSnap.val() || {};
    const sortedPlayers = Object.entries(players)
        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0));

    if (sortedPlayers.length > 0) {
        const winner = sortedPlayers[0][1];
        document.getElementById('winnerAnnouncement').innerHTML =
            `<h2>🏆 Winner: ${sanitizeHTML(winner.name)}</h2><p>Score: ${winner.score || 0} points</p>`;
    }

    // Display final leaderboard
    await displayLeaderboard('finalLeaderboard');

    // Show appropriate controls
    if (isHost) {
        document.getElementById('resultsHostControls').classList.remove('hidden');
        document.getElementById('resultsPlayerView').classList.add('hidden');
    } else {
        document.getElementById('resultsHostControls').classList.add('hidden');
        document.getElementById('resultsPlayerView').classList.remove('hidden');
    }
}

// === EVENT LISTENERS ===

document.getElementById('startGameBtn').addEventListener('click', async () => {
    currentTimerStart = null; // Reset before starting timer
    await database.ref(`games/${gameCode}/status`).set('playing');
    await database.ref(`games/${gameCode}/timerStartedAt`).set(firebase.database.ServerValue.TIMESTAMP);
    startGameplay();
});

document.getElementById('submitJoinBtn').addEventListener('click', joinGame);

document.getElementById('continueBtn').addEventListener('click', async () => {
    currentTimerStart = null; // Reset before starting new timer
    await database.ref(`games/${gameCode}/status`).set('playing');
    await database.ref(`games/${gameCode}/timerStartedAt`).set(firebase.database.ServerValue.TIMESTAMP);
});

document.getElementById('newGameBtn').addEventListener('click', () => {
    // Clean up all listeners before navigating away
    cleanupListeners();
    window.location.href = window.location.pathname;
});

document.getElementById('copyUrlBtn').addEventListener('click', () => {
    const url = document.getElementById('shareUrlDisplay').textContent;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copyUrlBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        showError('Failed to copy URL. Please copy manually.');
    });
});

document.getElementById('cancelHostBtn').addEventListener('click', () => {
    // Clean up all listeners before navigating away
    cleanupListeners();
    window.location.href = window.location.pathname;
});

document.getElementById('cancelJoinBtn').addEventListener('click', () => {
    // Clean up all listeners before navigating away
    cleanupListeners();
    window.location.href = window.location.pathname;
});

// Initialize app with authentication
(async function init() {
    try {
        // Sign in anonymously to get auth.uid
        const userCredential = await auth.signInAnonymously();
        playerId = userCredential.user.uid;

        // Enable the Create Game button now that we're authenticated
        document.getElementById('createGameBtn').disabled = false;

        // Check URL for game code
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('game');

        if (codeFromUrl) {
            initiateJoinGame(codeFromUrl);
        }
    } catch (error) {
        showError('Failed to initialize app. Please refresh the page.');
    }
})();
