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

let wordsForRound = [];
let currentIndex = 0;
let score = 0;
let gameActive = false;
let lastTilt = 0;
let timeRemaining = 0;
let timerInterval = null;
const TILT_THRESHOLD = 30; // degrees needed to trigger action
const TILT_COOLDOWN = 800; // ms between tilt actions

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
  clearInterval(timerInterval);

  correctBtn.disabled = true;
  skipBtn.disabled = true;
  startBtn.disabled = false;
  categorySelect.disabled = false;
  timerSelect.disabled = false;
  difficultySelect.disabled = false;

  wordText.textContent = `Game Over! Final Score: ${score}`;
}

// Handle device orientation for tilt controls
function handleOrientation(event) {
  if (!gameActive) return;

  const beta = event.beta; // Front-to-back tilt (-180 to 180)
  const now = Date.now();

  // Prevent rapid-fire tilts
  if (now - lastTilt < TILT_COOLDOWN) return;

  // Tilt forward (phone down toward ground) = Correct
  if (beta > 90 + TILT_THRESHOLD) {
    lastTilt = now;
    markCorrect();
  }
  // Tilt backward (phone up toward sky) = Skip
  else if (beta < 90 - TILT_THRESHOLD) {
    lastTilt = now;
    skipWord();
  }
}

// Add motion listener
window.addEventListener('deviceorientation', handleOrientation);

startBtn.addEventListener("click", startRound);
correctBtn.addEventListener("click", markCorrect);
skipBtn.addEventListener("click", skipWord);