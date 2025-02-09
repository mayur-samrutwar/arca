import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import arcaArcadeAbi from '@/contracts/abi/arcaArcade.json';
import arcaAbi from '@/contracts/abi/arca.json';

const ARCA_ARCADE_ADDRESS = process.env.NEXT_PUBLIC_ARCA_ARCADE_ADDRESS;

export default function SnakeGame({ onScoreChange }) {
  const [gameState, setGameState] = useState('payment'); // 'payment', 'ready', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [gameFee, setGameFee] = useState(null);
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { data: approvalHash, writeContract: writeApproval } = useWriteContract();
  
  // Add transaction receipt hooks
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({
      hash,
    });

  const { 
    isLoading: isApprovalConfirming, 
    isSuccess: isApprovalConfirmed 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Game related refs
  const canvasRef = useRef(null);
  const snakeRef = useRef([{ x: 5, y: 5 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 10, y: 10 });
  const speedRef = useRef(150);
  const gameLoopRef = useRef(null);

  // Add new state for game ready
  const [isGameReady, setIsGameReady] = useState(false);

  // Get game fee
  const { data: fee } = useReadContract({
    address: ARCA_ARCADE_ADDRESS,
    abi: arcaArcadeAbi,
    functionName: 'getGameFee',
    args: ['snake'],
  });

  // Get agent ID
  const { data: agentId } = useReadContract({
    address: process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getMyAgent',
    account: address,
  });

  useEffect(() => {
    if (fee) {
      setGameFee(fee);
    }
  }, [fee]);

  const getRandomPosition = () => ({
    x: Math.floor(Math.random() * 20),
    y: Math.floor(Math.random() * 20)
  });

  const resetGame = () => {
    snakeRef.current = [{ x: 5, y: 5 }];
    directionRef.current = { x: 1, y: 0 };
    foodRef.current = getRandomPosition();
    speedRef.current = 150;
    setScore(0);
  };

  const handleKeyPress = (e) => {
    if (gameState === 'gameover') return; // Ignore inputs when game is over
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

  const handleGameOver = async () => {
    setGameState('gameover');
    if (gameLoopRef.current) {
      clearTimeout(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    if (agentId) {
      try {
        // Only send game data to backend
        const response = await fetch('/api/updateGameReputation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: Number(agentId),
            gameData: {
              gameType: 'snake',
              score,
              timestamp: Date.now()
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update game results');
        }

        const result = await response.json();
        console.log('Game results updated:', result);

      } catch (error) {
        console.error('Error updating game results:', error);
      }
    }
  };

  const checkCollision = (head) => {
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
      handleGameOver();
      return true;
    }
    
    if (snakeRef.current.slice(1).some(segment => 
      segment.x === head.x && segment.y === head.y
    )) {
      handleGameOver();
      return true;
    }
    
    return false;
  };

  const updateGame = () => {
    if (gameState === 'gameover') {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const snake = [...snakeRef.current];
    const head = {
      x: snake[0].x + directionRef.current.x,
      y: snake[0].y + directionRef.current.y
    };

    if (checkCollision(head)) {
      setGameState('gameover');
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      foodRef.current = getRandomPosition();
      setScore(prev => prev + 10);
      if (onScoreChange) onScoreChange(score + 10);
      speedRef.current = Math.max(50, 150 - Math.floor(score / 50) * 10);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
  };

  const drawGame = () => {
    if (gameState === 'gameover') return; // Don't draw if game is over
    
    const canvas = canvasRef.current;
    if (!canvas) return; // Don't draw if canvas doesn't exist
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#3e3e3e';
    snakeRef.current.forEach(segment => {
      ctx.fillRect(
        segment.x * 20,
        segment.y * 20,
        19,
        19
      );
    });

    // Draw food
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(
      foodRef.current.x * 20,
      foodRef.current.y * 20,
      19,
      19
    );
  };

  const gameLoop = () => {
    updateGame();
    drawGame();
    if (gameState === 'playing') {
      gameLoopRef.current = setTimeout(gameLoop, speedRef.current);
    }
  };

  const startGame = () => {
    resetGame();
    gameLoop();
  };

  const handleApproveAndPlay = async () => {
    try {
      setIsPaymentPending(true);
      
      // First approve ARCA tokens
      await writeApproval({
        address: process.env.NEXT_PUBLIC_ARCA_TOKEN_ADDRESS,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [ARCA_ARCADE_ADDRESS, gameFee]
      });

    } catch (error) {
      console.error('Failed to approve tokens:', error);
      setIsPaymentPending(false);
    }
  };

  // Handle play after approval is confirmed
  const handlePlay = async () => {
    try {
      await writeContract({
        address: ARCA_ARCADE_ADDRESS,
        abi: arcaArcadeAbi,
        functionName: 'playGame',
        args: ['snake']
      });
    } catch (error) {
      console.error('Game transaction failed:', error);
      setIsPaymentPending(false);
    }
  };

  // Watch for approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed) {
      handlePlay();
    }
  }, [isApprovalConfirmed]);

  // Watch for play confirmation
  useEffect(() => {
    if (isConfirmed) {
      setGameState('ready'); // Change to 'ready' instead of 'playing'
      setIsPaymentPending(false);
    }
  }, [isConfirmed]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      e.preventDefault(); // Prevent scrolling
      
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

    // Add event listener to window instead of div
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  const handleStartGame = () => {
    setGameState('playing');
    setIsGameReady(true);
    startGame();
  };

  // Initialize canvas when game starts
  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 20 * 20;
      canvas.height = 20 * 20;
      startGame();
    }
  }, [gameState]);

  const renderPaymentScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Snake Game</h2>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Entry Fee</p>
            <p className="text-3xl font-bold text-blue-500">
              {gameFee ? `${Number(gameFee) / 1e18} ARCA` : 'Loading...'}
            </p>
          </div>

          {!address ? (
            <div className="text-center text-red-500">
              Please connect your wallet to play
            </div>
          ) : (
            <button
              onClick={handleApproveAndPlay}
              disabled={isPending || isConfirming || isApprovalConfirming}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isApprovalConfirming ? 'Approving...' : 
               isPending ? 'Processing...' : 
               isConfirming ? 'Confirming...' : 
               `Play Now (${gameFee ? Number(gameFee) / 1e18 : '...'} ARCA)`}
            </button>
          )}

          {/* Status Messages */}
          {(isApprovalConfirming || isPending || isConfirming) && (
            <div className="text-sm text-center text-gray-500">
              {isApprovalConfirming && 'Approving ARCA tokens...'}
              {isPending && 'Processing game payment...'}
              {isConfirming && 'Confirming transaction...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render ready screen
  const renderReadyScreen = () => (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Ready to Play!</h2>
        <div className="mb-8 text-center space-y-4">
          <p className="text-gray-600">Use arrow keys to control the snake</p>
          <p className="text-gray-600">Collect food to grow and score points</p>
          <p className="text-gray-600">Don't hit the walls or yourself!</p>
        </div>
        <button
          onClick={handleStartGame}
          className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
        >
          Start Game
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {gameState === 'payment' && renderPaymentScreen()}
      
      {gameState === 'ready' && renderReadyScreen()}
      
      {gameState === 'playing' && (
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4 px-4">
            <div className="text-lg font-medium">Score: {score}</div>
          </div>
          <div className="relative bg-white rounded-lg shadow-lg p-4">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded-lg mx-auto"
              style={{ maxWidth: '100%' }}
              tabIndex="0" // Make canvas focusable
            />
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">
            Use arrow keys to control the snake
          </div>
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-3xl font-bold text-red-500 mb-4">Game Over!</div>
            <div className="text-2xl mb-6">Final Score: {score}</div>
            <button
              onClick={() => setGameState('payment')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}