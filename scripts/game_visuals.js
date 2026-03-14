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

// Handle clicks on the delete button to delete the last filled tile in the active row.
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", handleCodeboardTileClick);

  const deleteButton = document.getElementById("delete-button");
  deleteButton?.addEventListener("click", () => {
    window.CryptleGameLogic?.deleteLastFilledTileInActiveRow();
  });
});

