// This file contains the main game logic for handling user interactions with the codeboard and game rows.

// Valid tile states for the game
const VALID_TILE_STATES = new Set([
  "pink",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
]);

// Determines which row should be targeted for filling when a codeboard tile is clicked.
function getActiveRow() {
  return Array.from(document.querySelectorAll(".game-row")).find((row) =>
    row.querySelector('.game-tile[data-state="empty"]')
  );
}

// Fill the first empty tile in the active row with the selected colour when a codeboard tile is clicked.
function fillFirstEmptyTileInActiveRow(colour) {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const firstEmptyTile = activeRow.querySelector('.game-tile[data-state="empty"]');
  if (!firstEmptyTile) return;

  firstEmptyTile.dataset.state = colour;
}

// Handle clicks on the codeboard tiles.
function handleCodeboardTileClick(event) {
  const clickedTile = event.target.closest(".codeboard-tile");
  if (!clickedTile) return;

  const selectedColour = clickedTile.dataset.key;
  if (!VALID_TILE_STATES.has(selectedColour)) return;

  fillFirstEmptyTileInActiveRow(selectedColour);
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", handleCodeboardTileClick);
});

// Determines which row should be targeted for deletion when the delete button is pressed.
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

// Delete the last filled tile in the active row when the delete button is pressed.
function deleteLastFilledTileInActiveRow() {
  const row = getRowForDelete();
  if (!row) return;

  const filledTiles = Array.from(
    row.querySelectorAll('.game-tile:not([data-state="empty"])')
  );
  if (filledTiles.length === 0) return;

  filledTiles[filledTiles.length - 1].dataset.state = "empty";
}

document.getElementById("delete-button")?.addEventListener("click", deleteLastFilledTileInActiveRow);


