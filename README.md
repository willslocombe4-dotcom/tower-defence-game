# Tower Defence Game

A tower defence game built with React, TypeScript, and Vite.

## Tech Stack

- **React 19** - UI framework
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

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## Project Structure

```
tower-defence-game/
├── public/          # Static assets
├── src/
│   ├── assets/      # Images and other assets
│   ├── App.tsx      # Main App component
│   ├── App.css      # App styles
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── index.html       # HTML template
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Vite configuration
```

## Roadmap

### Completed
- [x] **Project Setup** - Initialize project, game loop, asset loading structure

### To Do

#### Grid & Map System
- [ ] Create tile-based grid
- [ ] Define path for enemies
- [ ] Placeable tower zones

#### Enemy System
- [ ] Enemy types (fast/tank/flying)
- [ ] Spawning system
- [ ] Health bars
- [ ] Movement along path

#### Tower System
- [ ] Tower types (cannon/archer/mage)
- [ ] Placement UI
- [ ] Targeting logic
- [ ] Attack range

#### Projectiles & Combat
- [ ] Bullets/arrows
- [ ] Damage calculation
- [ ] Hit detection
- [ ] Death effects

#### Wave Manager
- [ ] Wave configuration
- [ ] Enemy composition
- [ ] Difficulty scaling
- [ ] Countdown timer

#### Economy & UI
- [ ] Gold system
- [ ] Lives counter
- [ ] Wave display
- [ ] Tower shop
- [ ] Upgrade menu

#### Game State Management
- [ ] Win/lose conditions
- [ ] Game over screen
- [ ] Restart functionality

## License

This project is private.
