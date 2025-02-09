import React, { useState } from 'react';
import SnakeGame from '../games/SnakeGame';

export default function StadiumInfo() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const games = [
    {
      id: 'snake',
      name: 'Snake Game',
      price: '100 ARCA',
      component: SnakeGame,
      icon: '🐍'
    },
    {
      id: 'fruit-ninja',
      name: 'Fruit Ninja',
      price: '150 ARCA',
      component: null, // To be implemented
      icon: '🍎'
    }
  ];

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setShowPaymentModal(true);
  };

  const handlePlayGame = () => {
    setShowPaymentModal(false);
  };

  const handleScoreChange = (newScore) => {
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  };

  if (selectedGame && !showPaymentModal) {
    const GameComponent = selectedGame.component;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedGame(null)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <span>←</span> Back to Games
          </button>
        </div>
        
        {GameComponent && (
          <GameComponent onScoreChange={handleScoreChange} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Available Games</h4>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game)}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <div className="text-3xl mb-2">{game.icon}</div>
            <div className="font-medium">{game.name}</div>
            <div className="text-sm text-gray-500">{game.price}</div>
          </button>
        ))}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Play {selectedGame.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Price: {selectedGame.price}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handlePlayGame}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Pay & Play
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}