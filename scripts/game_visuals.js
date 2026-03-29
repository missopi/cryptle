// UI wiring for game interactions. Depends on window.CryptleGameLogic.

const THEME_STORAGE_KEY = "cryptle-game-theme";
const CONTRAST_STORAGE_KEY = "cryptle-game-contrast";
const SHARE_SYMBOLS_BY_STATE = {
  correct: "🟥",
  almost: "⬜",
  incorrect: "⬛",
};
const DAILY_COMPLETION_KEY_PREFIX = "cryptle:completed";
let isDailyLockActive = false;

// Tracking which game the user has done for the completion data
function getDailyCompletionStorageKey(date = new Date()) {
  const difficulty = window.CryptleGameLogic?.getGameDifficultyLabel?.();
  const dateKey = window.CryptleGameLogic?.getDateKey?.(date);
  return `${DAILY_COMPLETION_KEY_PREFIX}:${dateKey}:${difficulty}`;
}

// Daily completion marked so that the user only completes the code once each day and is locked
function markTodayCompleted() {
  persistDailyState({
    completed: true,
  });
}

function hasCompletedToday() {
  return getSavedDailyState()?.completed === true;
}

function persistDailyState(nextState) {
  const savedState = getSavedDailyState();
  localStorage.setItem(
    getDailyCompletionStorageKey(),
    JSON.stringify({
      ...savedState,
      ...nextState,
    }),
  );
}

function getSavedDailyState() {
  const completionKey = getDailyCompletionStorageKey();
  const savedState = localStorage.getItem(completionKey);
  if (!savedState) return null;

  try {
    return JSON.parse(savedState);
  } catch (error) {
    localStorage.removeItem(completionKey);
    return null;
  }
}

function getBoardSnapshot() {
  return Array.from(document.querySelectorAll(".game-row")).map((row) => {
    const tiles = Array.from(row.querySelectorAll(".game-tile")).map((tile) => ({
      state: tile.dataset.state,
      fixed: tile.dataset.fixed === "true",
    }));
    const pegs = Array.from(row.querySelectorAll(".game-peg")).map((peg) => peg.dataset.state);

    return {
      locked: row.dataset.locked === "true",
      tiles,
      pegs,
    };
  });
}

function persistBoardState() {
  persistDailyState({
    rows: getBoardSnapshot(),
  });
}

function restoreBoardState() {
  const savedState = getSavedDailyState();
  if (!savedState?.rows) return;

  const rows = Array.from(document.querySelectorAll(".game-row"));
  savedState.rows.forEach((savedRow, rowIndex) => {
    const row = rows[rowIndex];
    if (!row) return;

    row.dataset.locked = savedRow.locked ? "true" : "false";

    const tiles = Array.from(row.querySelectorAll(".game-tile"));
    savedRow.tiles?.forEach((savedTile, tileIndex) => {
      const tile = tiles[tileIndex];
      if (!tile) return;

      tile.dataset.state = savedTile?.state ?? "empty";
      if (savedTile?.fixed) {
        tile.dataset.fixed = "true";
      } else {
        delete tile.dataset.fixed;
      }
    });

    const pegs = Array.from(row.querySelectorAll(".game-peg"));
    savedRow.pegs?.forEach((pegState, pegIndex) => {
      const peg = pegs[pegIndex];
      if (!peg) return;

      peg.dataset.state = pegState ?? "empty";
    });
  });

  window.CryptleGameLogic?.syncActiveRowSelection?.();
}

function hasShareableResult() {
  return document.querySelector('.game-row[data-locked="true"]') !== null;
}

function syncShareVisibility() {
  const shareContainer = document.getElementById("share-results-container");
  if (!shareContainer) return;
  shareContainer.classList.toggle("hidden", !hasShareableResult());
}

