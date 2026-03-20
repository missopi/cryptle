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

// Ascertain current game difficulty
function getGameModeLabel(pathname = window.location.pathname) {
  const currentPage = pathname.split("/").pop();
  if (currentPage === "easy_game.html") return "easy";
  if (currentPage === "hard_game.html") return "hard";
  return "medium";
}

// Tracking which game the user has done for the completion data
function getDailyCompletionStorageKey(date = new Date()) {
  const difficulty = getGameModeLabel();
  const dateKey = window.CryptleGameLogic?.getDateKey?.(date);
  return `${DAILY_COMPLETION_KEY_PREFIX}:${dateKey}:${difficulty}`;
}

// Daily completion marked so that the user only completes the code once each day and is locked
function markTodayCompleted() {
  localStorage.setItem(getDailyCompletionStorageKey(), "true");
}

function hasCompletedToday() {
  return localStorage.getItem(getDailyCompletionStorageKey()) === "true";
}

function syncShareVisibility() {
  const shareContainer = document.getElementById("share-results-container");
  if (!shareContainer) return;
  shareContainer.classList.toggle("hidden", hasCompletedToday());
}

function applyDailyCompletionLock() {
  if (!hasCompletedToday()) return false;

  isDailyLockActive = true;

  const gameOverMessage = document.getElementById("game-over-message");
  const dailyCodeContainer = document.getElementById("daily-code-container");
  const gameCodeboard = document.querySelector(".game-codeboard");
  const gameBoardContainer = document.querySelector(".game-board-container");
  const codeboardElementsToHide = document.querySelectorAll(
    ".codeboard-row, .code-actions-row",
  );

  if (gameOverMessage) {
    gameOverMessage.textContent = "You already completed today's game. Come back tomorrow.";
  }

  dailyCodeContainer?.classList.remove("hidden");
  gameCodeboard?.classList.add("game-over");
  if (gameBoardContainer) {
    gameBoardContainer.style.display = "none";
  }
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
  applyDailyCompletionLock();
  syncShareVisibility();
  setupSettingsMenu();
  renderDailyCodeDisplay();
  setupShareResults();
  document.addEventListener("click", handleCodeboardTileClick);

  // Delete button: remove the last filled tile in the current editable row.
  const deleteButton = document.getElementById("delete-button");
  deleteButton?.addEventListener("click", () => {
    if (isDailyLockActive) return;
    window.CryptleGameLogic?.deleteLastFilledTileInActiveRow();
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
  const modeLabel = getGameModeLabel();
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
    url: window.location.href,
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
