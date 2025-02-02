import { useEffect, useRef, useState } from 'react';
import ConversationCard from './ConversationCard';

// City layout configuration
const TILE_SIZE = 32; // Each tile is 32x32 pixels
const GRID_WIDTH = 25; // 800px / 32px
const GRID_HEIGHT = 19; // 600px / 32px

// City layout matrix (0 = grass, 1 = road_h, 2 = road_v, 3 = intersection)
const CITY_LAYOUT = Array(GRID_HEIGHT).fill().map((_, y) => 
  Array(GRID_WIDTH).fill().map((_, x) => {
    if (y === 6 || y === 12) return 1; // Horizontal roads
    if (x === 8 || x === 16) return 2; // Vertical roads
    if ((y === 6 || y === 12) && (x === 8 || x === 16)) return 3; // Intersections
    return 0; // Grass everywhere else
  })
);

// Building assets with fixed positions
const BUILDINGS = {
  BANK: {
    img: '/assets/bank.png',
    label: 'BANK',
    position: { x: 2, y: 2 },
    size: { width: 2, height: 2 },
    details: {
      name: 'City Central Bank',
      totalBalance: '$10,000,000',
      totalMembers: '5,000'
    }
  },
  COURT: {
    img: '/assets/court.png',
    label: 'COURT',
    position: { x: 19, y: 2 },
    size: { width: 2, height: 2 },
    details: {
      name: 'Supreme Court',
      totalBalance: '$2,000,000',
      totalMembers: '200'
    }
  },
  LAB: {
    img: '/assets/lab.png',
    label: 'RESEARCH LAB',
    position: { x: 2, y: 14 },
    size: { width: 2, height: 2 },
    details: {
      name: 'Advanced Research Lab',
      totalBalance: '$5,000,000',
      totalMembers: '300'
    }
  },
  STADIUM: {
    img: '/assets/stadium.png',
    label: 'STADIUM',
    position: { x: 10, y: 8 },
    size: { width: 3, height: 3 },
    details: {
      name: 'City Stadium',
      totalBalance: '$8,000,000',
      totalMembers: '50,000'
    }
  }
};

// House assets
const HOUSES = {
  HOME1: '/assets/home1.png',
  HOME2: '/assets/home2.png',
  HOME3: '/assets/home3.png'
};

// Fixed house positions (manually placed for uniform distribution)
const FIXED_HOUSES = [
  // Top left quadrant
  { x: 2, y: 7, type: 'HOME1' },
  { x: 4, y: 2, type: 'HOME2' },
  
  // Top right quadrant
  { x: 19, y: 8, type: 'HOME3' },
  { x: 21, y: 2, type: 'HOME1' },
  
  // Bottom left quadrant
  { x: 2, y: 14, type: 'HOME2' },
  { x: 4, y: 10, type: 'HOME3' },
  
  // Bottom right quadrant
  { x: 19, y: 14, type: 'HOME1' },
  { x: 21, y: 10, type: 'HOME2' },
  
  // Center areas (avoiding stadium)
  { x: 10, y: 2, type: 'HOME3' },
  { x: 13, y: 14, type: 'HOME1' }
];

// Fixed avatar positions on roads
const AVATARS = [
  {
    seed: 'John',
    position: { x: 8, y: 4 }  // On vertical road
  },
  {
    seed: 'Alice',
    position: { x: 8, y: 7 }  // On vertical road
  },
];

// Adjust movement constants
const MOVEMENT_SPEED = 0.01; // Tiles per frame
const INTERACTION_DISTANCE = 1.5; // Tiles
const BUBBLE_DURATION = 2000; // 2 seconds

