import SnakeGame from '../../../services/snakeGame';

// Share the games Map across API routes
const games = new Map();

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, direction } = req.body;
  
  if (!userId || !direction) {
    return res.status(400).json({ error: 'userId and direction are required' });
  }

  const game = games.get(userId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Validate direction input
  if (typeof direction.x !== 'number' || 
      typeof direction.y !== 'number' ||
      Math.abs(direction.x) > 1 ||
      Math.abs(direction.y) > 1) {
    return res.status(400).json({ error: 'Invalid direction' });
  }

  const now = Date.now();
  if (now - game.lastUpdateTime < game.MIN_UPDATE_INTERVAL) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const state = game.updateGame(direction);
  game.lastUpdateTime = now;
  
  res.status(200).json(state);
}