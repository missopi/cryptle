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

// Show the daily target code. THis is currently just for testing but will be shown at the end of the game in the final version. Each colour in the code is represented by a dot with a corresponding aria-label for accessibility.
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

// Handle clicks on the delete button to delete the last filled tile in the active row.
document.addEventListener("DOMContentLoaded", () => {
  renderDailyCodeDisplay();
  document.addEventListener("click", handleCodeboardTileClick);

  const deleteButton = document.getElementById("delete-button");
  deleteButton?.addEventListener("click", () => {
    window.CryptleGameLogic?.deleteLastFilledTileInActiveRow();
  });
});
