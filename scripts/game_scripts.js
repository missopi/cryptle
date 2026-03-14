const VALID_TILE_STATES = new Set([
  "pink",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
]);

function fillFirstEmptyTile(colour) {
  const firstEmptyTile = document.querySelector('.game-tile[data-state="empty"]');
  if (!firstEmptyTile) return;

  firstEmptyTile.dataset.state = colour;
}

function handleCodeboardTileClick(event) {
  const clickedTile = event.target.closest(".codeboard-tile");
  if (!clickedTile) return;

  const selectedColour = clickedTile.dataset.key;
  if (!VALID_TILE_STATES.has(selectedColour)) return;

  fillFirstEmptyTile(selectedColour);
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", handleCodeboardTileClick);
});
