// ------------------- Game State -------------------
let gameQuestions = getRandomQuestions(questions, 15);
let currentQuestionIndex = 0;
let used5050 = false;
let usedPhone = false;
let usedPoll = false;
let timerInterval;
let timeLeft = 45; // seconds for each question

// --- Audio Elements (ADDED) ---
const clockAudio = new Audio('sounds/clock.mp3');
clockAudio.loop = true; // Make the clock sound loop
const correctAudio = new Audio('sounds/correctanswer.mp3');
const wrongAudio = new Audio('sounds/wronganswer.mp3');
// -----------------------------

const prizeList = [
  "₹ 1,000",
  "₹ 2,000",
  "₹ 3,000",
  "₹ 5,000",
  "₹ 10,000",
  "₹ 20,000",
  "₹ 40,000",
  "₹ 80,000",
  "₹ 1,60,000",
  "₹ 3,20,000",
  "₹ 6,40,000",
  "₹ 12,50,000",
  "₹ 25,00,000",
  "₹ 50,00,000",
  "₹ 1 Crore"
];

// ------------------- Helpers -------------------
function getRandomQuestions(allQuestions, num = 15) {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// ------------------- Game Logic -------------------
loadQuestion();

function loadQuestion() {
  clearInterval(timerInterval);
  // --- ADDED ---
  clockAudio.pause(); // Stop clock sound when loading new question
  clockAudio.currentTime = 0; // Reset clock sound
  // -------------
  
  timeLeft = 45;
  startTimer();

  const q = gameQuestions[currentQuestionIndex];
  document.getElementById("prize-money").textContent = `🏆 Current Prize: ${prizeList[currentQuestionIndex]}`;
  document.getElementById("question").textContent = q.question;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  const labels = ["A", "B", "C", "D"];
  q.answers.forEach((answer, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-button";
    btn.innerHTML = `<span>${labels[idx]}.</span> ${answer}`;
    btn.onclick = () => checkAnswer(idx, btn);
    answersDiv.appendChild(btn);
  });

  highlightPrizeStep();
}

/**
 * --- MODIFIED FUNCTION ---
 * Turns selected button orange, plays sound, waits 7s, then shows result.
 */
function checkAnswer(selected, btn) {
  // 1. Stop timer and clock immediately
  clearInterval(timerInterval);
  clockAudio.pause();
  
  const q = gameQuestions[currentQuestionIndex];
  const resultDiv = document.getElementById("result");
  const buttons = document.querySelectorAll("#answers .option-button");

  // 2. Disable all buttons immediately
  buttons.forEach(b => b.disabled = true);

  // 3. (NEW) Turn selected button orange immediately
  btn.classList.add("selected");
  
  const isCorrect = (selected === q.correct);

  // 4. Play sound immediately
  if (isCorrect) {
    correctAudio.play();
  } else {
    wrongAudio.play();
  }

  // 5. Delay visual feedback and next step by 7 seconds
  setTimeout(() => {
    // (NEW) Remove orange class
    btn.classList.remove("selected");

    if (isCorrect) {
      btn.classList.add("correct");
      resultDiv.textContent = "✅ Correct!";
      currentQuestionIndex++;
      
      if (currentQuestionIndex < gameQuestions.length) {
        // Wait 1.2s *after* showing result before loading next question
        setTimeout(() => {
          resultDiv.textContent = "";
          loadQuestion();
        }, 1200); 
      } else {
        resultDiv.textContent = "🎉 You've completed the game!";
      }
    } else {
      btn.classList.add("wrong");
      resultDiv.textContent = "❌ Wrong! Game Over.";
      // Also show the correct answer
      buttons[q.correct].classList.add("correct");
    }
  }, 7000); // 7-second delay
}


function use5050() {
  if (used5050) return alert("❗ You've already used 50-50.");
  used5050 = true;

  const q = gameQuestions[currentQuestionIndex];
  const answers = document.querySelectorAll("#answers .option-button");

  let wrongIndexes = [];
  answers.forEach((btn, idx) => {
    if (idx !== q.correct) wrongIndexes.push(idx);
  });

  const hideIndexes = wrongIndexes.sort(() => 0.5 - Math.random()).slice(0, 2);
  hideIndexes.forEach(i => { answers[i].style.visibility = "hidden"; });
}

function usePhone() {
  if (usedPhone) return alert("❗ You've already used Phone a Friend.");
  usedPhone = true;
  const q = gameQuestions[currentQuestionIndex];
  const guess = Math.random() < 0.8 ? q.correct : Math.floor(Math.random() * 4);
  alert("📞 Your friend thinks the answer is: " + q.answers[guess]);
}

function usePoll() {
  if (usedPoll) return alert("❗ You've already used Audience Poll.");
  usedPoll = true;

  const q = gameQuestions[currentQuestionIndex];
  let votes = [0, 0, 0, 0];
  votes[q.correct] = Math.floor(Math.random() * 30) + 40;
  let remaining = 100 - votes[q.correct];
  for (let i = 0; i < 4; i++) {
    if (i !== q.correct) {
      let val = Math.floor(Math.random() * (remaining + 1));
      votes[i] = val;
      remaining -= val;
    }
  }

  alert("📊 Audience Poll Results:\n" +
    q.answers.map((a, i) => `${a}: ${votes[i]}%`).join("\n"));
}

function highlightPrizeStep() {
  const ladder = document.getElementById("prize-ladder");
  ladder.innerHTML = "";
  for (let i = prizeList.length - 1; i >= 0; i--) {
    const div = document.createElement("div");
    div.className = "prize-step";
    if (i === currentQuestionIndex) div.classList.add("active-step");
    div.textContent = prizeList[i];
    ladder.appendChild(div);
  }
}

function startTimer() {
  const timerEl = document.getElementById("timer");
  timerEl.textContent = `⏳ Time Left: ${timeLeft}s`;
  
  clockAudio.play(); // --- ADDED ---

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏳ Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // --- ADDED ---
      clockAudio.pause(); // Stop clock sound
      wrongAudio.play(); // Play wrong sound
      // -------------
      document.getElementById("result").textContent = "⏰ Time's up! Game Over.";
      document.querySelectorAll("#answers .option-button").forEach(b => b.disabled = true);
    }
  }, 1000);
}