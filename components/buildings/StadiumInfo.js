import React, { useState } from 'react';
import SnakeGame from '../games/SnakeGame';

export default function StadiumInfo() {
  const [selectedGame, setSelectedGame] = useState(null);
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
  };

  const handleScoreChange = (newScore) => {
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  };

  if (selectedGame) {
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
    </div>
  );
}