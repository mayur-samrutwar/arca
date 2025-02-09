import React, { useEffect, useRef, useState } from 'react';

export default function SnakeGame({ onScoreChange }) {
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Game constants
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const INITIAL_SPEED = 150;
  
  // Game state refs
  const snakeRef = useRef([{ x: 5, y: 5 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 10, y: 10 });
  const speedRef = useRef(INITIAL_SPEED);
  const gameLoopRef = useRef(null);

  const getRandomPosition = () => ({
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  });

  const resetGame = () => {
    snakeRef.current = [{ x: 5, y: 5 }];
    directionRef.current = { x: 1, y: 0 };
    foodRef.current = getRandomPosition();
    speedRef.current = INITIAL_SPEED;
    setScore(0);
    setGameOver(false);
  };

  const handleKeyPress = (e) => {
    const { x, y } = directionRef.current;
    
    switch(e.key) {
      case 'ArrowUp':
        if (y === 0) directionRef.current = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
        if (y === 0) directionRef.current = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
        if (x === 0) directionRef.current = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
        if (x === 0) directionRef.current = { x: 1, y: 0 };
        break;
    }
  };

  const checkCollision = (head) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    // Self collision
    return snakeRef.current.slice(1).some(segment => 
      segment.x === head.x && segment.y === head.y
    );
  };

  const updateGame = () => {
    const snake = [...snakeRef.current];
    const head = {
      x: snake[0].x + directionRef.current.x,
      y: snake[0].y + directionRef.current.y
    };

    if (checkCollision(head)) {
      setGameOver(true);
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      foodRef.current = getRandomPosition();
      setScore(prev => prev + 10);
      if (onScoreChange) onScoreChange(score + 10);
      speedRef.current = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#3e3e3e';
    snakeRef.current.forEach(segment => {
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE - 1,
        CELL_SIZE - 1
      );
    });

    // Draw food
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(
      foodRef.current.x * CELL_SIZE,
      foodRef.current.y * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1
    );
  };

  const gameLoop = () => {
    updateGame();
    drawGame();
    if (!gameOver) {
      gameLoopRef.current = setTimeout(gameLoop, speedRef.current);
    }
  };

  const startGame = () => {
    resetGame();
    setGameStarted(true);
    gameLoop();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = GRID_SIZE * CELL_SIZE;
    canvas.height = GRID_SIZE * CELL_SIZE;
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full px-4">
        <div className="text-lg font-medium">Score: {score}</div>
        {!gameStarted && (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Game
          </button>
        )}
        {gameOver && (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg"
      />
      
      {gameOver && (
        <div className="text-red-500 font-medium">Game Over! Score: {score}</div>
      )}
    </div>
  );
}