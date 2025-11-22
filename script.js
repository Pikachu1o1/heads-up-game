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

function shuffle(array) {
  return array
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function startRound() {
  const category = categorySelect.value;
  wordsForRound = shuffle(WORDS[category].slice());
  currentIndex = 0;
  score = 0;
  scoreDisplay.textContent = score;
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

startBtn.addEventListener("click", startRound);
correctBtn.addEventListener("click", markCorrect);
skipBtn.addEventListener("click", skipWord);