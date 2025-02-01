import { useEffect, useRef } from 'react';

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
    size: { width: 2, height: 2 }
  },
  COURT: {
    img: '/assets/court.png',
    label: 'COURT',
    position: { x: 19, y: 2 },
    size: { width: 2, height: 2 }
  },
  STADIUM: {
    img: '/assets/stadium.png',
    label: 'STADIUM',
    position: { x: 10, y: 8 },
    size: { width: 3, height: 3 }
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
    position: { x: 8, y: 4 }
  },
  {
    seed: 'Alice',
    position: { x: 16, y: 7 }
  },
  {
    seed: 'Bob',
    position: { x: 8, y: 12 }
  },
  {
    seed: 'Emma',
    position: { x: 16, y: 14 }
  },
  {
    seed: 'Mike',
    position: { x: 8, y: 9 }
  }
];

export default function CitySimulation() {
  const canvasRef = useRef(null);

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
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(
            building.position.x * TILE_SIZE,
            (building.position.y + building.size.height) * TILE_SIZE,
            building.size.width * TILE_SIZE,
            20
          );

          // Draw label text
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            building.label,
            (building.position.x + building.size.width/2) * TILE_SIZE,
            (building.position.y + building.size.height) * TILE_SIZE + 14
          );
        }
      });

      // Draw avatars
      AVATARS.forEach(avatar => {
        const img = assets[`avatar_${avatar.seed}`];
        if (img) {
          ctx.drawImage(
            img,
            avatar.position.x * TILE_SIZE,
            avatar.position.y * TILE_SIZE,
            TILE_SIZE,  // Avatar size is 1x1 tile
            TILE_SIZE
          );
        }
      });
    };

    const init = async () => {
      const assets = await loadAssets();
      drawCity(assets);
    };

    init();
  }, []); // Empty dependency array - only runs once

  return (
    <canvas
      ref={canvasRef}
      width={GRID_WIDTH * TILE_SIZE}
      height={GRID_HEIGHT * TILE_SIZE}
      className="w-full rounded-lg"
    />
  );
}