function applyDailyCompletionLock() {
  if (!hasCompletedToday()) return false;

  isDailyLockActive = true;

  const gameOverMessage = document.getElementById("game-over-message");
  const dailyCodeContainer = document.getElementById("daily-code-container");
  const gameCodeboard = document.querySelector(".game-codeboard");
  const codeboardElementsToHide = document.querySelectorAll(
    ".codeboard-row, .code-actions-row",
  );

  if (gameOverMessage) {
    gameOverMessage.textContent = "You already completed today's game. Come back tomorrow.";
  }

  dailyCodeContainer?.classList.remove("hidden");
  gameCodeboard?.classList.add("game-over");

  codeboardElementsToHide.forEach((element) => {
    element.style.display = "none";
  });

  return true;
}

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getPreferredContrast() {
  const savedContrast = localStorage.getItem(CONTRAST_STORAGE_KEY);
  if (savedContrast === "high" || savedContrast === "normal") {
    return savedContrast;
  }

  return window.matchMedia("(prefers-contrast: more)").matches ? "high" : "normal";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyContrast(contrast) {
  document.documentElement.dataset.contrast = contrast;
  localStorage.setItem(CONTRAST_STORAGE_KEY, contrast);
}

function setupSettingsMenu() {
  const settingsMenu = document.querySelector(".settings-menu");
  const settingsButton = document.getElementById("settings-cog-button");
  const settingsCloseButton = document.getElementById("settings-close-button");
  const settingsDropdown = document.getElementById("settings-dropdown");
  const howToPlayButton = document.getElementById("how-to-play-button");
  const howToPlayModal = document.getElementById("how-to-play-modal");
  const howToPlayCloseButton = document.getElementById("how-to-play-close-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const highContrastModeToggle = document.getElementById("high-contrast-mode-toggle");
  let lastTrigger = null;

  if (
    !settingsMenu ||
    !settingsButton ||
    !settingsCloseButton ||
    !settingsDropdown ||
    !howToPlayButton ||
    !howToPlayModal ||
    !howToPlayCloseButton ||
    !darkModeToggle ||
    !highContrastModeToggle
  ) {
    return;
  }

  const startingTheme = getPreferredTheme();
  const startingContrast = getPreferredContrast();
  applyTheme(startingTheme);
  applyContrast(startingContrast);
  darkModeToggle.checked = startingTheme === "dark";
  highContrastModeToggle.checked = startingContrast === "high";

  const setMenuState = (isOpen) => {
    settingsDropdown.classList.toggle("hidden", !isOpen);
    settingsButton.setAttribute("aria-expanded", String(isOpen));
    settingsDropdown.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      lastTrigger = settingsButton;
      settingsCloseButton.focus();
    } else if (lastTrigger === settingsButton) {
      settingsButton.focus();
    }
  };

  const setHowToPlayState = (isOpen) => {
    howToPlayModal.classList.toggle("hidden", !isOpen);
    howToPlayModal.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      lastTrigger = howToPlayButton;
      howToPlayCloseButton.focus();
    } else if (lastTrigger === howToPlayButton) {
      howToPlayButton.focus();
    }
  };

  settingsButton.addEventListener("click", () => {
    const isCurrentlyOpen = !settingsDropdown.classList.contains("hidden");
    setMenuState(!isCurrentlyOpen);
    if (!isCurrentlyOpen) {
      setHowToPlayState(false);
    }
  });

  settingsCloseButton.addEventListener("click", () => {
    setMenuState(false);
  });

  howToPlayButton.addEventListener("click", () => {
    setMenuState(false);
    setHowToPlayState(true);
  });

  howToPlayCloseButton.addEventListener("click", () => {
    setHowToPlayState(false);
    settingsButton.focus();
  });

  darkModeToggle.addEventListener("change", () => {
    applyTheme(darkModeToggle.checked ? "dark" : "light");
  });

  highContrastModeToggle.addEventListener("change", () => {
    applyContrast(highContrastModeToggle.checked ? "high" : "normal");
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = settingsMenu.contains(event.target);
    const clickedInsideHowToPlay = howToPlayModal.contains(event.target);
    if (!clickedInsideMenu && !clickedInsideHowToPlay) {
      setMenuState(false);
      setHowToPlayState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
      setHowToPlayState(false);
      settingsButton.focus();
    }
  });

  setHowToPlayState(!isDailyLockActive);
}

// Handle clicks on the codeboard tiles.
function handleCodeboardTileClick(event) {
  if (isDailyLockActive) return;

  const clickedTile = event.target.closest(".codeboard-tile");
  if (!clickedTile) return;

  const selectedColour = clickedTile.dataset.key;
  const gameLogic = window.CryptleGameLogic;
  if (!gameLogic) return;
  if (!gameLogic.VALID_TILE_STATES.has(selectedColour)) return;

  gameLogic.fillFirstEmptyTileInActiveRow(selectedColour);
  persistBoardState();
}

function handleGameTileClick(event) {
  if (isDailyLockActive) return;

  const clickedTile = event.target.closest(".game-tile");
  if (!clickedTile) return;

  const activeRow = window.CryptleGameLogic?.getActiveRow?.();
  if (!activeRow || !activeRow.contains(clickedTile)) return;
  if (clickedTile.dataset.fixed === "true") return;

  const tiles = Array.from(activeRow.querySelectorAll(".game-tile"));
  const clickedTileIndex = tiles.indexOf(clickedTile);
  if (clickedTileIndex === -1) return;

  window.CryptleGameLogic?.selectTileInActiveRow?.(clickedTileIndex);
  persistBoardState();
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
    colourDot.setAttribute("role", "img");
    colourDot.setAttribute("aria-label", colour);
    display.appendChild(colourDot);
  });
}

