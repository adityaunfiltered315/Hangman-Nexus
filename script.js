/* =========================================================
   HANGMAN NEXUS 2026
   Advanced Game Engine
========================================================= */

"use strict";


/* =========================================================
   DOM
========================================================= */

const $ = (selector) => document.querySelector(selector);

const wordDisplay = $("#wordDisplay");
const keyboard = $("#keyboard");

const hintText = $("#hintText");
const hintBtn = $("#hintBtn");

const scoreValue = $("#scoreValue");
const streakValue = $("#streakValue");
const roundValue = $("#roundValue");

const timerValue = $("#timerValue");
const timerProgress = $("#timerProgress");

const incorrectText = $("#incorrectText");

const livesContainer = $("#livesContainer");
const dangerBars = document.querySelectorAll(".danger-bars i");

const comboValue = $("#comboValue");
const wordLength = $("#wordLength");

const categoryName = $("#categoryName");
const difficultyBadge = $("#difficultyBadge");

const newGameBtn = $("#newGameBtn");
const nextBtn = $("#nextBtn");

const revealBtn = $("#revealBtn");
const lifeBtn = $("#lifeBtn");
const doubleBtn = $("#doubleBtn");

const revealCount = $("#revealCount");
const lifeCount = $("#lifeCount");
const doubleCount = $("#doubleCount");

const themeBtn = $("#themeBtn");
const soundBtn = $("#soundBtn");
const pauseBtn = $("#pauseBtn");

const resultModal = $("#resultModal");
const resultIcon = $("#resultIcon");
const resultLabel = $("#resultLabel");
const resultTitle = $("#resultTitle");
const resultMessage = $("#resultMessage");
const resultWord = $("#resultWord");

const resultScore = $("#resultScore");
const resultXP = $("#resultXP");
const resultStreak = $("#resultStreak");

const modalPlayBtn = $("#modalPlayBtn");
const closeModal = $("#closeModal");

const pauseModal = $("#pauseModal");
const resumeBtn = $("#resumeBtn");

const toast = $("#toast");
const toastIcon = $("#toastIcon");
const toastTitle = $("#toastTitle");
const toastMessage = $("#toastMessage");

const confetti = $("#confetti");

const categorySelect = $("#categorySelect");
const dailyBtn = $("#dailyBtn");

const xpBar = $("#xpBar");
const levelValue = $("#levelValue");
const xpValue = $("#xpValue");

const gamesValue = $("#gamesValue");
const winsValue = $("#winsValue");
const bestStreakValue = $("#bestStreakValue");
const winRateValue = $("#winRateValue");

const achievementTitle = $("#achievementTitle");
const achievementBar = $("#achievementBar");

const tipText = $("#tipText");

const gamePanel = document.querySelector(".game-panel");


/* =========================================================
   GAME CONFIG
========================================================= */

const CONFIG = {

    easy: {
        lives: 6,
        time: 75,
        multiplier: 1,
        xp: 20
    },

    medium: {
        lives: 6,
        time: 60,
        multiplier: 1.5,
        xp: 35
    },

    hard: {
        lives: 6,
        time: 45,
        multiplier: 2,
        xp: 55
    },

    nightmare: {
        lives: 6,
        time: 30,
        multiplier: 3,
        xp: 90
    }

};


/* =========================================================
   STATE
========================================================= */

let currentWord = "";
let currentHint = "";
let currentCategory = "";

let difficulty = "easy";

let correctLetters = new Set();
let guessedLetters = new Set();

let wrongGuesses = 0;
let maxLives = 6;

let score = 0;
let streak = 0;
let round = 1;

let timer = 75;
let maxTime = 75;
let timerInterval = null;

let isGameOver = false;
let isPaused = false;
let isDailyChallenge = false;

let doubleXPActive = false;

let powerups = {
    reveal: 2,
    life: 1,
    double: 1
};


/* =========================================================
   PLAYER DATA
========================================================= */

