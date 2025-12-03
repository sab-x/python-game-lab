// --- ENDPOINTS ---
const endpoints = {
  roll: "/api/roll",
  state: "/api/state",
  reset: "/api/reset"
};

// --- ELEMENTS ---
const el = {
  btnSolo: document.getElementById("btnSolo"),
  btnVsComputer: document.getElementById("btnVsComputer"),
  btnTwoPlayer: document.getElementById("btnTwoPlayer"),
  rollBtn: document.getElementById("rollBtn"),
  rollP1Btn: document.getElementById("rollP1Btn"),
  rollP2Btn: document.getElementById("rollP2Btn"),
  resetBtn: document.getElementById("resetBtn"),
  diceArea1: document.getElementById("diceArea1"),
  diceArea2: document.getElementById("diceArea2"),
  message: document.getElementById("message"),
  history: document.getElementById("historyList"),
  miniTotal: document.getElementById("miniTotal"),
  miniHigh: document.getElementById("miniHigh"),
  p1Info: document.getElementById("p1Info"),
  p2Info: document.getElementById("p2Info"),
  player1Label: document.getElementById("player1Label"),
  player2Label: document.getElementById("player2Label")
};

let mode = "solo";
let diceCount = 1;

// ✅ NEW: Track rounds and game state locally
let currentRound = 0;
let gameOver = false;

// --- MODE BUTTONS ---
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    adaptActionButtons();
    resetLocalUI();
    currentRound = 0; // reset counter on mode change
    gameOver = false;
  });
});

// --- DICE COUNT BUTTONS ---
document.querySelectorAll(".count-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".count-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    diceCount = parseInt(btn.dataset.count);
    resetDicePlaceholders();
  });
});

el.rollBtn.addEventListener("click", () => handleRoll());
el.rollP1Btn.addEventListener("click", () => handleRollTwoPlayer(1));
el.rollP2Btn.addEventListener("click", () => handleRollTwoPlayer(2));
el.resetBtn.addEventListener("click", handleReset);

// --- HELPERS ---
function adaptActionButtons() {
  if (mode === "two_player") {
    el.rollBtn.classList.add("hidden");
    el.rollP1Btn.classList.remove("hidden");
    el.rollP2Btn.classList.remove("hidden");
  } else {
    el.rollBtn.classList.remove("hidden");
    el.rollP1Btn.classList.add("hidden");
    el.rollP2Btn.classList.add("hidden");
  }
}

function resetDicePlaceholders() {
  el.diceArea1.innerHTML = "";
  el.diceArea2.innerHTML = "";
  for (let i = 0; i < diceCount; i++) {
    el.diceArea1.innerHTML += "<div class='die'>🎲</div>";
    el.diceArea2.innerHTML += "<div class='die'>🎲</div>";
  }
}

function resetLocalUI() {
  el.history.innerHTML = "";
  el.message.textContent = "Choose mode and roll!";
  el.miniTotal.textContent = "0";
  el.miniHigh.textContent = "0";
  el.p1Info.textContent = "";
  el.p2Info.textContent = "";
  currentRound = 0;  // reset rounds on game reset
  gameOver = false;
  enableRollButtons();
  resetDicePlaceholders();
  updateLabels();
}

function updateLabels() {
  if (mode === "vs_computer") {
    el.player1Label.textContent = "You 🎯";
    el.player2Label.textContent = "Computer 💻";
    el.diceArea2.parentElement.style.display = "flex";
  } else if (mode === "two_player") {
    el.player1Label.textContent = "Player 1 🧑";
    el.player2Label.textContent = "Player 2 👩";
    el.diceArea2.parentElement.style.display = "flex";
  } else {
    el.player1Label.textContent = "You 🎯";
    el.player2Label.textContent = "";
    el.diceArea2.parentElement.style.display = "none";
  }
}

function disableRollButtons() {
  el.rollBtn.disabled = true;
  el.rollP1Btn.disabled = true;
  el.rollP2Btn.disabled = true;
}

function enableRollButtons() {
  el.rollBtn.disabled = false;
  el.rollP1Btn.disabled = false;
  el.rollP2Btn.disabled = false;
}

const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
function showDice(area, diceVals) {
  area.innerHTML = "";
  diceVals.forEach(v => {
    const d = document.createElement("div");
    d.className = "die roll";
    d.textContent = faces[v - 1];
    area.appendChild(d);
  });
}

// helper to build clean description strings (no brackets)
function makeDescForVsComputer(roundNum, ev) {
  // ev.player.sum and ev.opponent.sum are numbers
  return `Round ${roundNum}: You rolled ${ev.player.sum} | Computer rolled ${ev.opponent.sum}`;
}
function makeDescForSolo(roundNum, ev) {
  return `Round ${roundNum}: You rolled ${ev.player.sum}`;
}
function makeDescForTwoPlayer(roundNum, player, ev) {
  // For two_player the server returns ev.player.sum for the current player's roll
  return `Round ${roundNum}: Player ${player} rolled ${ev.player.sum}`;
}

