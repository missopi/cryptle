const welcomeModuleDate = document.getElementById('welcome-module-date');
const versionNumberCount =
  document.getElementById('version-number-count') ??
  document.getElementById('welcome-module-count');

const VERSION_START_DATE = new Date(2026, 2, 13); // 13 March 2026 -> 001

function toDayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

if (welcomeModuleDate) {
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  welcomeModuleDate.textContent = formattedDate;
}

if (versionNumberCount) {
  const today = new Date();
  const daysSinceStart = toDayNumber(today) - toDayNumber(VERSION_START_DATE) + 1;
  const versionCount = Math.max(1, daysSinceStart);

  versionNumberCount.textContent = String(versionCount).padStart(3, '0');
}

const playButton = document.getElementById('play-button');

if (playButton) {
  playButton.addEventListener('click', (event) => {
    event.preventDefault();

    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    const difficulty = selectedDifficulty?.value ?? 'medium';

    const routeByDifficulty = {
      easy: 'game_screens/easy_game.html',
      medium: 'game_screens/medium_game.html',
      hard: 'game_screens/hard_game.html'
    };

    window.location.href = routeByDifficulty[difficulty] ?? routeByDifficulty.medium;
  });
}
