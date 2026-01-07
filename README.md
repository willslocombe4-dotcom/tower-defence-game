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
│   │   ├── state/       # Game state management
│   │   │   ├── GameState.ts
│   │   │   └── GameStateManager.ts
│   │   └── index.ts     # Core exports
│   ├── entities/
│   │   ├── Entity.ts      # Base entity class
│   │   ├── Enemy.ts       # Combat enemy (ITarget)
│   │   ├── Projectile.ts  # Projectile entity
│   │   └── enemies/       # Wave enemy variants
│   ├── config/
│   │   └── WaveConfig.ts # Wave definitions & difficulty
│   ├── map/
│   │   ├── GameMap.ts   # Map orchestrator
│   │   ├── Grid.ts      # Tile grid management
│   │   ├── Tile.ts      # Individual tile class
│   │   ├── PathManager.ts # Enemy path handling
│   │   ├── types.ts     # Type definitions
│   │   └── maps/        # Level configurations
│   ├── systems/
│   │   ├── EnemyManager.ts     # Enemy lifecycle
│   │   ├── PathSystem.ts       # Path navigation
│   │   ├── WaveManager.ts      # Wave spawning
│   │   ├── ProjectileManager.ts # Projectile lifecycle
│   │   ├── CombatSystem.ts     # Damage & collision
│   │   └── EffectsManager.ts   # Visual effects
│   ├── ui/
│   │   ├── HUD.ts           # Heads-up display
│   │   ├── GameOverScreen.ts # Victory/defeat screen
│   │   └── PauseOverlay.ts  # Pause menu
│   ├── types/
│   │   └── index.ts     # Shared type definitions
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

### Wave Manager
Manages wave-based enemy spawning with configurable wave definitions, timed spawn queues, auto-advance between waves, and event emission for UI integration.

### Game State Manager
Centralized state management with states (Loading, Menu, Playing, Paused, Victory, Game Over), event system for UI updates, and proper lifecycle handling.

### Combat System
Projectile-based combat with different damage types:
- **Projectile Types** - Bullet (fast, single target), Arrow (piercing), Magic (area damage)
- **Damage Calculation** - Physical vs magical damage, armor reduction formula
- **Effects Manager** - Hit effects, damage numbers, death effects, area indicators

### UI Components
- **HUD** - Displays lives, gold, wave counter, and score
- **GameOverScreen** - Victory/defeat screen with restart and menu options
- **PauseOverlay** - Pause menu with resume, restart, and main menu buttons

## Roadmap

### Completed
- [x] **Project Setup** - PixiJS initialization, game loop, asset loading structure
- [x] **Grid & Map System** - Tile-based grid, enemy path, placeable tower zones
- [x] **Enemy System** - Enemy types (fast/tank/flying), spawning, health bars, path movement
- [x] **Tower System** - Tower types (cannon/archer/mage), placement UI, targeting, range visualization
- [x] **Wave Manager** - Wave configuration, enemy composition, difficulty scaling, countdown timer
- [x] **Game State Management** - Win/lose conditions, game over screen, restart functionality, pause system
- [x] **Basic UI** - HUD (lives/gold/wave/score), game over screen, pause overlay
- [x] **Projectiles & Combat** - Projectile types (bullet/arrow/magic), damage calculation with armor, hit detection, visual effects, area damage

### To Do

#### Economy & Tower Shop
- [ ] Tower shop panel
- [ ] Tower upgrade system
- [ ] Sell towers for partial refund
- [ ] Tower info tooltips

#### Polish & Effects
- [ ] Sound effects and music
- [ ] Particle effects for attacks
- [ ] Screen shake on damage
- [ ] Enemy death animations

#### Level Progression
- [ ] Multiple maps/levels
- [ ] Level selection screen
- [ ] Difficulty modes
- [ ] Endless mode

## License

This project is private.
