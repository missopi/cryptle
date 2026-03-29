// Core game logic and state helpers.


// Colors used for the game tiles and daily codes
const STANDARD_TILE_STATES = [
  "pink",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
];
const HARD_MODE_EXTRA_TILE_STATES = ["red"];

// Hard mode uses 1 additional colour
function isHardGameMode(pathname = window.location.pathname) {
  return pathname.split("/").pop() === "hard_game.html";
}

function getGameDifficultyLabel(pathname = window.location.pathname) {
  const currentPage = pathname.split("/").pop();
  if (currentPage === "easy_game.html") return "easy";
  if (currentPage === "hard_game.html") return "hard";
  return "medium";
}

function getTileStatesForMode(isHardMode = isHardGameMode()) {
  return isHardMode
    ? [...STANDARD_TILE_STATES, ...HARD_MODE_EXTRA_TILE_STATES]
    : [...STANDARD_TILE_STATES];
}

const VALID_TILE_STATES = new Set(getTileStatesForMode());

// Logic for generating the daily target code. The code is generated based on the current date, so it changes daily but is the same for all players on the same day.
// Get a string key in the format "YYYY-MM-DD". Defaults to today's date.
function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Hash a string to a seed number. Uses the FNV-1a hash algorithm.
function hashStringToSeed(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Create a seeded random number generator using the Mulberry32 algorithm.
function createRandomNumberGenerator(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns the daily 4-colour code for the current difficulty (repeats allowed).
function getDailyTargetCode(
  date = new Date(),
  difficulty = getGameDifficultyLabel(),
) {
  const dateKey = getDateKey(date);
  const isHardMode = difficulty === "hard";
  const seed = hashStringToSeed(`cryptle:${difficulty}:${dateKey}`);
  const random = createRandomNumberGenerator(seed);

  const colours = getTileStatesForMode(isHardMode);
  const dailyCode = [];

  for (let i = 0; i < 4; i += 1) {
    const randomIndex = Math.floor(random() * colours.length);
    dailyCode.push(colours[randomIndex]);
  }

  return dailyCode;
}


// Functions for managing the game state in the UI. These functions manage filling tiles and deleting tiles based on user interactions.
function getRows() {
  return Array.from(document.querySelectorAll(".game-row"));
}

function isRowLocked(row) {
  return row?.dataset.locked === "true";
}

function isRowComplete(row) {
  if (!row) return false;
  return !row.querySelector('.game-tile[data-state="empty"]');
}

function getRowColours(row) {
  const tiles = Array.from(row.querySelectorAll(".game-tile"));
  return tiles.map((tile) => tile.dataset.state);
}

function getRowTiles(row) {
  return Array.from(row?.querySelectorAll(".game-tile") ?? []);
}

function isTileFixed(tile) {
  return tile?.dataset.fixed === "true";
}

function clearSelectedTile(row) {
  getRowTiles(row).forEach((tile) => {
    delete tile.dataset.selected;
  });
}

function getSelectedTileInRow(row) {
  const selectedTile = row?.querySelector('.game-tile[data-selected="true"]') ?? null;
  if (!selectedTile || isTileFixed(selectedTile)) return null;
  return selectedTile;
}

function findFirstEditableEmptyTile(row) {
  return (
    getRowTiles(row).find((tile) => {
      return tile.dataset.state === "empty" && !isTileFixed(tile);
    }) ?? null
  );
}

function selectTileInActiveRow(tileIndex) {
  const activeRow = getActiveRow();
  if (!activeRow) return false;

  const tiles = getRowTiles(activeRow);
  const targetTile = tiles[tileIndex];
  if (!targetTile || isTileFixed(targetTile)) return false;

  clearSelectedTile(activeRow);
  targetTile.dataset.selected = "true";
  return true;
}

function selectFirstEditableEmptyTileInActiveRow() {
  const activeRow = getActiveRow();
  if (!activeRow) return false;

  const firstEditableEmptyTile = findFirstEditableEmptyTile(activeRow);
  clearSelectedTile(activeRow);

  if (!firstEditableEmptyTile) return false;

  firstEditableEmptyTile.dataset.selected = "true";
  return true;
}

function syncActiveRowSelection() {
  const activeRow = getActiveRow();
  if (!activeRow) return false;

  const selectedTile = getSelectedTileInRow(activeRow);
  if (selectedTile) return true;

  clearSelectedTile(activeRow);
  return false;
}

// Get the currently active row, which is the first unlocked row.
function getActiveRow() {
  return getRows().find((row) => !isRowLocked(row)) ?? null;
}

// Fill the first empty tile in the active row with the given colour. Does nothing if there is no active row or if the active row is already full.
function fillFirstEmptyTileInActiveRow(colour) {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const tiles = getRowTiles(activeRow);
  const selectedTile = getSelectedTileInRow(activeRow);
  const fallbackTile = findFirstEditableEmptyTile(activeRow);
  const targetTile = selectedTile ?? fallbackTile;
  if (!targetTile) return;

  targetTile.dataset.state = colour;

  clearSelectedTile(activeRow);
}

// Delete the last filled tile only in the current active row.
function deleteLastFilledTileInActiveRow() {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const selectedTile = getSelectedTileInRow(activeRow);
  if (selectedTile && selectedTile.dataset.state !== "empty") {
    selectedTile.dataset.state = "empty";
    return;
  }

  const filledTiles = Array.from(
    activeRow.querySelectorAll(
      '.game-tile:not([data-state="empty"]):not([data-fixed="true"])'
    )
  );
  if (filledTiles.length === 0) return;

  const deletedTile = filledTiles[filledTiles.length - 1];
  deletedTile.dataset.state = "empty";
  clearSelectedTile(activeRow);
}

const DAILY_TARGET_CODE = getDailyTargetCode();
const LOCKED_CORRECT_TILES = Array(DAILY_TARGET_CODE.length).fill(null);

// Prefill function only happens on the easy game mode.
function shouldPrefillCorrectTilesForCurrentGame() {
  const currentPage = window.location.pathname.split("/").pop();
  return currentPage === "easy_game.html";
}

// Tiles that are correctly guessed are prefilled in the next active row.
function updateLockedCorrectTiles(rowColors) {
  for (let i = 0; i < DAILY_TARGET_CODE.length; i += 1) {
    if (rowColors[i] === DAILY_TARGET_CODE[i]) {
      LOCKED_CORRECT_TILES[i] = rowColors[i];
    }
  }
}

function prefillLockedCorrectTilesInActiveRow() {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const tiles = Array.from(activeRow.querySelectorAll(".game-tile"));
  tiles.forEach((tile, index) => {
    const lockedColour = LOCKED_CORRECT_TILES[index];
    if (!lockedColour) return;

    tile.dataset.state = lockedColour;
    tile.dataset.fixed = "true";
  });

  syncActiveRowSelection();
}

// Find latest completed row
function getLatestCompletedRow() {
  const rows = getRows();

  return [...rows].reverse().find((row) => {
    return isRowComplete(row);
  }) ?? null;
}

// Return colours for the currently active row if it is complete.
function returnCompletedTileRowColors(activeRow = getActiveRow()) {
  if (!activeRow || !isRowComplete(activeRow)) return null;
  return getRowColours(activeRow);
}

function submitActiveRow() {
  const activeRow = getActiveRow();
  const rowColors = returnCompletedTileRowColors(activeRow);

  if (!activeRow || !rowColors) return null;
  activeRow.dataset.locked = "true";

  const isWinningRow = rowColors.every((colour, index) => {
    return colour === DAILY_TARGET_CODE[index];
  });

  if (!isWinningRow && shouldPrefillCorrectTilesForCurrentGame()) {
    updateLockedCorrectTiles(rowColors);
    prefillLockedCorrectTilesInActiveRow();
  }

  return {
    row: activeRow,
    rowColors,
    comparison: compareCompletedCodeToDailyCode(rowColors),
  };
}

// Compare DAILY_TARGET_CODE to entered game row
function compareCompletedCodeToDailyCode(completedCode = returnCompletedTileRowColors()) {
  const dailyCode = DAILY_TARGET_CODE;

  if (!completedCode) return null;

  let sameOrderCount = 0;
  const unmatchedDailyCounts = new Map();
  const unmatchedCompleted = [];

  for (let i = 0; i < dailyCode.length; i += 1) {
    if (completedCode[i] === dailyCode[i]) {
      sameOrderCount += 1;
    } else {
      const dailyColour = dailyCode[i];
      unmatchedDailyCounts.set(
        dailyColour,
        (unmatchedDailyCounts.get(dailyColour) ?? 0) + 1
      );
      unmatchedCompleted.push(completedCode[i]);
    }
  }

  let differentOrderCount = 0;
  unmatchedCompleted.forEach((colour) => {
    const remainingCount = unmatchedDailyCounts.get(colour) ?? 0;
    if (remainingCount > 0) {
      differentOrderCount += 1;
      if (remainingCount === 1) {
        unmatchedDailyCounts.delete(colour);
      } else {
        unmatchedDailyCounts.set(colour, remainingCount - 1);
      }
    }
  });

  return {
    sameOrderCount,
    differentOrderCount,
  };
}

// Expose the game logic and state management functions so they can be accessed in game_visuals.js.
window.CryptleGameLogic = {
  VALID_TILE_STATES,
  getDateKey,
  getDailyTargetCode,
  getGameDifficultyLabel,
  DAILY_TARGET_CODE,
  getActiveRow,
  fillFirstEmptyTileInActiveRow,
  deleteLastFilledTileInActiveRow,
  selectTileInActiveRow,
  selectFirstEditableEmptyTileInActiveRow,
  syncActiveRowSelection,
  submitActiveRow,
  returnCompletedTileRowColors,
  compareCompletedCodeToDailyCode,
  getLatestCompletedRow,
};
