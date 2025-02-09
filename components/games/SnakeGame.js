import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import arcaArcadeAbi from '@/contracts/abi/arcaArcade.json';

const ARCA_ARCADE_ADDRESS = process.env.NEXT_PUBLIC_ARCA_ARCADE_ADDRESS;

export default function SnakeGame({ onScoreChange }) {
  const [gameState, setGameState] = useState('payment'); // 'payment', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [gameFee, setGameFee] = useState(null);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  
  // Add transaction tracking
  const [approvalHash, setApprovalHash] = useState(null);
  const [playHash, setPlayHash] = useState(null);

  // Track transaction confirmations
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  const { isSuccess: isPlayConfirmed } = useWaitForTransactionReceipt({
    hash: playHash,
  });

  // Game related refs
  const canvasRef = useRef(null);
  const snakeRef = useRef([{ x: 5, y: 5 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 10, y: 10 });
  const speedRef = useRef(150);
  const gameLoopRef = useRef(null);

  // Get game fee
  const { data: fee } = useReadContract({
    address: ARCA_ARCADE_ADDRESS,
    abi: arcaArcadeAbi,
    functionName: 'getGameFee',
    args: ['snake'],
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

  const checkCollision = (head) => {
    // Wall collision
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
      return true;
    }
    
    // Self collision
    return snakeRef.current.slice(1).some(segment => 
      segment.x === head.x && segment.y === head.y
    );
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

  const handleGamePayment = async () => {
    try {
      setIsPaymentPending(true);
      
      // First approve ARCA tokens
      const approvalResult = await writeContract({
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

      setApprovalHash(approvalResult);

    } catch (error) {
      console.error('Approval failed:', error);
      setIsPaymentPending(false);
    }
  };

  // Watch for approval confirmation and initiate game transaction
  useEffect(() => {
    const initiateGameTransaction = async () => {
      if (isApprovalConfirmed) {
        try {
          const playResult = await writeContract({
            address: ARCA_ARCADE_ADDRESS,
            abi: arcaArcadeAbi,
            functionName: 'playGame',
            args: ['snake']
          });
          
          setPlayHash(playResult);
        } catch (error) {
          console.error('Game transaction failed:', error);
          setIsPaymentPending(false);
        }
      }
    };

    if (isApprovalConfirmed) {
      initiateGameTransaction();
    }
  }, [isApprovalConfirmed]);

  // Watch for play confirmation and start game
  useEffect(() => {
    if (isPlayConfirmed) {
      setGameState('playing');
      startGame();
      setIsPaymentPending(false);
    }
  }, [isPlayConfirmed]);

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

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">How to Play:</h3>
            <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc pl-5 space-y-1">
              <li>Use arrow keys to control the snake</li>
              <li>Eat food to grow longer</li>
              <li>Avoid hitting walls and yourself</li>
              <li>Score points to earn rewards!</li>
            </ul>
          </div>

          {!address ? (
            <div className="text-center text-red-500">
              Please connect your wallet to play
            </div>
          ) : (
            <button
              onClick={handleGamePayment}
              disabled={isPaymentPending}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPaymentPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Play Now (${gameFee ? Number(gameFee) / 1e18 : '...'} ARCA)`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && gameState !== 'gameover') {
      canvas.width = 20 * 20;
      canvas.height = 20 * 20;
    }
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-4">
      {gameState === 'payment' && renderPaymentScreen()}
      
      {gameState === 'playing' && (
        <>
          <div className="flex justify-between w-full px-4">
            <div className="text-lg font-medium">Score: {score}</div>
          </div>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded-lg"
            />
          </div>
        </>
      )}
      
      {gameState === 'gameover' && (
        <div className="flex items-center justify-center min-h-[400px]">
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