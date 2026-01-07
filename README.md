# Tower Defence Game

A tower defence game built with PixiJS 8, TypeScript, and Vite.

## Tech Stack

- **PixiJS 8** - High-performance 2D WebGL/Canvas rendering
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/willslocombe4-dotcom/tower-defence-game.git
   cd tower-defence-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Project Structure

```
tower-defence-game/
├── public/
│   └── assets/
│       ├── sprites/     # Game sprites and textures
│       ├── audio/       # Sound effects and music
│       ├── fonts/       # Custom fonts
│       └── maps/        # Level/map data
├── src/
│   ├── core/
│   │   ├── Game.ts      # Main game class
│   │   ├── GameLoop.ts  # Update loop management
│   │   ├── AssetLoader.ts # Asset loading system
│   │   └── index.ts     # Core exports
│   ├── map/
│   │   ├── GameMap.ts   # Map orchestrator
│   │   ├── Grid.ts      # Tile grid management
│   │   ├── Tile.ts      # Individual tile class
│   │   ├── PathManager.ts # Enemy path handling
│   │   ├── types.ts     # Type definitions
│   │   └── maps/        # Level configurations
│   └── main.ts          # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Core Systems

### Game Class
Main orchestrator that initializes PixiJS, manages the game container, and handles lifecycle (init, start, pause, resume).

### GameLoop
Manages update callbacks using PixiJS ticker. Supports adding/removing callbacks and pause/resume functionality.

### AssetLoader
Bundle-based asset management using PixiJS Assets API. Supports textures, spritesheets, and progress tracking.

### Grid & Map System
Tile-based grid with support for different tile types (path, buildable, blocked, spawn, exit). Includes PathManager for enemy waypoint navigation and GameMap for pointer interaction handling.

## Roadmap

### Completed
- [x] **Project Setup** - PixiJS initialization, game loop, asset loading structure
- [x] **Grid & Map System** - Tile-based grid, enemy path, placeable tower zones
- [x] **Enemy System** - Enemy types (fast/tank/flying), spawning, health bars, path movement
- [x] **Tower System** - Tower types (cannon/archer/mage), placement UI, targeting, range visualization

### To Do

#### Projectiles & Combat
- [ ] Projectile sprites (bullets/arrows/magic)
- [ ] Damage calculation
- [ ] Hit detection
- [ ] Death effects & particles

#### Wave Manager
- [ ] Wave configuration
- [ ] Enemy composition per wave
- [ ] Difficulty scaling
- [ ] Countdown timer between waves

#### Economy & UI
- [ ] Gold system
- [ ] Lives counter
- [ ] Wave display
- [ ] Tower shop panel
- [ ] Upgrade menu

#### Game State Management
- [ ] Win/lose conditions
- [ ] Game over screen
- [ ] Restart functionality
- [ ] Level progression

## License

This project is private.