const defaultPlayer = {

    score: 0,
    xp: 0,

    games: 0,
    wins: 0,

    streak: 0,
    bestStreak: 0,

    level: 1,

    theme: "dark",
    sound: true,

    powerups: {
        reveal: 2,
        life: 1,
        double: 1
    },

    dailyCompleted: false,

    lastDailyDate: ""

};


let player = loadPlayer();


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadPlayer() {

    try {

        const saved = localStorage.getItem("hangmanNexusPlayer");

        if (!saved) {
            return structuredClone(defaultPlayer);
        }

        const parsed = JSON.parse(saved);

        return {
            ...defaultPlayer,
            ...parsed,
            powerups: {
                ...defaultPlayer.powerups,
                ...(parsed.powerups || {})
            }
        };

    } catch (error) {

        console.warn("Could not load player data.");

        return structuredClone(defaultPlayer);

    }

}


function savePlayer() {

    localStorage.setItem(
        "hangmanNexusPlayer",
        JSON.stringify(player)
    );

}


/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;


function playSound(type) {

    if (!player.sound) return;

    try {

        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === "correct") {

            oscillator.frequency.setValueAtTime(520, now);
            oscillator.frequency.exponentialRampToValueAtTime(
                760,
                now + 0.12
            );

        }

        else if (type === "wrong") {

            oscillator.frequency.setValueAtTime(160, now);
            oscillator.frequency.exponentialRampToValueAtTime(
                90,
                now + 0.16
            );

        }

        else if (type === "win") {

            oscillator.frequency.setValueAtTime(500, now);
            oscillator.frequency.setValueAtTime(700, now + 0.1);
            oscillator.frequency.setValueAtTime(900, now + 0.2);

        }

        else if (type === "lose") {

            oscillator.frequency.setValueAtTime(220, now);
            oscillator.frequency.exponentialRampToValueAtTime(
                70,
                now + 0.4
            );

        }

        else if (type === "click") {

            oscillator.frequency.setValueAtTime(350, now);

        }

        gain.gain.setValueAtTime(0.0001, now);

        gain.gain.exponentialRampToValueAtTime(
            0.07,
            now + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.18
        );

        oscillator.start(now);
        oscillator.stop(now + 0.2);

    } catch (error) {

        console.warn("Audio unavailable.");

    }

}


/* =========================================================
   RANDOM WORD
========================================================= */

function getFilteredWords() {

    const category = categorySelect.value;

    let filtered = wordList.filter(word => {

        const categoryMatch =
            category === "all" ||
            word.category === category;

        const difficultyMatch =
            word.difficulty === difficulty ||
            difficulty === "nightmare";

        return categoryMatch && difficultyMatch;

    });


    if (filtered.length === 0) {

        filtered = wordList.filter(word => {

            return category === "all" ||
                word.category === category;

        });

    }


    return filtered.length ? filtered : wordList;

}


function getRandomWord() {

    const words = getFilteredWords();

    return words[
        Math.floor(Math.random() * words.length)
    ];

}


/* =========================================================
   GAME START
========================================================= */

function startGame(options = {}) {

    clearInterval(timerInterval);

    isGameOver = false;
    isPaused = false;

    correctLetters = new Set();
    guessedLetters = new Set();

    wrongGuesses = 0;

    doubleXPActive = false;

    if (options.daily) {
        isDailyChallenge = true;
    } else {
        isDailyChallenge = false;
    }


    const selected = getRandomWord();

    currentWord = selected.word.toLowerCase();
    currentHint = selected.hint;
    currentCategory = selected.category;


    maxLives = CONFIG[difficulty].lives;

    maxTime = CONFIG[difficulty].time;
    timer = maxTime;


    renderWord();
    renderKeyboard();

    updateGameUI();
    updateHangman();
    updateLives();

    updatePowerups();

    hintText.textContent = currentHint;

    categoryName.textContent =
        formatCategory(currentCategory);

    difficultyBadge.textContent =
        difficulty.toUpperCase();

    wordLength.textContent =
        currentWord.replace(/\s/g, "").length;

    updateTimerUI();

    startTimer();

    closeAllModals();

    showToast(
        "New Challenge",
        isDailyChallenge
            ? "Daily challenge activated."
            : "A new word has appeared.",
        "✓"
    );

}


