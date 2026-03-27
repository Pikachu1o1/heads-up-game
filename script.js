const WORDS = {
  animals: {
    easy: ["dog", "cat", "bird", "fish", "cow", "pig"],
    medium: ["elephant", "lion", "giraffe", "panda", "zebra", "monkey"],
    hard: ["platypus", "armadillo", "narwhal", "axolotl", "capybara", "lemur"]
  },
  movies: {
    easy: ["Frozen", "Shrek", "Cars", "Up", "Brave", "Moana"],
    medium: ["Avatar", "Titanic", "Inception", "Batman", "Joker", "Gladiator"],
    hard: ["Interstellar", "Parasite", "Memento", "Arrival", "Blade Runner", "Spirited Away"]
  },
  food: {
    easy: ["pizza", "burger", "fries", "cookie", "cake", "bread"],
    medium: ["sushi", "taco", "pasta", "noodles", "curry", "sandwich"],
    hard: ["carpaccio", "pho", "paella", "risotto", "tzatziki", "bouillabaisse"]
  }
};

const categorySelect = document.getElementById("category");
const timerSelect = document.getElementById("timer");
const difficultySelect = document.getElementById("difficulty");
const startBtn = document.getElementById("startBtn");
const wordText = document.getElementById("wordText");
const correctBtn = document.getElementById("correctBtn");
const skipBtn = document.getElementById("skipBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const timeDisplay = document.getElementById("timeDisplay");
const debugInfo = document.getElementById("debugInfo");

let wordsForRound = [];
let currentIndex = 0;
let score = 0;
let gameActive = false;
let timeRemaining = 0;
let timerInterval = null;
let baselineOrientation = null; // Store initial phone position
let hasTilted = false; // Track if user has tilted (prevents multiple triggers)
let lastActionTime = 0; // Timestamp of last action (correct/skip)
const TILT_THRESHOLD = 50; // degrees needed to trigger action
const RETURN_THRESHOLD = 15; // degrees - must return this close to baseline to reset
const ACTION_COOLDOWN = 3000; // 3 seconds in milliseconds

function shuffle(array) {
  return array
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

async function startRound() {
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  const timerDuration = parseInt(timerSelect.value);

  // Get words based on category and difficulty
  wordsForRound = shuffle(WORDS[category][difficulty].slice());
  currentIndex = 0;
  score = 0;
  scoreDisplay.textContent = score;

  // Initialize timer
  timeRemaining = timerDuration;
  updateTimeDisplay();

  // Request motion permission on iOS 13+
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        alert('Motion permission is needed to play. Please allow motion access.');
        return;
      }
    } catch (error) {
      console.error('Error requesting motion permission:', error);
    }
  }

  gameActive = true;
  baselineOrientation = null; // Reset baseline - will be set on first orientation event
  hasTilted = false; // Reset tilt state
  lastActionTime = 0; // Reset action cooldown
  showNextWord();

  // Start timer countdown
  timerInterval = setInterval(updateTimer, 1000);

  correctBtn.disabled = false;
  skipBtn.disabled = false;
  startBtn.disabled = true;
  categorySelect.disabled = true;
  timerSelect.disabled = true;
  difficultySelect.disabled = true;
}

function showNextWord() {
  if (currentIndex >= wordsForRound.length) {
    currentIndex = 0;
  }
  wordText.textContent = wordsForRound[currentIndex];
  currentIndex++;
}

function markCorrect() {
  score++;
  scoreDisplay.textContent = score;
  showNextWord();
}

function skipWord() {
  showNextWord();
}

function updateTimer() {
  timeRemaining--;
  updateTimeDisplay();

  if (timeRemaining <= 0) {
    endGame();
  }
}

function updateTimeDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endGame() {
  gameActive = false;
  baselineOrientation = null;
  hasTilted = false;
  clearInterval(timerInterval);

  correctBtn.disabled = true;
  skipBtn.disabled = true;
  startBtn.disabled = false;
  categorySelect.disabled = false;
  timerSelect.disabled = false;
  difficultySelect.disabled = false;

  wordText.textContent = `Game Over! Final Score: ${score}`;
  debugInfo.textContent = '';
}

// Handle device orientation for tilt controls
function handleOrientation(event) {
  const beta = event.beta; // Front-to-back tilt (-180 to 180)

  if (!gameActive) {
    debugInfo.textContent = `Tilt: ${Math.round(beta)}°`;
    return;
  }

  // Phone on forehead position: screen facing out, phone vertical
  // Beta should be around 60-120 degrees (roughly vertical/upright)
  const isOnForehead = beta >= 60 && beta <= 120;

  if (!isOnForehead) {
    // Phone is flat or upside down - wait for forehead position
    debugInfo.textContent = `Tilt: ${Math.round(beta)}° - Put phone on forehead (upright)!`;
    baselineOrientation = null; // Reset baseline when not in position
    hasTilted = false;
    return;
  }

  // Set baseline when phone first reaches forehead position
  if (baselineOrientation === null) {
    baselineOrientation = beta;
    hasTilted = false;
    debugInfo.textContent = `Ready! Baseline: ${Math.round(beta)}°`;
    return;
  }

  // Calculate difference from baseline
  const tiltDiff = beta - baselineOrientation;

  // If user has already tilted, wait for them to return to baseline
  if (hasTilted) {
    // Check if phone has returned close to baseline
    if (Math.abs(tiltDiff) < RETURN_THRESHOLD) {
      hasTilted = false;
      debugInfo.textContent = `Ready! ${Math.round(beta)}° - Returned to baseline`;
    } else {
      debugInfo.textContent = `Return to baseline (${Math.round(beta)}°, diff: ${Math.round(tiltDiff)}°)`;
    }
    return;
  }

  // Show current status when ready
  debugInfo.textContent = `Ready! ${Math.round(beta)}° (diff: ${Math.round(tiltDiff)}°, need ${TILT_THRESHOLD}°)`;

  // Check if we're in cooldown period
  const now = Date.now();
  if (now - lastActionTime < ACTION_COOLDOWN) {
    const cooldownRemaining = Math.ceil((ACTION_COOLDOWN - (now - lastActionTime)) / 1000);
    debugInfo.textContent += ` - Wait ${cooldownRemaining}s`;
    return;
  }

  // Tilt DOWN (phone top moving toward ground) = Correct
  // Beta INCREASES when tilting down from forehead position
  if (tiltDiff > TILT_THRESHOLD) {
    debugInfo.textContent = `✅ CORRECT! (tilted down ${Math.round(tiltDiff)}°)`;
    markCorrect();
    lastActionTime = Date.now(); // Record action time
    hasTilted = true; // Prevent multiple triggers
  }
  // Tilt UP (phone top moving toward sky) = Skip
  // Beta DECREASES when tilting up from forehead position
  else if (tiltDiff < -TILT_THRESHOLD) {
    debugInfo.textContent = `⏭ SKIP! (tilted up ${Math.round(Math.abs(tiltDiff))}°)`;
    skipWord();
    lastActionTime = Date.now(); // Record action time
    hasTilted = true; // Prevent multiple triggers
  }
}

// Add motion listener
window.addEventListener('deviceorientation', handleOrientation);

startBtn.addEventListener("click", startRound);
correctBtn.addEventListener("click", markCorrect);
skipBtn.addEventListener("click", skipWord);