// --- ROLL HANDLER ---
async function handleRoll() {
  if (gameOver) return;

  try {
    const res = await fetch(endpoints.roll, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, number_of_dice: diceCount })
    });

    // always try to parse JSON; server returns 200 even on game-over responses
    const json = await res.json();
    const ev = json.event;
    const stats = json.stats;

    // increment round only if backend accepted the roll (i.e., when backend increments its rounds)
    // backend uses stats.rounds to indicate server-side rounds; use that to sync round counter
    // prefer server rounds if present, otherwise increment local counter
    if (typeof stats?.rounds === "number") {
      currentRound = stats.rounds;
    } else {
      currentRound++;
    }

    // If backend signalled game over (it returns an event with winner when rounds >= 5)
    if (ev.winner && stats.rounds >= 5) {
      // build a clean final message (no brackets)
      let finalDesc = "";
      if (mode === "vs_computer") {
        // server event.desc may contain arrays; create our own clean message
        if (ev.player && ev.opponent) finalDesc = makeDescForVsComputer(currentRound, ev);
      } else if (mode === "two_player") {
        // can't know which player triggered final on backend; use the winner text
        finalDesc = `Round ${currentRound}: ${ev.desc || "Final round"}`;
      } else {
        if (ev.player) finalDesc = makeDescForSolo(currentRound, ev);
      }

      // Show final winner and log the final round cleanly
      el.message.textContent = `🏁 GAME OVER — Winner: ${String(ev.winner).toUpperCase()}`;
      if (finalDesc) addHistory(finalDesc);
      disableRollButtons();
      gameOver = true;
      // also update stats and UI one last time
      updateStats(stats);
      return;
    }

    // Normal successful roll handling
    if (mode === "vs_computer") {
      // show dice and clean message
      if (ev.player && ev.opponent) {
        showDice(el.diceArea1, ev.player.dice);
        showDice(el.diceArea2, ev.opponent.dice);
        el.message.textContent =
          ev.winner === "you" ? "🎉 You win!" :
          ev.winner === "computer" ? "💻 Computer wins!" : "🤝 Tie!";
        addHistory(makeDescForVsComputer(currentRound, ev));
      }
    } else {
      // solo mode
      if (ev.player) {
        showDice(el.diceArea1, ev.player.dice);
        el.message.textContent = `You rolled ${ev.player.sum}`;
        addHistory(makeDescForSolo(currentRound, ev));
      }
    }

    updateStats(stats);

  } catch (err) {
    // only show network error if fetch/parsing actually failed
    el.message.textContent = "Network or server error.";
    console.error("handleRoll error:", err);
  }
}

async function handleRollTwoPlayer(player) {
  if (gameOver) return;

  try {
    const res = await fetch(endpoints.roll, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "two_player", number_of_dice: diceCount, player })
    });

    const json = await res.json();
    const ev = json.event;
    const stats = json.stats;

    // sync round number with server if available
    if (typeof stats?.rounds === "number") {
      currentRound = stats.rounds;
    } else {
      currentRound++;
    }

    // If backend declares game over
    if (ev.winner && stats.rounds >= 5) {
      el.message.textContent = `🏁 GAME OVER — Winner: ${String(ev.winner).toUpperCase()}`;
      // build a clean final desc: prefer server ev.player.sum if present
      if (ev.player) addHistory(makeDescForTwoPlayer(currentRound, player, ev));
      disableRollButtons();
      gameOver = true;
      updateStats(stats);
      return;
    }

    // Normal two-player update
    if (ev.player) {
      if (player === 1) showDice(el.diceArea1, ev.player.dice);
      else showDice(el.diceArea2, ev.player.dice);

      el.message.textContent = `Player ${player} rolled ${ev.player.sum}`;
      addHistory(makeDescForTwoPlayer(currentRound, player, ev));
    }

    updateStats(stats);

  } catch (err) {
    el.message.textContent = "Network or server error.";
    console.error("handleRollTwoPlayer error:", err);
  }
}

async function handleReset() {
  try {
    await fetch(endpoints.reset, { method: "POST" });
    resetLocalUI();
    fetchState();
  } catch (err) {
    el.message.textContent = "Reset failed.";
    console.error("handleReset error:", err);
  }
}

function addHistory(text) {
  const li = document.createElement("li");
  li.textContent = text;
  el.history.prepend(li);
}

function updateStats(stats) {
  if (!stats) return;
  el.miniTotal.textContent = stats.total_actions ?? el.miniTotal.textContent;
  el.miniHigh.textContent = stats.highest_sum ?? el.miniHigh.textContent;

  // Stats may or may not include playerScores; guard access
  el.p1Info.textContent = `Score: ${stats.playerScores?.["1"] ?? 0}`;
  el.p2Info.textContent = `Score: ${stats.playerScores?.["2"] ?? 0}`;
}

async function fetchState() {
  try {
    const res = await fetch(endpoints.state);
    const json = await res.json();
    updateStats(json);
    // sync currentRound with server if it had a value
    if (typeof json.rounds === "number") currentRound = json.rounds;
  } catch (err) {
    console.error("fetchState error:", err);
  }
}

// --- INIT ---
adaptActionButtons();
resetLocalUI();
fetchState();