/* =========================================================
   WORD RENDER
========================================================= */

function renderWord() {

    wordDisplay.innerHTML = "";

    [...currentWord].forEach((letter, index) => {

        const li = document.createElement("li");

        li.className = "letter";

        if (letter === " ") {

            li.classList.add("space");
            li.textContent = "";

        }

        else if (correctLetters.has(letter)) {

            li.classList.add("guessed");
            li.textContent = letter.toUpperCase();

        }

        else {

            li.textContent = "";

        }

        li.dataset.index = index;

        wordDisplay.appendChild(li);

    });

}


/* =========================================================
   KEYBOARD
========================================================= */

const alphabet = "abcdefghijklmnopqrstuvwxyz";


function renderKeyboard() {

    keyboard.innerHTML = "";

    [...alphabet].forEach(letter => {

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = letter;

        button.dataset.letter = letter;

        button.addEventListener(
            "click",
            () => handleLetter(letter, button)
        );

        keyboard.appendChild(button);

    });

}


/* =========================================================
   HANDLE LETTER
========================================================= */

function handleLetter(letter, button = null) {

    if (isGameOver || isPaused) return;

    if (guessedLetters.has(letter)) return;

    guessedLetters.add(letter);


    if (!button) {

        button =
            keyboard.querySelector(
                `[data-letter="${letter}"]`
            );

    }


    if (button) {
        button.disabled = true;
    }


    if (currentWord.includes(letter)) {

        correctLetters.add(letter);

        if (button) {
            button.classList.add("correct");
        }

        gamePanel.classList.add("success");

        setTimeout(() => {
            gamePanel.classList.remove("success");
        }, 600);

        playSound("correct");

        const points =
            calculateCorrectScore();

        score += points;

        player.xp += Math.round(points / 2);

        showToast(
            "Correct!",
            `+${points} points`,
            "✓"
        );

        renderWord();

        checkVictory();

    } else {

        wrongGuesses++;

        if (button) {
            button.classList.add("wrong");
        }

        playSound("wrong");

        gamePanel.classList.remove("success");
        gamePanel.classList.add("shake");

        setTimeout(() => {
            gamePanel.classList.remove("shake");
        }, 400);

        streak = 0;

        player.streak = 0;

        showToast(
            "Missed!",
            "That letter isn't in the word.",
            "×"
        );

        updateHangman();
        updateLives();

        if (wrongGuesses >= maxLives) {

            endGame(false);
            return;

        }

    }


    updateGameUI();
    savePlayer();

}


/* =========================================================
   SCORE
========================================================= */

function calculateCorrectScore() {

    let base = 50;

    const frequency =
        [...currentWord]
            .filter(letter => letter !== " ")
            .filter(letter => !correctLetters.has(letter))
            .length;

    let bonus = frequency * 3;

    let streakBonus =
        Math.min(streak * 5, 50);

    let multiplier =
        CONFIG[difficulty].multiplier;

    let score =
        Math.round(
            (base + bonus + streakBonus) *
            multiplier
        );


    if (doubleXPActive) {

        score *= 2;

        doubleXPActive = false;

    }


    return score;

}


/* =========================================================
   VICTORY CHECK
========================================================= */

function checkVictory() {

    const lettersNeeded = new Set(
        [...currentWord].filter(letter => letter !== " ")
    );

    const won =
        [...lettersNeeded].every(
            letter => correctLetters.has(letter)
        );

    if (won) {

        endGame(true);

    }

}


/* =========================================================
   END GAME
========================================================= */

