import { useEffect, useRef, useState } from 'react';
import ConversationCard from './ConversationCard';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import arcaAbi from '../contracts/abi/arca.json';

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

const ARCA_CITY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ARCA_CITY_CONTRACT_ADDRESS;

// Adjust movement constants
const MOVEMENT_SPEED = 0.01; // Tiles per frame
const INTERACTION_DISTANCE = 1.5; // Tiles
const BUBBLE_DURATION = 2000; // 2 seconds

// Helper function to get random road position
const getRandomRoadPosition = () => {
  // Randomly choose between horizontal and vertical roads
  const isHorizontal = Math.random() < 0.5;
  
  if (isHorizontal) {
    // Choose between y=6 or y=12 roads
    const y = Math.random() < 0.5 ? 6 : 12;
    // Random x position along the road
    const x = Math.random() * GRID_WIDTH;
    return { x, y };
  } else {
    // Choose between x=8 or x=16 roads
    const x = Math.random() < 0.5 ? 8 : 16;
    // Random y position along the road
    const y = Math.random() * GRID_HEIGHT;
    return { x, y };
  }
};

// Helper function to serialize agent data
const serializeAgent = (agent) => {
  return {
    id: agent.id.toString(), // Convert BigInt to string
    name: agent.name,
    owner: agent.owner,
    position: agent.position
  };
};

export default function CitySimulation() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const avatarPositionsRef = useRef([]);
  const [conversations, setConversations] = useState({});
  const [agents, setAgents] = useState([]);
  const [loadedAssets, setLoadedAssets] = useState({});
  
  // Add account to filter owned agents
  const { address } = useAccount();

  // Fetch live agents using wagmi
  const { data: liveAgents } = useReadContract({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getAllLiveAgents',
    watch: true,
  });

  // Prepare contracts config for batch reading all agents
  const agentInfoConfig = liveAgents?.map(id => ({
    address: ARCA_CITY_CONTRACT_ADDRESS,
    abi: arcaAbi,
    functionName: 'getAgentInfo',
    args: [id],
  })) ?? [];

  // Fetch all agents info in parallel
  const { data: agentsInfo } = useReadContracts({
    contracts: agentInfoConfig,
    enabled: Boolean(liveAgents?.length),
  });

  // Load avatar for a single agent
  const loadAgentAvatar = async (agent) => {
    if (!agent?.name || loadedAssets[`avatar_${agent.name}`]) return;
    
    const img = new Image();
    img.src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${agent.name}`;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    setLoadedAssets(prev => ({
      ...prev,
      [`avatar_${agent.name}`]: img
    }));
  };

  // Initialize agent positions when data is loaded
  useEffect(() => {
    if (!agentsInfo || !liveAgents) return;

    const formattedAgents = agentsInfo.map((info, index) => {
      const roadPosition = getRandomRoadPosition();
      return {
        id: liveAgents[index],
        name: info.result[0],
        owner: info.result[1],
        position: roadPosition
      };
    });

    setAgents(formattedAgents);
    
    // Initialize or update avatar positions
    avatarPositionsRef.current = formattedAgents.map((agent, idx) => {
      const existingPos = avatarPositionsRef.current[idx];
      if (existingPos) return existingPos;
      
      // Initialize new position on a road
      const isHorizontal = Math.abs(agent.position.y - 6) < 0.1 || Math.abs(agent.position.y - 12) < 0.1;
      return {
        ...agent.position,
        direction: isHorizontal ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2),
        isInteracting: false
      };
    });

    // Load avatars for all agents
    formattedAgents.forEach(loadAgentAvatar);
  }, [agentsInfo, liveAgents]);

  // Load static assets
  useEffect(() => {
    const loadStaticAssets = async () => {
      const assets = {};
      
      // Load buildings
      for (const [key, building] of Object.entries(BUILDINGS)) {
        const img = new Image();
        img.src = building.img;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        assets[key] = img;
      }

      // Load houses
      for (const [key, path] of Object.entries(HOUSES)) {
        const img = new Image();
        img.src = path;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        assets[key] = img;
      }

      setLoadedAssets(prev => ({...prev, ...assets}));
    };

    loadStaticAssets();
  }, []);

  // Update canvas drawing
  useEffect(() => {
    if (!canvasRef.current || !agents.length || Object.keys(loadedAssets).length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

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
            // Lost agent - reset to nearest road
            const nearestRoad = getRandomRoadPosition();
            pos.x = nearestRoad.x;
            pos.y = nearestRoad.y;
            pos.direction = Math.random() * Math.PI * 2;
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
                agent1: serializeAgent(agents[idx]),
                agent2: serializeAgent(agents[otherIdx])
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
                  startTime: Date.now(),
                  agent1Name: agents[idx].name,
                  agent2Name: agents[otherIdx].name
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

    const drawCity = () => {
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
        const img = loadedAssets[house.type];
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
        const img = loadedAssets[key];
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
        const agent = agents[idx];
        if (!agent) return;
        
        const img = loadedAssets[`avatar_${agent.name}`];
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

      // Draw conversations only for owned agents
      Object.entries(conversations).forEach(([id, conversation]) => {
        if (!conversation?.messages) return;
        
        const [idx1, idx2] = id.split('-').map(Number);
        const agent1 = agents[idx1];
        const agent2 = agents[idx2];
        
        // Only show conversations if one of the agents is owned by the user
        if (agent1?.owner !== address && agent2?.owner !== address) return;
        
        const pos1 = avatarPositionsRef.current[idx1];
        const pos2 = avatarPositionsRef.current[idx2];
        
        if (pos1?.isInteracting && pos2?.isInteracting) {
          const elapsedTime = Date.now() - conversation.startTime;
          const messageIndex = Math.floor(elapsedTime / 3000) % conversation.messages.length;
          const currentMessage = conversation.messages[messageIndex];
          
          if (currentMessage) {
            if (currentMessage.speaker === agent1.name) {
              drawConversation(ctx, pos1.x, pos1.y, currentMessage.message);
            } else {
              drawConversation(ctx, pos2.x, pos2.y, currentMessage.message);
            }
          }
        }
      });
    };

    const animate = () => {
      updateAvatarPositions();
      drawCity();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [agents, loadedAssets, address]);

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
          agent1Name={conversation.agent1Name}
          agent2Name={conversation.agent2Name}
          onClose={() => handleConversationEnd(id)}
        />
      ))}
    </div>
  );
}