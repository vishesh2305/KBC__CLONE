// ------------------- Game Main Object -------------------
const KBC = {
  // --- Game State ---
  gameQuestions: [],
  currentQuestionIndex: 0,
  gameState: {
    playerName: "Player",
    currentQuestionIndex: 0,
    currentPrize: "₹0",
    safeHavenPrize: "₹0",
    safeHavenScore: 0,
    score: 0,
    lifelinesUsed: {
      "5050": false,
      phone: false,
      poll: false,
    },
  },
  timerInterval: null,
  timeLeft: 45,
  gameInProgress: false,

  // --- Audio Elements ---
  clockAudio: new Audio("sounds/clock.mp3"),
  correctAudio: new Audio("sounds/correctanswer.mp3"),
  wrongAudio: new Audio("sounds/wronganswer.mp3"),
  nextQuestionAudio: new Audio("sounds/nextquestionsound.mp3"),
  gamestartAudio: new Audio("sounds/gamestartsound.mp3"), // <-- ADDED

  // --- Prize & Safe Haven Config ---
  prizeList: [
    "₹ 1,000",   // 0
    "₹ 2,000",   // 1
    "₹ 3,000",   // 2
    "₹ 5,000",   // 3
    "₹ 10,000",  // 4 - Safe Haven 1
    "₹ 20,000",  // 5
    "₹ 40,000",  // 6
    "₹ 80,000",  // 7
    "₹ 1,60,000", // 8
    "₹ 3,20,000", // 9 - Safe Haven 2
    "₹ 6,40,000", // 10
    "₹ 12,50,000", // 11
    "₹ 25,00,000", // 12
    "₹ 50,00,000", // 13
    "₹ 1 Crore",   // 14
  ],
  safeHavenIndexes: [4, 9], // Corresponds to ₹10,000 and ₹3,20,000
  prizeScores: [
    1000, 2000, 3000, 5000, 10000, 20000, 40000, 80000, 160000, 320000,
    640000, 1250000, 2500000, 5000000, 10000000
  ],

  // ------------------- DOM Elements -------------------
  Elements: {
    startModal: document.getElementById("start-modal"),
    playerNameInput: document.getElementById("player-name-input"),
    startBtn: document.getElementById("start-modal-btn"),
    gameOverModal: document.getElementById("game-over-modal"),
    gameOverTitle: document.getElementById("game-over-title"),
    gameOverMsg: document.getElementById("game-over-message"),
    finalPrize: document.getElementById("final-prize"),
    playAgainBtn: document.getElementById("play-again-btn"),
    leaderboardBtn: document.getElementById("leaderboard-btn"),
    pollModal: document.getElementById("poll-modal"),
    phoneModal: document.getElementById("phone-modal"),
    questionEl: document.getElementById("question"),
    answersEl: document.getElementById("answers"),
    timerEl: document.getElementById("timer"),
    prizeMoneyEl: document.getElementById("prize-money"),
    resultEl: document.getElementById("result"),
    prizeLadderEl: document.getElementById("prize-ladder"),
    nextQuestionBtn: document.getElementById("next-question-btn"),
  },

  // ------------------- Initialization -------------------
  init: function () {
    this.clockAudio.loop = true;
    
    this.Elements.startBtn.onclick = () => this.startGame();
    this.Elements.playAgainBtn.onclick = () => window.location.reload();
    this.Elements.leaderboardBtn.onclick = () =>
      (window.location.href = "leaderboard.html");

    this.Elements.nextQuestionBtn.onclick = () => this.loadQuestion();

    this.loadState();
    if (this.gameInProgress) {
      console.log("Found game in progress, but starting new game for new questions.");
      this.clearState();
      this.Elements.startModal.classList.add("visible");
    } else {
      this.Elements.startModal.classList.add("visible");
    }
  },

  // ------------------- Game Flow -------------------

  startGame: async function () {
    this.gamestartAudio.play(); // <-- ADDED

    const playerName = this.Elements.playerNameInput.value.trim();
    if (!playerName) {
      alert("Please enter a name!");
      return;
    }
    this.gameState.playerName = playerName;
    this.Elements.startModal.classList.remove("visible");

    if (this.gameInProgress && this.gameQuestions.length > 0) {
      console.log("Resuming game in progress...");
      this.currentQuestionIndex = this.gameState.currentQuestionIndex;
      this.loadQuestion();
      this.updateLifelineUI();
    } else {
      console.log("Starting new game...");
      this.gameState = {
        playerName: playerName,
        currentQuestionIndex: 0,
        currentPrize: "₹0",
        safeHavenPrize: "₹0",
        safeHavenScore: 0,
        score: 0,
        lifelinesUsed: { "5050": false, phone: false, poll: false },
      };
      this.currentQuestionIndex = 0;
      
      try {
        const response = await fetch('/api/questions/game');
        if (!response.ok) throw new Error('Failed to fetch questions');
        this.gameQuestions = await response.json();
        
        if(this.gameQuestions.length < 15) {
             alert("Not enough questions in the database to play! Please add at least 15 questions in the admin panel.");
             return;
        }

        this.gameInProgress = true;
        this.saveState();
        
        // Wait for 4 seconds (sound duration) before loading the first question
        setTimeout(() => {
            this.loadQuestion();
            this.updateLifelineUI();
        }, 4000); // 4000ms = 4 seconds

      } catch (error) {
        console.error("Error starting game:", error);
        this.Elements.questionEl.textContent = "Failed to load questions. Please try again later.";
      }
    }
  },

  loadQuestion: function () {
    // Play sound only if it's not the very first question
    if (this.currentQuestionIndex > 0) {
        this.nextQuestionAudio.play();
    }

    this.Elements.nextQuestionBtn.style.display = 'none';
    this.Elements.resultEl.textContent = "";

    if (this.currentQuestionIndex >= this.gameQuestions.length) {
      this.endGame(true, "You've won! You are a Crorepati!");
      return;
    }

    this.gameState.currentQuestionIndex = this.currentQuestionIndex;
    this.gameState.currentPrize = this.currentQuestionIndex > 0 ? this.prizeList[this.currentQuestionIndex - 1] : "₹0";
    this.gameState.score = this.currentQuestionIndex > 0 ? this.prizeScores[this.currentQuestionIndex - 1] : 0;
    this.saveState();

    const q = this.gameQuestions[this.currentQuestionIndex];
    
    if (!q || !q.question || !q.answers || q.answers.length !== 4) {
        console.error("Invalid question data:", q);
        this.endGame(false, "A game error occurred.");
        return;
    }
    
    const currentPrizeText = this.prizeList[this.currentQuestionIndex];
    this.Elements.prizeMoneyEl.textContent = `🏆 Prize: ${currentPrizeText}`;
    this.Elements.questionEl.textContent = q.question;

    this.Elements.answersEl.innerHTML = "";
    const labels = ["A", "B", "C", "D"];
    q.answers.forEach((answer, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-button";
      btn.innerHTML = `<span>${labels[idx]}.</span> ${answer}`;
      btn.onclick = () => this.checkAnswer(idx, btn);
      this.Elements.answersEl.appendChild(btn);
    });

    // --- NEW LIFELINE LOCK LOGIC ---
    const lifelines = document.querySelectorAll('.lifeline');
    // Lock for first 3 questions (index 0, 1, 2)
    if (this.currentQuestionIndex < 3) { 
        lifelines.forEach(ll => ll.classList.add('locked'));
    } else {
        lifelines.forEach(ll => ll.classList.remove('locked'));
    }
    // --- END NEW LOGIC ---

    this.highlightPrizeStep();
    this.startTimer();
  },

  checkAnswer: function (selected, btn) {
    // 1. Stop timer and clock immediately
    this.pauseTimer(); // <-- MODIFIED

    const q = this.gameQuestions[this.currentQuestionIndex];
    const buttons = this.Elements.answersEl.querySelectorAll(".option-button");

    // 2. Disable all buttons immediately
    buttons.forEach((b) => (b.disabled = true));

    // 3. Turn selected button orange (Lock in the answer)
    btn.classList.add("selected");

    const isCorrect = selected === q.correct;

    // 4. NEW: Play the win/lose sound IMMEDIATELY
    if (isCorrect) {
      this.correctAudio.play();
    } else {
      this.wrongAudio.play();
    }

    // 5. Wait 6 seconds for the "suspense" (visual delay)
    setTimeout(() => {
      // 6. Remove the "selected" (orange) class
      btn.classList.remove("selected");

      // 7. NOW show the color and text result
      if (isCorrect) {
        btn.classList.add("correct"); // Show green
        this.Elements.resultEl.textContent = "✅ Correct!";

        // Check for safe haven
        if (this.safeHavenIndexes.includes(this.currentQuestionIndex)) {
          this.gameState.safeHavenPrize = this.prizeList[this.currentQuestionIndex];
          this.gameState.safeHavenScore = this.prizeScores[this.currentQuestionIndex];
          console.log(`Safe Haven Reached: ${this.gameState.safeHavenPrize}`);
        }

        this.currentQuestionIndex++;
        
        // Show the 'Next Question' button
        this.Elements.nextQuestionBtn.style.display = 'block';

      } else {
        btn.classList.add("wrong"); // Show red
        buttons[q.correct].classList.add("correct"); // Show the right one
        
        // Wait a little bit after showing the wrong answer to show the game over modal
        setTimeout(() => {
            this.endGame(false, "❌ Wrong Answer! Game Over.");
        }, 2000); // 2s after showing the result
      }
    }, 7500); // 6-second delay as requested
  },

  quitGame: function () {
    const currentPrize = this.currentQuestionIndex > 0 ? this.prizeList[this.currentQuestionIndex - 1] : "₹0";
    if (confirm(`Are you sure you want to walk away with ${currentPrize}?`)) {
        this.pauseTimer(); // <-- MODIFIED
        this.endGame(true, "You decided to walk away.");
    }
  },

  endGame: async function (isWinner, message) {
    this.pauseTimer(); // <-- MODIFIED
    this.gameInProgress = false;

    let finalPrize = "₹0";
    let finalScore = 0;

    if (isWinner) {
      // Won the game or quit
      if (this.currentQuestionIndex === this.gameQuestions.length) {
        // Won the whole game
        finalPrize = this.prizeList[this.gameQuestions.length - 1];
        finalScore = this.prizeScores[this.gameQuestions.length - 1];
      } else {
        // Quit
        finalPrize = this.currentQuestionIndex > 0 ? this.prizeList[this.currentQuestionIndex - 1] : "₹0";
        finalScore = this.currentQuestionIndex > 0 ? this.prizeScores[this.currentQuestionIndex - 1] : 0;
      }
    } else {
      // Wrong answer
      finalPrize = this.gameState.safeHavenPrize;
      finalScore = this.gameState.safeHavenScore;
    }
    
    this.Elements.resultEl.textContent = message;
    this.Elements.gameOverTitle.textContent = isWinner ? "Congratulations!" : "Game Over!";
    this.Elements.gameOverMsg.textContent = message;
    this.Elements.finalPrize.textContent = finalPrize;
    this.Elements.gameOverModal.classList.add("visible");

    // Disable all option buttons
    this.Elements.answersEl.querySelectorAll(".option-button").forEach(b => b.disabled = true);

    // Save score to leaderboard
    if (finalScore > 0 || this.currentQuestionIndex > 0) {
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.gameState.playerName,
            prize_money: finalPrize,
            score: finalScore
          })
        });
      } catch (error) {
        console.error("Failed to save score:", error);
      }
    }
    
    this.clearState(); // Clear the game from localStorage
  },

  // ------------------- Lifelines -------------------

  use5050: function (btn) {
    // --- NEW CHECKS ---
    if (this.currentQuestionIndex < 3) {
        alert("Lifelines are available after Question 3!");
        return;
    }
    if (this.gameState.lifelinesUsed["5050"]) return;
    // --- END NEW CHECKS ---

    this.gameState.lifelinesUsed["5050"] = true;
    btn.classList.add("used");
    this.saveState();

    const q = this.gameQuestions[this.currentQuestionIndex];
    const answers = this.Elements.answersEl.querySelectorAll(".option-button");

    let wrongIndexes = [];
    answers.forEach((btn, idx) => {
      if (idx !== q.correct) wrongIndexes.push(idx);
    });

    const hideIndexes = wrongIndexes.sort(() => 0.5 - Math.random()).slice(0, 2);
    hideIndexes.forEach((i) => {
      answers[i].classList.add("disabled"); // Use new class
      answers[i].disabled = true; // Also disable it
    });
  },

  usePhone: function (btn) {
    // --- NEW CHECKS ---
    if (this.currentQuestionIndex < 3) {
        alert("Lifelines are available after Question 3!");
        return;
    }
    if (this.gameState.lifelinesUsed.phone) return;
    // --- END NEW CHECKS ---

    this.pauseTimer(); // <-- ADDED: Stop the clock

    this.gameState.lifelinesUsed.phone = true;
    btn.classList.add("used");
    this.saveState();
    
    // --- MODIFIED LOGIC ---
    const statusEl = document.getElementById('phone-modal-status');
    const closeBtn = document.getElementById('phone-modal-close');

    statusEl.textContent = "Calling... ☎️ The game is paused. Make your call manually. Press OK to resume.";
    closeBtn.style.display = 'inline-block'; // Show close button
    this.showModal('phone-modal');
    // --- END MODIFIED LOGIC ---
  },

  usePoll: function (btn) {
    // --- NEW CHECKS ---
    if (this.currentQuestionIndex < 3) {
        alert("Lifelines are available after Question 3!");
        return;
    }
    if (this.gameState.lifelinesUsed.poll) return;
    // --- END NEW CHECKS ---

    this.pauseTimer(); // <-- ADDED: Stop the clock
    
    this.gameState.lifelinesUsed.poll = true;
    btn.classList.add("used");
    this.saveState();

    const q = this.gameQuestions[this.currentQuestionIndex];
    const labels = ["A", "B", "C", "D"];
    let votes = [0, 0, 0, 0];
    
    // Give correct answer a big boost
    votes[q.correct] = Math.floor(Math.random() * 30) + 40; // 40-69%
    let remaining = 100 - votes[q.correct];

    // Distribute remaining votes
    for (let i = 0; i < 4; i++) {
        if (i === q.correct) continue;
        let val = Math.floor(Math.random() * remaining);
        votes[i] = val;
        remaining -= val;
    }
    // Add any leftovers to a random wrong answer
    let randomWrong = Math.floor(Math.random() * 4);
    while(randomWrong === q.correct) randomWrong = Math.floor(Math.random() * 4);
    votes[randomWrong] += remaining;

    this.showModal('poll-modal');
    
    // Animate bars
    labels.forEach((label, idx) => {
        const bar = document.getElementById(`poll-bar-${label}`);
        const percent = bar.querySelector('.poll-bar-percent');
        
        setTimeout(() => {
             percent.textContent = `${votes[idx]}%`;
             bar.style.height = `${votes[idx] * 2}px`; // 2px per %
        }, idx * 100); // Stagger animation
    });
  },
  
  updateLifelineUI: function() {
      if (this.gameState.lifelinesUsed["5050"]) document.getElementById('lifeline-5050').classList.add('used');
      if (this.gameState.lifelinesUsed.phone) document.getElementById('lifeline-phone').classList.add('used');
      if (this.gameState.lifelinesUsed.poll) document.getElementById('lifeline-poll').classList.add('used');
  },

  // ------------------- Helpers -------------------

  // --- NEW TIMER FUNCTIONS ---
  pauseTimer: function () {
    clearInterval(this.timerInterval);
    this.clockAudio.pause();
  },

  resumeTimer: function () {
    if (this.gameInProgress && this.timeLeft > 0) { // Only resume if game is on
        this.clockAudio.play();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.Elements.timerEl.textContent = `⏳ Time Left: ${this.timeLeft}s`;
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.clockAudio.pause();
                this.wrongAudio.play();
                this.endGame(false, "⏰ Time's up! Game Over.");
            }
        }, 1000);
    }
  },

  startTimer: function () {
    this.timeLeft = 45; // Reset time
    this.Elements.timerEl.textContent = `⏳ Time Left: ${this.timeLeft}s`;
    
    // Stop any existing timer before starting a new one
    this.pauseTimer();
    this.clockAudio.currentTime = 0;

    this.resumeTimer(); // Use resumeTimer to start the clock
  },
  // --- END NEW TIMER FUNCTIONS ---

  highlightPrizeStep: function () {
    this.Elements.prizeLadderEl.innerHTML = "";
    for (let i = this.prizeList.length - 1; i >= 0; i--) {
      const div = document.createElement("div");
      div.className = "prize-step";
      if (i === this.currentQuestionIndex) div.classList.add("active-step");
      if (this.safeHavenIndexes.includes(i)) div.classList.add("safe-haven");
      div.textContent = `Q${i + 1}: ${this.prizeList[i]}`;
      this.Elements.prizeLadderEl.appendChild(div);
    }
  },

  showModal: function (modalId) {
    document.getElementById(modalId).classList.add("visible");
  },

  closeModal: function (modalId) {
    document.getElementById(modalId).classList.remove("visible");

    // --- NEW LOGIC ---
    // Resume timer if it's a lifeline modal
    if (modalId === 'phone-modal' || modalId === 'poll-modal') {
        this.resumeTimer();
    }
    // --- END NEW LOGIC ---
  },

  // --- Persistent State ---
  saveState: function () {
    const stateToSave = {
        gameState: this.gameState,
        gameQuestions: this.gameQuestions,
        gameInProgress: this.gameInProgress
    };
    localStorage.setItem("kbcGameState", JSON.stringify(stateToSave));
  },

  loadState: function () {
    const savedState = localStorage.getItem("kbcGameState");
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            this.gameState = state.gameState;
            this.gameQuestions = state.gameQuestions;
            this.gameInProgress = state.gameInProgress;
        } catch(e) {
            console.error("Error parsing saved state:", e);
            this.clearState();
        }
    }
  },

  clearState: function () {
    localStorage.removeItem("kbcGameState");
    this.gameInProgress = false;
  },
};

// --- Start the application ---
KBC.init();