function endGame(victory) {

    if (isGameOver) return;

    isGameOver = true;

    clearInterval(timerInterval);

    player.games++;


    let earnedScore = 0;
    let earnedXP = 0;


    if (victory) {

        player.wins++;

        streak++;
        player.streak = streak;

        player.bestStreak =
            Math.max(
                player.bestStreak,
                streak
            );


        earnedScore =
            150 +
            Math.max(timer, 0) * 3 +
            streak * 25;

        earnedScore =
            Math.round(
                earnedScore *
                CONFIG[difficulty].multiplier
            );


        if (isDailyChallenge) {
            earnedScore += 300;
            earnedXP += 100;

            player.dailyCompleted = true;
            player.lastDailyDate =
                getDateKey();
        }


        earnedXP +=
            CONFIG[difficulty].xp +
            streak * 10;


        score += earnedScore;

        player.xp += earnedXP;

        player.score = score;


        playSound("win");

        showConfetti();

        showResult(
            true,
            earnedScore,
            earnedXP
        );

    }

    else {

        streak = 0;
        player.streak = 0;

        earnedXP = 5;

        player.xp += earnedXP;

        player.score = score;

        playSound("lose");

        showResult(
            false,
            0,
            earnedXP
        );

    }


    updatePlayerStats();
    updateGameUI();

    savePlayer();

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (isPaused || isGameOver) return;

        timer--;

        updateTimerUI();

        if (timer <= 0) {

            clearInterval(timerInterval);

            showToast(
                "Time's Up!",
                "The challenge has expired.",
                "⌛"
            );

            endGame(false);

        }

    }, 1000);

}


function updateTimerUI() {

    timerValue.textContent =
        Math.max(timer, 0);

    const percentage =
        Math.max(
            0,
            (timer / maxTime) * 100
        );

    timerProgress.style.width =
        `${percentage}%`;


    if (percentage <= 25) {

        timerValue.style.color =
            "var(--red)";

    }

    else if (percentage <= 50) {

        timerValue.style.color =
            "var(--yellow)";

    }

    else {

        timerValue.style.color =
            "";

    }

}


/* =========================================================
   HANGMAN
========================================================= */

function updateHangman() {

    const bodyParts = [
        ".head",
        ".body",
        ".arm-left",
        ".arm-right",
        ".leg-left",
        ".leg-right"
    ];

    bodyParts.forEach((selector, index) => {

        const element = document.querySelector(selector);

        element.style.opacity =
            wrongGuesses > index
                ? "1"
                : "0";

    });


    dangerBars.forEach((bar, index) => {

        bar.classList.toggle(
            "active",
            index < wrongGuesses
        );

    });

}


/* =========================================================
   LIVES
========================================================= */

function updateLives() {

    const lives =
        livesContainer.querySelectorAll("i");

    lives.forEach((life, index) => {

        life.classList.toggle(
            "dead",
            index < wrongGuesses
        );

    });

}


/* =========================================================
   GAME UI
========================================================= */

function updateGameUI() {

    scoreValue.textContent =
        score.toLocaleString();

    streakValue.textContent =
        streak;

    roundValue.textContent =
        round;

    comboValue.textContent =
        `x${Math.max(1, streak + 1)}`;

    incorrectText.innerHTML =
        `Incorrect: <b>${wrongGuesses} / ${maxLives}</b>`;

}


/* =========================================================
   POWERUPS
========================================================= */

function updatePowerups() {

    revealCount.textContent =
        player.powerups.reveal;

    lifeCount.textContent =
        player.powerups.life;

    doubleCount.textContent =
        player.powerups.double;


    revealBtn.disabled =
        player.powerups.reveal <= 0 ||
        isGameOver;

    lifeBtn.disabled =
        player.powerups.life <= 0 ||
        wrongGuesses <= 0 ||
        isGameOver;

    doubleBtn.disabled =
        player.powerups.double <= 0 ||
        doubleXPActive ||
        isGameOver;

}


/* =========================================================
   REVEAL POWER
========================================================= */

function useReveal() {

    if (
        player.powerups.reveal <= 0 ||
        isGameOver ||
        isPaused
    ) {
        return;
    }


    const hiddenLetters =
        [...new Set(
            [...currentWord].filter(letter => {

                return (
                    letter !== " " &&
                    !correctLetters.has(letter)
                );

            })
        )];


    if (!hiddenLetters.length) {

        showToast(
            "Nothing to Reveal",
            "All letters are already visible.",
            "!"
        );

        return;

    }


    const letter =
        hiddenLetters[
        Math.floor(
            Math.random() *
            hiddenLetters.length
        )
        ];


    player.powerups.reveal--;

    guessedLetters.add(letter);
    correctLetters.add(letter);


    const button =
        keyboard.querySelector(
            `[data-letter="${letter}"]`
        );


    if (button) {

        button.disabled = true;
        button.classList.add("correct");

    }


    score += 20;

    renderWord();

    updatePowerups();
    updateGameUI();

    playSound("correct");

    showToast(
        "Letter Revealed",
        `The letter "${letter.toUpperCase()}" was revealed.`,
        "⚡"
    );

    checkVictory();

    savePlayer();

}


