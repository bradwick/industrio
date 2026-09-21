import { GameApp } from './GameApp';

window.addEventListener('DOMContentLoaded', () => {
  const startModal = document.getElementById('start-modal');

  const startGame = async (mapSize: number) => {
    if (startModal) startModal.style.display = 'none';
    const game = new GameApp(mapSize, mapSize);
    await game.init();
  };

  document.getElementById('btn-map-small')?.addEventListener('click', () => startGame(60));
  document.getElementById('btn-map-medium')?.addEventListener('click', () => startGame(100));
  document.getElementById('btn-map-large')?.addEventListener('click', () => startGame(150));
});
