// UI wiring for game interactions. Depends on window.CryptleGameLogic.

// Handle clicks on the codeboard tiles.
function handleCodeboardTileClick(event) {
  const clickedTile = event.target.closest(".codeboard-tile");
  if (!clickedTile) return;

  const selectedColour = clickedTile.dataset.key;
  const gameLogic = window.CryptleGameLogic;
  if (!gameLogic) return;
  if (!gameLogic.VALID_TILE_STATES.has(selectedColour)) return;

  gameLogic.fillFirstEmptyTileInActiveRow(selectedColour);
}

// Show the daily target code. This is currently just for testing but will be shown at the end of the game in the final version. Each colour in the code is represented by a dot with a corresponding aria-label for accessibility.
function renderDailyCodeDisplay() {
  const display = document.getElementById("daily-code-display");
  const gameLogic = window.CryptleGameLogic;
  if (!display || !gameLogic) return;

  display.textContent = "";

  gameLogic.DAILY_TARGET_CODE.forEach((colour) => {
    const colourDot = document.createElement("span");
    colourDot.className = "daily-code-dot";
    colourDot.dataset.state = colour;
    colourDot.setAttribute("aria-label", colour);
    display.appendChild(colourDot);
  });
}

// Wire all click handlers once after the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  renderDailyCodeDisplay();
  document.addEventListener("click", handleCodeboardTileClick);

  // Delete button: remove the last filled tile in the current editable row.
  const deleteButton = document.getElementById("delete-button");
  deleteButton?.addEventListener("click", () => {
    window.CryptleGameLogic?.deleteLastFilledTileInActiveRow();
  });

  // Enter button: submit the current completed row.
  const enterButton = document.getElementById("enter-button");
  enterButton?.addEventListener("click", () => {
    const submission = window.CryptleGameLogic?.submitActiveRow();

    if (!submission) {
      return;
    }

    returnPegFeedback(submission.row, submission.comparison);

    if (isGameOver(submission.comparison)) {
      onGameOver();
    }
  });
});

// Return feedback for code comparison
function returnPegFeedback(row, comparison) {
  if (!row) return;

  const pegs = Array.from(row.querySelectorAll(".game-peg"));
  if (pegs.length === 0) return;

  if (!comparison) return;

  const sameOrderCount = Math.max(0, comparison.sameOrderCount ?? 0);
  const differentOrderCount = Math.max(0, comparison.differentOrderCount ?? 0);
  const feedbackStates = buildFeedbackStates(pegs.length, sameOrderCount, differentOrderCount);

  pegs.forEach((peg, index) => {
    peg.dataset.state = feedbackStates[index];
  });
}

// Return correct and almost states of pegs
function buildFeedbackStates(pegCount, sameOrderCount, differentOrderCount) {
  const clampedSameOrderCount = Math.min(sameOrderCount, pegCount);
  const remainingSlots = pegCount - clampedSameOrderCount;
  const clampedDifferentOrderCount = Math.min(differentOrderCount, remainingSlots);

  const states = [];
  states.push(...Array(clampedSameOrderCount).fill("correct"));
  states.push(...Array(clampedDifferentOrderCount).fill("almost"));

  while (states.length < pegCount) {
    states.push("empty");
  }

  return states;
}

function isGameOver(comparison) {
  const gameLogic = window.CryptleGameLogic;
  if (!gameLogic || !comparison) return false;

  const codeLength = gameLogic.DAILY_TARGET_CODE.length;
  const isWinningGuess = comparison.sameOrderCount === codeLength;
  if (isWinningGuess) return true;

  const totalRows = document.querySelectorAll(".game-row").length;
  const lockedRows = document.querySelectorAll('.game-row[data-locked="true"]').length;
  const allGuessesUsed = lockedRows >= totalRows;

  return allGuessesUsed;
}

function onGameOver() {
  const dailyCodeContainer = document.getElementById("daily-code-container");
  dailyCodeContainer?.classList.remove("hidden");
}