/* =========================================================
   EXTRA LIFE
========================================================= */

function useExtraLife() {

    if (
        player.powerups.life <= 0 ||
        wrongGuesses <= 0 ||
        isGameOver
    ) {
        return;
    }


    player.powerups.life--;

    wrongGuesses--;

    updateLives();
    updateHangman();
    updatePowerups();
    updateGameUI();

    showToast(
        "Life Restored",
        "One mistake has been erased.",
        "♥"
    );

    playSound("correct");

    savePlayer();

}


/* =========================================================
   DOUBLE XP
========================================================= */

function useDoubleXP() {

    if (
        player.powerups.double <= 0 ||
        doubleXPActive ||
        isGameOver
    ) {
        return;
    }


    player.powerups.double--;

    doubleXPActive = true;

    updatePowerups();

    showToast(
        "Double XP Ready",
        "Your next correct letter gets double points.",
        "×2"
    );

    savePlayer();

}


/* =========================================================
   HINT
========================================================= */

function useHint() {

    if (isGameOver || isPaused) return;

    if (hintBtn.disabled) return;

    score = Math.max(
        0,
        score - 25
    );

    hintText.textContent =
        `${currentHint} • Word starts with "${currentWord[0].toUpperCase()}".`;

    hintBtn.disabled = true;

    showToast(
        "Intel Used",
        "-25 points",
        "?"
    );

    updateGameUI();

}


/* =========================================================
   PLAYER STATS
========================================================= */

function updatePlayerStats() {

    const level =
        Math.floor(player.xp / 500) + 1;

    player.level = level;

    levelValue.textContent =
        level;

    xpValue.textContent =
        player.xp.toLocaleString();


    const levelXP =
        player.xp % 500;

    const xpPercent =
        (levelXP / 500) * 100;

    xpBar.style.width =
        `${xpPercent}%`;


    gamesValue.textContent =
        player.games;

    winsValue.textContent =
        player.wins;

    bestStreakValue.textContent =
        player.bestStreak;


    const winRate =
        player.games === 0
            ? 0
            : Math.round(
                (player.wins /
                    player.games) *
                100
            );


    winRateValue.textContent =
        `${winRate}%`;


    updateAchievement();

}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function updateAchievement() {

    if (player.wins === 0) {

        achievementTitle.textContent =
            "First Victory";

        achievementBar.style.width =
            "0%";

    }

    else if (player.bestStreak < 5) {

        achievementTitle.textContent =
            "Hot Streak";

        achievementBar.style.width =
            `${Math.min(
                100,
                (player.bestStreak / 5) * 100
            )}%`;

    }

    else if (player.wins < 25) {

        achievementTitle.textContent =
            "Word Hunter";

        achievementBar.style.width =
            `${Math.min(
                100,
                (player.wins / 25) * 100
            )}%`;

    }

    else {

        achievementTitle.textContent =
            "Nexus Master";

        achievementBar.style.width =
            "100%";

    }

}


/* =========================================================
   RESULT MODAL
========================================================= */

