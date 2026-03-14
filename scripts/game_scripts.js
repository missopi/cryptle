const VALID_TILE_STATES = new Set([
  "pink",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
]);

function getActiveRow() {
  return Array.from(document.querySelectorAll(".game-row")).find((row) =>
    row.querySelector('.game-tile[data-state="empty"]')
  );
}

function fillFirstEmptyTileInActiveRow(colour) {
  const activeRow = getActiveRow();
  if (!activeRow) return;

  const firstEmptyTile = activeRow.querySelector('.game-tile[data-state="empty"]');
  if (!firstEmptyTile) return;

  firstEmptyTile.dataset.state = colour;
}

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