export default function CitySimulation() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const avatarPositionsRef = useRef(AVATARS.map(avatar => ({
    ...avatar.position,
    direction: Math.random() * Math.PI * 2, // Random initial direction
    isInteracting: false
  })));
  const [conversations, setConversations] = useState({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load all assets including avatars
    const loadedAssets = {};
    const loadAssets = async () => {
      // Load buildings
      for (const [key, building] of Object.entries(BUILDINGS)) {
        const img = new Image();
        img.src = building.img;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        loadedAssets[key] = img;
      }

      // Load houses
      for (const [key, path] of Object.entries(HOUSES)) {
        const img = new Image();
        img.src = path;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        loadedAssets[key] = img;
      }

      // Load avatars
      for (const avatar of AVATARS) {
        const img = new Image();
        img.src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${avatar.seed}`;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        loadedAssets[`avatar_${avatar.seed}`] = img;
      }
      return loadedAssets;
    };

    const drawConversation = (ctx, x, y, message) => {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      
      // Calculate text width for bubble size
      ctx.font = '12px Arial';
      const textWidth = ctx.measureText(message).width;
      const bubbleWidth = Math.max(textWidth + 20, 60);
      const bubbleHeight = 30;
      
      // Draw bubble
      ctx.beginPath();
      ctx.ellipse(
        x * TILE_SIZE + TILE_SIZE/2,
        y * TILE_SIZE - TILE_SIZE/2,
        bubbleWidth/2,
        bubbleHeight/2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText(
        message,
        x * TILE_SIZE + TILE_SIZE/2,
        y * TILE_SIZE - TILE_SIZE/2 + 5
      );
    };

    const updateAvatarPositions = () => {
      const positions = avatarPositionsRef.current;
      
      positions.forEach((pos, idx) => {
        if (pos.isInteracting) return; // Don't move if interacting

        // Calculate new position
        const newX = pos.x + Math.cos(pos.direction) * MOVEMENT_SPEED;
        const newY = pos.y + Math.sin(pos.direction) * MOVEMENT_SPEED;

        // Check if new position is near a road (allow some tolerance)
        const isNearHorizontalRoad = Math.abs(newY - 6) < 0.1 || Math.abs(newY - 12) < 0.1;
        const isNearVerticalRoad = Math.abs(newX - 8) < 0.1 || Math.abs(newX - 16) < 0.1;
        const isOnRoad = isNearHorizontalRoad || isNearVerticalRoad;

        // If hitting boundary or off road, change direction
        if (newX < 0 || newX > GRID_WIDTH - 1 || newY < 0 || newY > GRID_HEIGHT - 1 || !isOnRoad) {
          // Choose a direction along the current road
          if (isNearHorizontalRoad) {
            pos.direction = Math.random() < 0.5 ? 0 : Math.PI; // Move left or right
          } else if (isNearVerticalRoad) {
            pos.direction = Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2; // Move up or down
          } else {
            pos.direction = Math.random() * Math.PI * 2; // Random direction if lost
          }
          return;
        }

        // Update position
        pos.x = newX;
        pos.y = newY;

        // Check for interactions with other avatars
        positions.forEach((otherPos, otherIdx) => {
          if (idx === otherIdx) return;

          const distance = Math.sqrt(
            Math.pow(pos.x - otherPos.x, 2) + 
            Math.pow(pos.y - otherPos.y, 2)
          );

          if (distance < INTERACTION_DISTANCE && !pos.isInteracting && !otherPos.isInteracting) {
            pos.isInteracting = true;
            otherPos.isInteracting = true;

            const conversationId = `${idx}-${otherIdx}`;

            fetch('/api/generate-conversation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                agent1: AVATARS[idx],
                agent2: AVATARS[otherIdx]
              })
            })
            .then(res => res.json())
            .then(data => {
              setConversations(prev => ({
                ...prev,
                [conversationId]: {
                  messages: data.messages,
                  position: {
                    x: (pos.x + otherPos.x) / 2,
                    y: (pos.y + otherPos.y) / 2
                  },
                  startTime: Date.now()
                }
              }));
            });

            // Reset after 30 seconds
            setTimeout(() => {
              // Only reset if they're still interacting
              if (pos.isInteracting && otherPos.isInteracting) {
                pos.isInteracting = false;
                otherPos.isInteracting = false;
                
                // Choose new directions for both agents
                const chooseNewDirection = (agent) => {
                  if (Math.abs(agent.y - 6) < 0.1 || Math.abs(agent.y - 12) < 0.1) {
                    return Math.random() < 0.5 ? 0 : Math.PI;
                  } else {
                    return Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2;
                  }
                };
                
                pos.direction = chooseNewDirection(pos);
                otherPos.direction = chooseNewDirection(otherPos);
                
                setConversations(prev => {
                  const newConversations = { ...prev };
                  delete newConversations[conversationId];
                  return newConversations;
                });
              }
            }, 30000);
          }
        });
      });
    };

    const drawCity = (assets) => {
      // Draw grass background
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw roads
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const xPos = x * TILE_SIZE;
          const yPos = y * TILE_SIZE;

          // Draw roads
          if (y === 6 || y === 12 || x === 8 || x === 16) {
            // Road
            ctx.fillStyle = '#333333';
            ctx.fillRect(xPos, yPos, TILE_SIZE, TILE_SIZE);
            
            // Road markings
            ctx.strokeStyle = '#ffffff';
            ctx.setLineDash([4, 4]);
            
            if (y === 6 || y === 12) {
              // Horizontal road marking
              ctx.beginPath();
              ctx.moveTo(xPos, yPos + TILE_SIZE/2);
              ctx.lineTo(xPos + TILE_SIZE, yPos + TILE_SIZE/2);
              ctx.stroke();
            }
            
            if (x === 8 || x === 16) {
              // Vertical road marking
              ctx.beginPath();
              ctx.moveTo(xPos + TILE_SIZE/2, yPos);
              ctx.lineTo(xPos + TILE_SIZE/2, yPos + TILE_SIZE);
              ctx.stroke();
            }
          }
        }
      }

      // Draw houses
      FIXED_HOUSES.forEach(house => {
        const img = assets[house.type];
        if (img) {
          ctx.drawImage(
            img,
            house.x * TILE_SIZE,
            house.y * TILE_SIZE,
            TILE_SIZE * 2,
            TILE_SIZE * 2
          );
        }
      });

      // Draw major buildings with labels
      Object.entries(BUILDINGS).forEach(([key, building]) => {
        const img = assets[key];
        if (img) {
          // Draw building
          ctx.drawImage(
            img,
            building.position.x * TILE_SIZE,
            building.position.y * TILE_SIZE,
            building.size.width * TILE_SIZE,
            building.size.height * TILE_SIZE
          );

          // Draw label background
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
          ctx.fillRect(
            building.position.x * TILE_SIZE,
            (building.position.y + building.size.height) * TILE_SIZE,
            building.size.width * TILE_SIZE,
            20
          );

          // Draw label text
          ctx.fillStyle = 'black';
          ctx.font = '12px';
          ctx.textAlign = 'center';
          ctx.fillText(
            building.label,
            (building.position.x + building.size.width/2) * TILE_SIZE,
            (building.position.y + building.size.height) * TILE_SIZE + 14
          );
        }
      });

      // Update avatar positions
      updateAvatarPositions();

      // Draw avatars with updated positions
      avatarPositionsRef.current.forEach((pos, idx) => {
        const avatar = AVATARS[idx];
        const img = assets[`avatar_${avatar.seed}`];
        if (img) {
          ctx.drawImage(
            img,
            pos.x * TILE_SIZE,
            pos.y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      });

      // Draw conversations separately after drawing avatars
      Object.entries(conversations).forEach(([id, conversation]) => {
        if (!conversation?.messages) return;
        
        const [idx1, idx2] = id.split('-').map(Number);
        const pos1 = avatarPositionsRef.current[idx1];
        const pos2 = avatarPositionsRef.current[idx2];
        
        if (pos1?.isInteracting && pos2?.isInteracting) {
          const elapsedTime = Date.now() - conversation.startTime;
          const messageIndex = Math.floor(elapsedTime / 3000) % conversation.messages.length;
          const currentMessage = conversation.messages[messageIndex];
          
          if (currentMessage) {
            if (currentMessage.speaker === AVATARS[idx1].seed) {
              drawConversation(ctx, pos1.x, pos1.y, currentMessage.message);
            } else {
              drawConversation(ctx, pos2.x, pos2.y, currentMessage.message);
            }
          }
        }
      });
    };

    const animate = (assets) => {
      drawCity(assets);
      animationFrameRef.current = requestAnimationFrame(() => animate(assets));
    };

    const init = async () => {
      const assets = await loadAssets();
      animate(assets);
    };

    init();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array - only runs once

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / GRID_WIDTH);
    const y = (e.clientY - rect.top) / (rect.height / GRID_HEIGHT);

    // Check if click is within any building
    Object.entries(BUILDINGS).forEach(([key, building]) => {
      if (
        x >= building.position.x &&
        x <= building.position.x + building.size.width &&
        y >= building.position.y &&
        y <= building.position.y + building.size.height
      ) {
        setSelectedBuilding(key);
      }
    });
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / GRID_WIDTH);
    const y = (e.clientY - rect.top) / (rect.height / GRID_HEIGHT);

    let isOverBuilding = false;
    Object.entries(BUILDINGS).forEach(([key, building]) => {
      if (
        x >= building.position.x &&
        x <= building.position.x + building.size.width &&
        y >= building.position.y &&
        y <= building.position.y + building.size.height
      ) {
        isOverBuilding = true;
        setHoveredBuilding(key);
        canvas.style.cursor = 'pointer';
      }
    });

    if (!isOverBuilding) {
      setHoveredBuilding(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleConversationEnd = (conversationId) => {
    setConversations(prev => {
      const newConversations = { ...prev };
      delete newConversations[conversationId];
      return newConversations;
    });
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * TILE_SIZE}
        height={GRID_HEIGHT * TILE_SIZE}
        className="w-full rounded-lg"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      />
      
      {selectedBuilding && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">{BUILDINGS[selectedBuilding].details.name}</h3>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <p>Total Balance: {BUILDINGS[selectedBuilding].details.totalBalance}</p>
            <p>Total Members: {BUILDINGS[selectedBuilding].details.totalMembers}</p>
          </div>
        </div>
      )}

      {Object.entries(conversations).map(([id, conversation]) => (
        <ConversationCard
          key={id}
          conversation={conversation}
          position={conversation.position}
          onClose={() => handleConversationEnd(id)}
        />
      ))}
    </div>
  );
}