function showResult(
    victory,
    earnedScore,
    earnedXP
) {

    resultModal.classList.add("show");


    if (victory) {

        resultIcon.textContent = "🏆";
        resultLabel.textContent =
            "MISSION COMPLETE";

        resultTitle.textContent =
            streak >= 3
                ? "Unstoppable!"
                : "Excellent!";

        resultMessage.textContent =
            streak >= 3
                ? `${streak} round streak! You're on fire.`
                : "You successfully decoded the word.";

    }

    else {

        resultIcon.textContent = "💀";
        resultLabel.textContent =
            "MISSION FAILED";

        resultTitle.textContent =
            "Better Luck Next Time";

        resultMessage.textContent =
            "The word escaped this round. Try again.";

    }


    resultWord.textContent =
        currentWord.toUpperCase();

    resultScore.textContent =
        `+${earnedScore}`;

    resultXP.textContent =
        `+${earnedXP}`;

    resultStreak.textContent =
        streak;

}


/* =========================================================
   MODAL CONTROL
========================================================= */

function closeAllModals() {

    resultModal.classList.remove("show");
    pauseModal.classList.remove("show");

}


function continueGame() {

    resultModal.classList.remove("show");

    round++;

    score = player.score;

    startGame({
        daily: false
    });

}


function pauseGame() {

    if (isGameOver) return;

    isPaused = true;

    pauseModal.classList.add("show");

}


function resumeGame() {

    isPaused = false;

    pauseModal.classList.remove("show");

}


/* =========================================================
   NEW GAME
========================================================= */

function newGame() {

    clearInterval(timerInterval);

    score = 0;
    streak = 0;
    round = 1;

    player.streak = 0;

    startGame();

    showToast(
        "Fresh Start",
        "Your new run has begun.",
        "↻"
    );

}


/* =========================================================
   DIFFICULTY
========================================================= */

document.querySelectorAll(".difficulty-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".difficulty-btn")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                difficulty =
                    button.dataset.difficulty;

                score = 0;
                streak = 0;
                round = 1;

                startGame();

            }
        );

    });


/* =========================================================
   CATEGORY
========================================================= */

categorySelect.addEventListener(
    "change",
    () => {

        score = 0;
        streak = 0;
        round = 1;

        startGame();

    }
);


/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("light");

        const isLight =
            document.body.classList.contains("light");

        player.theme =
            isLight
                ? "light"
                : "dark";

        themeBtn.textContent =
            isLight
                ? "🌙"
                : "☀";

        savePlayer();

    }
);


function loadTheme() {

    if (player.theme === "light") {

        document.body.classList.add("light");

        themeBtn.textContent = "🌙";

    }

}


/* =========================================================
   SOUND
========================================================= */

soundBtn.addEventListener(
    "click",
    () => {

        player.sound =
            !player.sound;

        soundBtn.textContent =
            player.sound
                ? "🔊"
                : "🔇";

        savePlayer();

    }
);


/* =========================================================
   PAUSE
========================================================= */

pauseBtn.addEventListener(
    "click",
    pauseGame
);

resumeBtn.addEventListener(
    "click",
    resumeGame
);


/* =========================================================
   BUTTON EVENTS
========================================================= */

newGameBtn.addEventListener(
    "click",
    newGame
);

nextBtn.addEventListener(
    "click",
    () => {

        if (!isGameOver) {

            showToast(
                "Finish Current Round",
                "Complete this challenge first.",
                "!"
            );

            return;

        }

        continueGame();

    }
);


modalPlayBtn.addEventListener(
    "click",
    continueGame
);


closeModal.addEventListener(
    "click",
    () => {

        resultModal.classList.remove("show");

    }
);


hintBtn.addEventListener(
    "click",
    useHint
);


revealBtn.addEventListener(
    "click",
    useReveal
);


lifeBtn.addEventListener(
    "click",
    useExtraLife
);


doubleBtn.addEventListener(
    "click",
    useDoubleXP
);


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function getDateKey() {

    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");

}


