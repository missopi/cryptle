// Core game logic and state helpers.

// The 6 valid tile states (colours) that can be used in the game.
const VALID_TILE_STATES = new Set([
  "pink",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
]);

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

// Returns the daily 4-colour code from the 6 available colours (repeats allowed).
function getDailyTargetCode(date = new Date()) {
  const dateKey = getDateKey(date);
  const seed = hashStringToSeed(`cryptle:${dateKey}`);
  const random = createRandomNumberGenerator(seed);

  const colours = Array.from(VALID_TILE_STATES);
  const dailyCode = [];

  for (let i = 0; i < 4; i += 1) {
    const randomIndex = Math.floor(random() * colours.length);
    dailyCode.push(colours[randomIndex]);
  }

  return dailyCode;
}


// Functions for managing the game state in the UI. These functions manage filling tiles and deleting tiles based on user interactions.
// Get the currently active row, which is the first row that has at least one empty tile. Returns null if all rows are filled.
function getActiveRow() {
  return Array.from(document.querySelectorAll(".game-row")).find((row) =>
    row.querySelector('.game-tile[data-state="empty"]')
  );
}

// Fill the first empty tile in the active row with the given colour. Does nothing if there is no active row or if the active row is already full.
function fillFirstEmptyTileInActiveRow(colour) {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const firstEmptyTile = activeRow.querySelector('.game-tile[data-state="empty"]');
  if (!firstEmptyTile) return;

  firstEmptyTile.dataset.state = colour;
}

// Get the row to delete from when the user clicks the delete button. 
function getRowForDelete() {
  const rows = Array.from(document.querySelectorAll(".game-row"));
  const activeIndex = rows.findIndex((row) =>
    row.querySelector('.game-tile[data-state="empty"]')
  );

  if (activeIndex === -1) return rows[rows.length - 1] ?? null;

  const activeRow = rows[activeIndex];
  const activeHasFilled = activeRow.querySelector('.game-tile:not([data-state="empty"])');

  if (activeHasFilled) return activeRow;
  return rows[activeIndex - 1] ?? activeRow;
}

// Delete the last filled tile in the active row. If the active row is empty, deletes the last filled tile in the previous row. Does nothing if there are no filled tiles.
function deleteLastFilledTileInActiveRow() {
  const row = getRowForDelete();
  if (!row) return;

  const filledTiles = Array.from(
    row.querySelectorAll('.game-tile:not([data-state="empty"])')
  );
  if (filledTiles.length === 0) return;

  filledTiles[filledTiles.length - 1].dataset.state = "empty";
}

const DAILY_TARGET_CODE = getDailyTargetCode();

// Find latest completed row
function getLatestCompletedRow() {
  const rows = Array.from(document.querySelectorAll(".game-row"));

  return [...rows].reverse().find((row) => {
    const filledTiles = row.querySelectorAll('.game-tile:not([data-state="empty"])');
    return filledTiles.length === 4;
  }) ?? null;
}

// Return an array like ["red", "blue", "green", "yellow"] of a completed row of filled tiles.
function returnCompletedTileRowColors() {
  const rows = Array.from(document.querySelectorAll(".game-row"));

  const completedRow = getLatestCompletedRow();

  if (!completedRow) return null;

  const tiles = Array.from(completedRow.querySelectorAll(".game-tile"));
  return tiles.map((tile) => tile.dataset.state);
};

// Compare DAILY_TARGET_CODE to entered game row
function compareCompletedCodeToDailyCode () {
  const dailyCode = DAILY_TARGET_CODE;
  const completedCode = returnCompletedTileRowColors();

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
  getDailyTargetCode,
  DAILY_TARGET_CODE,
  fillFirstEmptyTileInActiveRow,
  deleteLastFilledTileInActiveRow,
  returnCompletedTileRowColors,
  compareCompletedCodeToDailyCode,
  getLatestCompletedRow,
};