// Wire all click handlers once after the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  restoreBoardState();
  applyDailyCompletionLock();
  window.CryptleGameLogic?.syncActiveRowSelection?.();
  syncShareVisibility();
  setupSettingsMenu();
  renderDailyCodeDisplay();
  setupShareResults();
  document.addEventListener("click", handleCodeboardTileClick);
  document.addEventListener("click", handleGameTileClick);

  // Delete button: remove the last filled tile in the current editable row.
  const deleteButton = document.getElementById("delete-button");
  deleteButton?.addEventListener("click", () => {
    if (isDailyLockActive) return;
    window.CryptleGameLogic?.deleteLastFilledTileInActiveRow();
    persistBoardState();
  });

  // Enter button: submit the current completed row.
  const enterButton = document.getElementById("enter-button");
  enterButton?.addEventListener("click", () => {
    if (isDailyLockActive) return;
    const submission = window.CryptleGameLogic?.submitActiveRow();

    if (!submission) {
      return;
    }

    returnPegFeedback(submission.row, submission.comparison);
    window.CryptleGameLogic?.syncActiveRowSelection?.();
    persistBoardState();

    if (isGameOver(submission.comparison)) {
      onGameOver(submission.comparison);
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
    states.push("incorrect");
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

function onGameOver(comparison) {
  isDailyLockActive = true;
  const gameLogic = window.CryptleGameLogic;
  const gameOverMessage = document.getElementById("game-over-message");
  const codeLength = gameLogic?.DAILY_TARGET_CODE.length ?? 0;
  const isWinningGuess = comparison?.sameOrderCount === codeLength;

  if (gameOverMessage) {
    if (isWinningGuess) {
      gameOverMessage.innerHTML =
        '<span class="game-over-title">Congratulations!</span> <span class="game-over-subtext">You guessed today&apos;s code.</span>';
    } else {
      gameOverMessage.textContent = "You didn't crack today's code. Try again tomorrow.";
    }
  }
  const dailyCodeContainer = document.getElementById("daily-code-container");
  const gameCodeboard = document.querySelector(".game-codeboard");

  dailyCodeContainer?.classList.remove("hidden");
  gameCodeboard?.classList.add("game-over");

  const codeboardElementsToHide = document.querySelectorAll(
    ".codeboard-row, .code-actions-row",
  );

  codeboardElementsToHide.forEach((element) => {
    element.style.display = "none";
  });

  markTodayCompleted();
  persistBoardState();
  syncShareVisibility();
}

// Functions for sharing game data
function getShareResultLabel() {
  const gameLogic = window.CryptleGameLogic;
  if (!gameLogic) return "X/6";

  const lockedRows = Array.from(document.querySelectorAll('.game-row[data-locked="true"]'));
  const winningIndex = lockedRows.findIndex((row) => {
    const rowColours = Array.from(row.querySelectorAll(".game-tile")).map((tile) => {
      return tile.dataset.state;
    });
    return rowColours.every((colour, index) => colour === gameLogic.DAILY_TARGET_CODE[index]);
  });

  if (winningIndex === -1) return "X/6";
  return `${winningIndex + 1}/6`;
}

function mapPegStateToShareSymbol(pegState) {
  return SHARE_SYMBOLS_BY_STATE[pegState] ?? SHARE_SYMBOLS_BY_STATE.incorrect;
}

function getShareGridRows() {
  const lockedRows = Array.from(document.querySelectorAll('.game-row[data-locked="true"]'));
  return lockedRows.map((row) => {
    const pegs = Array.from(row.querySelectorAll(".game-peg"));
    return pegs.map((peg) => mapPegStateToShareSymbol(peg.dataset.state)).join("");
  });
}

function buildShareText() {
  const modeLabel = window.CryptleGameLogic?.getGameDifficultyLabel?.();
  const resultLabel = getShareResultLabel();
  const gridRows = getShareGridRows();
  const gridText = gridRows.join("\n");

  return `Cryptle ${modeLabel} ${resultLabel}\n${gridText}`;
}

async function copyShareTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const fallbackTextArea = document.createElement("textarea");
  fallbackTextArea.value = text;
  fallbackTextArea.setAttribute("readonly", "");
  fallbackTextArea.style.position = "absolute";
  fallbackTextArea.style.left = "-9999px";
  document.body.appendChild(fallbackTextArea);
  fallbackTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(fallbackTextArea);
}

async function shareResults(text) {
  const shareData = {
    title: "Cryptle",
    text,
  };

  if (navigator.share) {
    if (!navigator.canShare || navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return "shared";
    }
  }

  await copyShareTextToClipboard(text);
  return "copied";
}

function setupShareResults() {
  const shareButton = document.getElementById("share-results-button");
  const shareFeedback = document.getElementById("share-results-feedback");
  if (!shareButton || !shareFeedback) return;

  shareButton.addEventListener("click", async () => {
    const shareText = buildShareText();

    try {
      const result = await shareResults(shareText);
      shareFeedback.textContent =
        result === "shared"
          ? "Opened share options."
          : "Copied result to clipboard.";
    } catch (error) {
      if (error?.name === "AbortError") {
        shareFeedback.textContent = "";
        return;
      }

      shareFeedback.textContent = "Unable to copy right now. Please try again.";
    }
  });
}
