const WORDS = {
  animals: ["dog", "cat", "elephant", "lion", "giraffe", "panda"],
  movies: ["Frozen", "Avatar", "Titanic", "Inception", "Batman"],
  food: ["pizza", "sushi", "burger", "taco", "ice cream", "noodles"]
};

const categorySelect = document.getElementById("category");
const startBtn = document.getElementById("startBtn");
const wordText = document.getElementById("wordText");
const correctBtn = document.getElementById("correctBtn");
const skipBtn = document.getElementById("skipBtn");
const scoreDisplay = document.getElementById("scoreDisplay");

let wordsForRound = [];
let currentIndex = 0;
let score = 0;
let gameActive = false;
let lastTilt = 0;
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
  wordsForRound = shuffle(WORDS[category].slice());
  currentIndex = 0;
  score = 0;
  scoreDisplay.textContent = score;

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

  correctBtn.disabled = false;
  skipBtn.disabled = false;
  startBtn.disabled = true;
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