function startDailyChallenge() {

    const today =
        getDateKey();

    if (
        player.dailyCompleted &&
        player.lastDailyDate === today
    ) {

        showToast(
            "Already Completed",
            "Come back tomorrow for a new challenge.",
            "✓"
        );

        return;

    }


    difficulty = "hard";

    document
        .querySelectorAll(".difficulty-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.difficulty === "hard"
            );

        });


    const dailyWords =
        wordList.filter(
            word =>
                word.difficulty === "hard"
        );


    const todayIndex =
        Math.floor(
            new Date().getTime() /
            86400000
        ) % dailyWords.length;


    const selected =
        dailyWords[todayIndex];


    currentWord =
        selected.word.toLowerCase();

    currentHint =
        selected.hint;

    currentCategory =
        selected.category;

    isDailyChallenge = true;

    correctLetters = new Set();
    guessedLetters = new Set();

    wrongGuesses = 0;

    maxLives = 6;

    maxTime = 45;
    timer = 45;

    isGameOver = false;

    hintBtn.disabled = false;

    renderWord();
    renderKeyboard();

    updateHangman();
    updateLives();
    updateGameUI();
    updateTimerUI();

    hintText.textContent =
        currentHint;

    categoryName.textContent =
        `${formatCategory(currentCategory)} • DAILY`;

    difficultyBadge.textContent =
        "DAILY";

    wordLength.textContent =
        currentWord.length;

    clearInterval(timerInterval);

    startTimer();

    closeAllModals();

    showToast(
        "Daily Challenge",
        "Hard mode • Bonus XP available.",
        "★"
    );

}


dailyBtn.addEventListener(
    "click",
    startDailyChallenge
);


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            if (pauseModal.classList.contains("show")) {

                resumeGame();

            }

            else if (resultModal.classList.contains("show")) {

                resultModal.classList.remove("show");

            }

            return;

        }


        if (event.key === " ") {

            if (!resultModal.classList.contains("show")) {

                pauseGame();

            }

            return;

        }


        const letter =
            event.key.toLowerCase();


        if (
            /^[a-z]$/.test(letter) &&
            !isGameOver &&
            !isPaused
        ) {

            const button =
                keyboard.querySelector(
                    `[data-letter="${letter}"]`
                );

            handleLetter(letter, button);

        }

    }
);


/* =========================================================
   FORMAT CATEGORY
========================================================= */

function formatCategory(category) {

    if (!category) return "Unknown";

    return category
        .charAt(0)
        .toUpperCase() +
        category.slice(1);

}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout = null;


function showToast(
    title,
    message,
    icon = "✓"
) {

    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;

    toastIcon.textContent =
        icon;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2200);

}


/* =========================================================
   CONFETTI
========================================================= */

function showConfetti() {

    confetti.innerHTML = "";

    const pieces = 70;

    for (let i = 0; i < pieces; i++) {

        const piece =
            document.createElement("span");

        piece.className =
            "confetti-piece";

        piece.style.left =
            `${Math.random() * 100}%`;

        piece.style.animationDelay =
            `${Math.random() * 0.5}s`;

        piece.style.background =
            [
                "#6d7cff",
                "#3de8ff",
                "#4df2a3",
                "#ffd166",
                "#ff5d7a",
                "#ffffff"
            ][
            Math.floor(
                Math.random() * 6
            )
            ];

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        confetti.appendChild(piece);

    }


    setTimeout(() => {

        confetti.innerHTML = "";

    }, 2500);

}


/* =========================================================
   TIPS
========================================================= */

const tips = [

    "Use the hint strategically. Save your power-ups for difficult rounds.",

    "Long words often contain common vowels. Try A, E, I and O early.",

    "Keep your streak alive to increase your combo multiplier.",

    "Use Reveal when only one or two letters are missing.",

    "Extra Life is most valuable near the final mistake.",

    "Nightmare mode rewards aggressive but accurate guessing.",

    "Your next correct letter can become a Double XP opportunity.",

    "Physical keyboard support is enabled. Type letters directly.",

    "Daily Challenge gives bonus XP when completed.",

    "A high streak is the fastest way to climb the Nexus levels."

];


function rotateTip() {

    tipText.textContent =
        tips[
        Math.floor(
            Math.random() *
            tips.length
        )
        ];

}


setInterval(
    rotateTip,
    7000
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

    loadTheme();

    soundBtn.textContent =
        player.sound
            ? "🔊"
            : "🔇";


    powerups = {
        ...player.powerups
    };


    score =
        player.score || 0;

    streak =
        player.streak || 0;


    updatePlayerStats();

    renderKeyboard();

    startGame();

}


initialize();