# CLAUDE.MD - AI Assistant Development Guide

> **Purpose**: This document provides a comprehensive guide for AI assistants (like Claude) working on the Barkour game codebase. It explains the project structure, development workflows, key conventions, and common tasks.

**Last Updated**: 2025-11-14
**Project Version**: 2.0.0
**Project Type**: Browser-based HTML5 Canvas game (vanilla JavaScript)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Architecture & Patterns](#architecture--patterns)
4. [Key Conventions](#key-conventions)
5. [Development Workflows](#development-workflows)
6. [Common Tasks & Recipes](#common-tasks--recipes)
7. [Testing Strategy](#testing-strategy)
8. [Important Gotchas](#important-gotchas)
9. [Documentation Map](#documentation-map)

---

## Project Overview

### What is Barkour?

Barkour is a browser-based endless runner game inspired by Chrome's T-Rex game, featuring:
- Two playable dog characters (Buddy and Neet)
- Mario-themed pixel art aesthetic
- Three difficulty levels (Easy, Medium, Hard)
- Supabase-powered authentication and global leaderboards
- Mobile-responsive with touch controls
- No build system - pure HTML/CSS/JavaScript

### Technology Stack

| Technology | Purpose |
|------------|---------|
| HTML5 Canvas | Game rendering |
| Vanilla JavaScript (ES6+) | Game logic, no frameworks |
| CSS3 | UI styling |
| Supabase | Authentication, database (PostgreSQL), leaderboard |
| GitHub Actions | Static site deployment |

### Key Features

- ✅ Character selection (2 dogs)
- ✅ Difficulty selection (Easy/Medium/Hard)
- ✅ Endless runner gameplay with T-Rex-style physics
- ✅ Score tracking with localStorage fallback
- ✅ User authentication (signup/login)
- ✅ Global leaderboards (per difficulty)
- ✅ Mobile touch controls + desktop keyboard/mouse
- ✅ Pixel-perfect rendering (no image smoothing)

---

## Codebase Structure

### Directory Layout

```
barkour/
├── index.html              # Main HTML entry point (game canvas, modals, UI)
├── css/
│   └── style.css          # All game styling (UI, modals, responsive)
├── js/
│   ├── game.js            # Main game class (game loop, state machine)
│   ├── config.js          # Configuration object (physics, difficulty, colors)
│   ├── constants.js       # Backward-compatible constants (proxies to CONFIG)
│   ├── character.js       # Character class (player dog, physics, jumping)
│   ├── obstacle.js        # Obstacle classes (Pipe, ObstacleManager)
│   ├── background.js      # Background rendering (clouds, ground tiles)
│   ├── collision.js       # AABB collision detection with hitbox padding
│   ├── input.js           # InputHandler class (keyboard, mouse, touch)
│   ├── storage.js         # localStorage utilities (scores, preferences)
│   ├── auth.js            # AuthManager class (Supabase auth, leaderboards)
│   └── ui-controller.js   # UIController class (modals, auth forms, leaderboard)
├── assets/
│   └── sprites/
│       ├── Buddy.png      # Dog character 1 sprite
│       ├── Neet.png       # Dog character 2 sprite
│       ├── pipe.svg       # Pipe obstacle sprite
│       └── cloud.svg      # Cloud decoration sprite
├── docs/                  # Documentation files (see Documentation Map below)
│   ├── README.md          # User-facing readme
│   ├── PRD.md             # Product Requirements Document
│   ├── CONFIG_GUIDE.md    # Configuration tuning guide
│   ├── MOBILE_CONTROLS.md # Touch controls guide
│   ├── SUPABASE_SETUP.md  # Supabase setup instructions
│   ├── AI_CODING_PROMPT.md # Original AI coding prompt
│   └── claude.md          # Implementation guide (legacy)
└── supabase-setup.sql     # Database schema and RLS policies

```

### File Dependency Graph

```
index.html
    ├─> css/style.css
    └─> js/ (loaded in order):
        ├─> config.js         (no dependencies)
        ├─> constants.js      (depends on: config.js)
        ├─> storage.js        (depends on: constants.js)
        ├─> collision.js      (depends on: constants.js)
        ├─> background.js     (depends on: constants.js)
        ├─> obstacle.js       (depends on: constants.js, collision.js)
        ├─> character.js      (depends on: constants.js)
        ├─> auth.js           (depends on: Supabase client)
        ├─> ui-controller.js  (depends on: auth.js)
        ├─> input.js          (depends on: constants.js)
        └─> game.js           (depends on: all of the above)
```

**Important**: Scripts must load in the order shown in `index.html` due to dependencies.

---

## Architecture & Patterns

### Game State Machine

The game uses a finite state machine with 5 states:

```javascript
'LOADING'       // Initial state while assets load
'START'         // Character selection screen
'SELECT_SPEED'  // Difficulty selection screen
'PLAYING'       // Active gameplay
'GAME_OVER'     // Game over screen with restart options
```

**State transitions**:
```
LOADING → START
        ↓ (select character)
    SELECT_SPEED
        ↓ (select difficulty)
     PLAYING
        ↓ (collision)
    GAME_OVER
        ↓ (restart → PLAYING) or (change character → START)
```

### Class Architecture

#### Core Game Classes

1. **Game** (`game.js`)
   - Central orchestrator for all game systems
   - Manages game state transitions
   - Owns and updates all game objects
   - Handles asset loading
   - Runs the main game loop (`requestAnimationFrame`)

2. **Character** (`character.js`)
   - Represents the player dog
   - Physics: gravity, jumping, ground collision
   - Properties: `x, y, velocityY, isJumping, sprite`
   - Methods: `jump()`, `update()`, `draw()`, `getBounds()`

3. **ObstacleManager** (`obstacle.js`)
   - Spawns and manages all obstacles
   - Handles obstacle scrolling and cleanup
   - Contains array of Pipe instances
   - Randomizes obstacle spacing based on difficulty

4. **Pipe** (`obstacle.js`)
   - Individual obstacle (extends base Obstacle pattern)
   - Scrolls left at game speed
   - Provides collision bounds
   - Cleans up when off-screen

5. **Background** (`background.js`)
   - Renders sky, ground, clouds
   - Parallax scrolling for depth
   - Infinite scrolling (wraps around)

6. **InputHandler** (`input.js`)
   - Centralizes all input (keyboard, mouse, touch)
   - State-aware: different inputs for different game states
   - Prevents default browser behaviors (spacebar scroll)

7. **AuthManager** (`auth.js`)
   - Supabase authentication (signup, login, logout)
   - Session management
   - Score submission to database
   - Leaderboard fetching

8. **UIController** (`ui-controller.js`)
   - Modal management (auth, leaderboard)
   - User panel display
   - Message notifications
   - Tab switching (leaderboard difficulty filters)

### Configuration System

**Key Design Decision**: All game tuning values are centralized in `config.js` (not scattered across files).

```javascript
// config.js - Single source of truth
const CONFIG = {
    CANVAS: { WIDTH, HEIGHT, ... },
    PHYSICS: { GRAVITY, JUMP_VELOCITY, ... },
    DIFFICULTY: {
        EASY: { INITIAL_SPEED, MAX_SPEED, ... },
        MEDIUM: { ... },
        HARD: { ... }
    },
    CHARACTER: { WIDTH, HEIGHT, HITBOX_PADDING, ... },
    OBSTACLES: { ... },
    COLORS: { SKY_BLUE, GROUND_BROWN, ... }
};

// constants.js - Backward-compatibility layer
// Proxies old constant names to CONFIG values
const CONSTANTS = {
    CANVAS_WIDTH: CONFIG.CANVAS.WIDTH,
    GRAVITY: CONFIG.PHYSICS.GRAVITY,
    // ... etc
};
```

**When to edit which file**:
- **config.js**: Change gameplay tuning, physics, colors, difficulty settings
- **constants.js**: Only add new proxies if old code references them

### Collision Detection

Uses **Axis-Aligned Bounding Box (AABB)** collision with **hitbox padding** for fairness:

```javascript
// collision.js
function checkCollision(rect1, rect2, padding) {
    // Shrinks hitboxes by padding pixels on all sides
    // Makes collisions more forgiving (edges can overlap slightly)
    return rect1.x + padding < rect2.x + rect2.width - padding &&
           rect1.x + rect1.width - padding > rect2.x + padding &&
           rect1.y + padding < rect2.y + rect2.height - padding &&
           rect1.y + rect1.height - padding > rect2.y + padding;
}
```

**Padding values**:
- Character: 12px (CONFIG.CHARACTER.HITBOX_PADDING)
- Obstacles: 4px (CONFIG.OBSTACLES.PIPE.HITBOX_PADDING)

**Why**: Players perceive collisions as "unfair" if exact sprite boundaries are used. Padding reduces frustration.

### Data Persistence

**Two-layer system**:

1. **localStorage** (local, offline)
   - High scores (per character, per difficulty)
   - Selected character preference
   - Always available, even when not logged in

2. **Supabase** (cloud, requires auth)
   - User profiles (username, email)
   - All-time best scores (per user, per difficulty)
   - Global leaderboards

**Pattern**: Always save to localStorage immediately. If user is logged in, also submit to Supabase asynchronously.

---

## Key Conventions

### Code Style

1. **Classes use PascalCase**: `Game`, `Character`, `ObstacleManager`
2. **Functions/methods use camelCase**: `update()`, `checkCollision()`, `loadAssets()`
3. **Constants use SCREAMING_SNAKE_CASE**: `GRAVITY`, `CANVAS_WIDTH`, `SKY_BLUE`
4. **Private methods prefix with underscore**: `_handleKeyDown()`, `_spawnObstacle()`

### Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `get*()` | `getBounds()`, `getHighScore()` | Retrieve value (no side effects) |
| `set*()` | `setSpeed()`, `setState()` | Update value |
| `load*()` | `loadAssets()`, `loadProfile()` | Async data loading |
| `handle*()` | `handleKeyDown()`, `handleCollision()` | Event handlers |
| `render*()` | `renderStartScreen()`, `renderGameOver()` | Drawing functions |
| `draw*()` | `draw()`, `drawHitbox()` | Canvas drawing (called from render) |
| `update*()` | `update()`, `updateObstacles()` | Per-frame logic updates |

### Game Loop Pattern

```javascript
// Standard pattern used throughout codebase
function gameLoop(timestamp) {
    // 1. Calculate delta time (not currently used, but structured for it)
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // 2. Update game state (physics, positions, spawning)
    this.update(deltaTime);

    // 3. Render everything (clear canvas, redraw all objects)
    this.render();

    // 4. Schedule next frame
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
}
```

**Note**: Currently deltaTime is calculated but not used (game runs at frame-locked 60fps). This is intentional for T-Rex game accuracy.

### Canvas Rendering Conventions

```javascript
// 1. Always disable image smoothing for pixel art
ctx.imageSmoothingEnabled = false;

// 2. Clear canvas before rendering each frame
ctx.clearRect(0, 0, canvas.width, canvas.height);

// 3. Draw in layers (back to front)
background.draw(ctx);      // Sky, ground, clouds
obstacleManager.draw(ctx); // Obstacles
character.draw(ctx);       // Player
// UI overlays drawn last

// 4. Use integer coordinates to avoid sub-pixel blurring
ctx.drawImage(sprite, Math.floor(x), Math.floor(y), width, height);
```

### Input Handling Conventions

**Problem**: Game responds to spacebar, but spacebar also scrolls the page.

**Solution**: Always call `event.preventDefault()` for game inputs:

```javascript
handleKeyDown(event) {
    if (event.code === 'Space') {
        this.game.character.jump();
        event.preventDefault(); // Prevent page scroll!
    }
}
```

**Special case**: Auth forms need to allow typing. Check if input is focused:

```javascript
// In input.js
handleKeyDown(event) {
    // Ignore keyboard input when user is typing in auth forms
    if (document.activeElement.tagName === 'INPUT') {
        return; // Don't process game inputs
    }
    // ... rest of input handling
}
```

### Supabase Conventions

1. **Never commit sensitive keys**: API keys in `auth.js` are public "anon" keys (safe to expose)
2. **Always use Row Level Security (RLS)**: Defined in `supabase-setup.sql`
3. **Handle auth state changes**: Listen to `onAuthStateChange()` for session updates
4. **Graceful degradation**: Game works offline (localStorage) without Supabase

---

## Development Workflows

### Making Changes to Gameplay

1. **Identify what to change**:
   - Physics/difficulty → Edit `config.js`
   - Game logic → Edit `game.js`
   - Character behavior → Edit `character.js`
   - Obstacle spawning → Edit `obstacle.js`

2. **Test changes**:
   - Open `index.html` in browser
   - Use browser DevTools console for debugging
   - Test all difficulty levels
   - Test on mobile (responsive mode or real device)

3. **Common change locations**:

   | Want to change... | Edit this file... | Look for... |
   |-------------------|-------------------|-------------|
   | Jump height | `config.js` | `PHYSICS.JUMP_VELOCITY` |
   | Game speed | `config.js` | `DIFFICULTY.[level].INITIAL_SPEED` |
   | Obstacle spacing | `config.js` | `DIFFICULTY.[level].MIN/MAX_OBSTACLE_DISTANCE` |
   | Colors | `config.js` | `COLORS` object |
   | Collision forgiveness | `config.js` | `CHARACTER.HITBOX_PADDING` |
   | Character sprites | `assets/sprites/` | Replace PNG files |

### Git Workflow

**Current branch**: `claude/claude-md-mhymuh49gly0fomm-01FAnF8Ro3FL6ULYfumedT3P`

#### Committing Changes

```bash
# 1. Check status
git status

# 2. Stage changes
git add <files>

# 3. Commit with descriptive message
git commit -m "Brief description of change (what and why)"

# 4. Push to remote
git push -u origin claude/claude-md-mhymuh49gly0fomm-01FAnF8Ro3FL6ULYfumedT3P
```

**Commit message conventions**:
- Start with verb: "Add", "Fix", "Update", "Refactor", "Remove"
- Be specific: "Fix collision detection on small screens" not "Fix bug"
- Reference what changed: "Update jump velocity in config.js"
- Examples from history:
  - ✅ "Fix keyboard input conflict in auth forms - ignore keypresses when typing in input fields"
  - ✅ "Increase jump power to make game easier (JUMP_VELOCITY: -15 → -17)"
  - ❌ "Fixed stuff"
  - ❌ "Updates"

#### Creating Pull Requests

```bash
# 1. Ensure branch is up to date
git fetch origin
git status

# 2. Push your branch
git push -u origin claude/claude-md-mhymuh49gly0fomm-01FAnF8Ro3FL6ULYfumedT3P

# 3. Create PR (provide PR URL to user since `gh` CLI unavailable)
```

### Deployment

**Automatic deployment via GitHub Actions**:
- On push to `main` branch, GitHub Actions deploys to GitHub Pages
- Workflow file: `.github/workflows/static.yml`
- No build step required (static files)

**Manual testing before merge**:
1. Open `index.html` locally
2. Test all game states (start, playing, game over)
3. Test on mobile (Chrome DevTools responsive mode)
4. Test auth flow (signup, login, logout)
5. Test leaderboard displays correctly

---

## Common Tasks & Recipes

### Task 1: Make the Game Easier/Harder

**Edit**: `config.js`

```javascript
// Make game easier:
DIFFICULTY: {
    EASY: {
        INITIAL_SPEED: 3,           // Slower start (was 3)
        MAX_SPEED: 6,               // Lower top speed (was 6)
        MIN_OBSTACLE_DISTANCE: 800, // More space (was 700)
        MAX_OBSTACLE_DISTANCE: 1500 // Even more space (was 1400)
    }
}

// Make jumps higher:
PHYSICS: {
    JUMP_VELOCITY: -20  // Higher jump (was -17)
}

// Make collisions more forgiving:
CHARACTER: {
    HITBOX_PADDING: 16  // More forgiveness (was 12)
}
```

### Task 2: Change Colors/Theme

**Edit**: `config.js` → `COLORS` object

```javascript
COLORS: {
    SKY_BLUE: '#FF6B9D',        // Pink sky instead of blue
    GROUND_BROWN: '#4A4A4A',    // Gray ground
    PIPE_GREEN: '#FF0000',      // Red obstacles
    // ... etc
}
```

**Also consider**: Editing `css/style.css` for UI colors (buttons, modals)

### Task 3: Add a New Obstacle Type

1. **Add sprite**: Place image in `assets/sprites/` (e.g., `goomba.svg`)

2. **Create class** in `obstacle.js`:
   ```javascript
   class Goomba extends Obstacle {
       constructor(x, y) {
           super(x, y, 32, 32, goombaSprite);
           this.type = 'goomba';
       }

       update(gameSpeed) {
           super.update(gameSpeed);
           // Add walking animation or movement logic
       }
   }
   ```

3. **Add to spawn logic** in `ObstacleManager`:
   ```javascript
   spawnObstacle() {
       const types = ['pipe', 'goomba']; // Add new type
       const type = types[Math.floor(Math.random() * types.length)];

       if (type === 'goomba') {
           const goomba = new Goomba(this.canvas.width + 20, groundY - 32);
           this.obstacles.push(goomba);
       }
       // ... handle other types
   }
   ```

4. **Load sprite** in `game.js`:
   ```javascript
   async loadAssets() {
       const [buddy, neet, pipe, cloud, goomba] = await Promise.all([
           this.loadImage('assets/sprites/Buddy.png'),
           this.loadImage('assets/sprites/Neet.png'),
           this.loadImage('assets/sprites/pipe.svg'),
           this.loadImage('assets/sprites/cloud.svg'),
           this.loadImage('assets/sprites/goomba.svg') // Add this
       ]);

       this.goombaSprite = goomba; // Store reference
       this.obstacleManager.goombaSprite = goomba; // Pass to manager
   }
   ```

### Task 4: Add a New Difficulty Level

1. **Add to config** in `config.js`:
   ```javascript
   DIFFICULTY: {
       EASY: { ... },
       MEDIUM: { ... },
       HARD: { ... },
       INSANE: {
           INITIAL_SPEED: 10,
           SPEED_INCREMENT: 0.002,
           MAX_SPEED: 20,
           MIN_OBSTACLE_DISTANCE: 300,
           MAX_OBSTACLE_DISTANCE: 600,
           FIRST_OBSTACLE_DELAY: 500
       }
   }
   ```

2. **Add to UI** in `game.js`:
   ```javascript
   constructor() {
       // ...
       this.speedOptions = ['EASY', 'MEDIUM', 'HARD', 'INSANE'];
   }
   ```

3. **Add to leaderboard tabs** in `index.html`:
   ```html
   <div class="leaderboard-tabs">
       <button class="tab-btn active" data-difficulty="ALL">All</button>
       <button class="tab-btn" data-difficulty="EASY">Easy</button>
       <button class="tab-btn" data-difficulty="MEDIUM">Medium</button>
       <button class="tab-btn" data-difficulty="HARD">Hard</button>
       <button class="tab-btn" data-difficulty="INSANE">Insane</button>
   </div>
   ```

4. **Update CSS** in `style.css` if needed for styling

### Task 5: Debug Collision Issues

**Enable hitbox visualization**:

1. In `character.js`, uncomment debug rendering:
   ```javascript
   draw(ctx) {
       // Draw sprite
       ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

       // DEBUG: Show hitbox
       const bounds = this.getBounds();
       ctx.strokeStyle = 'blue';
       ctx.lineWidth = 2;
       ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
   }
   ```

2. In `obstacle.js`, uncomment debug rendering:
   ```javascript
   draw(ctx) {
       ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

       // DEBUG: Show hitbox
       const bounds = this.getBounds();
       ctx.strokeStyle = 'red';
       ctx.lineWidth = 2;
       ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
   }
   ```

3. Open game in browser and observe collision boxes during gameplay

**Adjust padding** in `config.js` if collisions feel unfair.

### Task 6: Add Sound Effects

1. **Add audio files**: Place MP3/OGG files in `assets/audio/`
   - `jump.mp3`
   - `collision.mp3`
   - `score.mp3`

2. **Create AudioManager class** (new file `js/audio.js`):
   ```javascript
   class AudioManager {
       constructor() {
           this.sounds = {
               jump: new Audio('assets/audio/jump.mp3'),
               collision: new Audio('assets/audio/collision.mp3')
           };
           this.muted = false;
       }

       play(soundName) {
           if (!this.muted && this.sounds[soundName]) {
               this.sounds[soundName].currentTime = 0;
               this.sounds[soundName].play().catch(e => {
                   console.warn('Audio play failed:', e);
               });
           }
       }

       toggleMute() {
           this.muted = !this.muted;
       }
   }
   ```

3. **Initialize in game.js**:
   ```javascript
   constructor() {
       // ...
       this.audioManager = new AudioManager();
   }
   ```

4. **Play sounds at appropriate times**:
   ```javascript
   // In character.js jump method:
   jump() {
       if (!this.isJumping) {
           this.velocityY = this.jumpPower;
           this.isJumping = true;
           // Play sound:
           if (window.game && window.game.audioManager) {
               window.game.audioManager.play('jump');
           }
       }
   }

   // In game.js collision handling:
   if (checkCollisions(...)) {
       this.audioManager.play('collision');
       this.state = 'GAME_OVER';
   }
   ```

5. **Add script tag** to `index.html` (before `game.js`):
   ```html
   <script src="js/audio.js"></script>
   ```

---

## Testing Strategy

### Manual Testing Checklist

Before committing changes, test these scenarios:

**Basic Functionality**:
- [ ] Game loads without console errors
- [ ] Character selection works (left/right arrows, click)
- [ ] Difficulty selection works (up/down arrows, click)
- [ ] Character jumps when spacebar pressed
- [ ] Obstacles spawn and scroll
- [ ] Collision detection works (game ends on hit)
- [ ] Score increases during gameplay
- [ ] High score saves to localStorage

**State Transitions**:
- [ ] LOADING → START (character selection)
- [ ] START → SELECT_SPEED (after selecting character)
- [ ] SELECT_SPEED → PLAYING (after selecting difficulty)
- [ ] PLAYING → GAME_OVER (on collision)
- [ ] GAME_OVER → PLAYING (restart with same character)
- [ ] GAME_OVER → START (return to character selection)

**Difficulty Levels**:
- [ ] Easy mode is playable for beginners
- [ ] Medium mode is moderately challenging
- [ ] Hard mode is difficult but fair
- [ ] Speed increases correctly over time
- [ ] Obstacle spacing matches difficulty settings

**Auth & Leaderboard** (if Supabase is configured):
- [ ] Login modal opens
- [ ] Signup creates new user
- [ ] Login works with existing user
- [ ] Logout clears session
- [ ] Score submits to database after game over
- [ ] Leaderboard displays top scores
- [ ] Personal best shows user's best score
- [ ] Difficulty tabs filter leaderboard correctly

**Mobile/Responsive**:
- [ ] Game scales to fit mobile screen
- [ ] Touch controls work (tap to jump)
- [ ] Character selection works with touch (swipe/tap)
- [ ] Difficulty selection works with touch
- [ ] Modals display correctly on small screens
- [ ] No horizontal scrolling on mobile

**Cross-Browser**:
- [ ] Chrome/Chromium (primary target)
- [ ] Firefox
- [ ] Safari (desktop + iOS)
- [ ] Edge

### Browser DevTools Tips

**Console debugging**:
```javascript
// Access game instance from console
window.game // Main game object
window.game.state // Current game state
window.game.score // Current score
window.game.gameSpeed // Current speed
window.game.obstacleManager.obstacles // Array of obstacles

// Manually trigger state changes
window.game.state = 'PLAYING';
window.game.state = 'GAME_OVER';

// Adjust speed on the fly
window.game.gameSpeed = 20; // Super fast mode

// Check auth state
window.authManager.currentUser
window.authManager.currentProfile
```

**Performance profiling**:
1. Open DevTools → Performance tab
2. Record while playing game
3. Look for frame drops (target: 60fps)
4. Check for memory leaks (shouldn't grow unbounded)

### Known Testing Gotchas

1. **localStorage quota**: Browser may limit localStorage size. Clear with `localStorage.clear()` if testing repeatedly.

2. **Cached assets**: Browser may cache sprites. Hard refresh (Ctrl+Shift+R) to reload.

3. **Supabase rate limits**: Rapid score submissions may hit rate limits. Add delays between test submissions.

4. **Mobile keyboard**: On mobile, keyboard input may not work if auth form is focused. Tap outside form first.

5. **Safari autoplay**: Audio may not play until user interacts with page (Safari restriction).

---

## Important Gotchas

### 1. Script Load Order Matters

**Problem**: JavaScript files have dependencies and must load in correct order.

**Solution**: Always maintain this order in `index.html`:
```html
<script src="js/config.js"></script>       <!-- Must load first -->
<script src="js/constants.js"></script>    <!-- Depends on config -->
<script src="js/storage.js"></script>
<script src="js/collision.js"></script>
<script src="js/background.js"></script>
<script src="js/obstacle.js"></script>
<script src="js/character.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui-controller.js"></script>
<script src="js/input.js"></script>
<script src="js/game.js"></script>        <!-- Must load last -->
```

### 2. Reserved Keywords in Database

**Problem**: "character" is a reserved keyword in PostgreSQL.

**Solution**: Database column is named `character_name`, not `character`. See `supabase-setup.sql`.

**Code impact**: When submitting scores:
```javascript
// ✅ Correct
await supabase.from('scores').insert({
    character_name: 'Buddy',  // Not 'character'
    score: 100
});

// ❌ Wrong
await supabase.from('scores').insert({
    character: 'Buddy',  // Will fail
    score: 100
});
```

### 3. Input Conflicts with Auth Forms

**Problem**: Spacebar triggers both "jump" and "submit" in auth forms.

**Solution**: Check if input field is focused before processing game inputs:

```javascript
// In input.js
handleKeyDown(event) {
    if (document.activeElement.tagName === 'INPUT') {
        return; // User is typing, don't process game input
    }
    // ... rest of input handling
}
```

### 4. Touch vs Mouse Event Handling

**Problem**: Mobile fires both touch and click events, causing double inputs.

**Solution**: Use `event.preventDefault()` in touch handlers to prevent mouse events:

```javascript
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent mouse event from also firing
    this.handleTouch(e);
});
```

### 5. Canvas Scaling and Hitboxes

**Problem**: Canvas may be scaled via CSS, but hitboxes use internal coordinates.

**Solution**: Always use canvas internal coordinates for game logic. CSS scaling is only visual.

```javascript
// ✅ Correct: Use canvas.width/height (internal resolution)
const x = this.canvas.width / 2;

// ❌ Wrong: Use canvas.offsetWidth/offsetHeight (CSS size)
const x = this.canvas.offsetWidth / 2; // This will break hitboxes!
```

### 6. Image Smoothing for Pixel Art

**Problem**: Browser anti-aliases images by default, making pixel art blurry.

**Solution**: Disable image smoothing in canvas context (already done in `game.js`):

```javascript
ctx.imageSmoothingEnabled = false;
```

**Also** add to CSS for canvas element:

```css
#gameCanvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
```

### 7. Supabase Anon Key is Public

**Clarification**: The `anon` key in `auth.js` is safe to expose publicly. It's **not** the service role key.

**Security**: Row Level Security (RLS) policies in database prevent unauthorized access, even with the anon key.

**Do not confuse**:
- `anon` key → Public, frontend use ✅
- `service_role` key → Secret, backend only ❌ (never commit!)

### 8. Obstacle Cleanup

**Problem**: If obstacles aren't removed from array when off-screen, memory usage grows unbounded.

**Solution**: `ObstacleManager` filters out off-screen obstacles every frame:

```javascript
update(gameSpeed) {
    // ... spawn and update logic

    // Remove off-screen obstacles (CRITICAL for memory)
    this.obstacles = this.obstacles.filter(obs => !obs.isOffScreen());
}
```

**Never remove** this filter or memory will leak!

---

## Documentation Map

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | User-facing guide (how to play, features) | Players, general users |
| `CLAUDE.md` | **This file** - AI assistant development guide | AI assistants (Claude, etc.) |
| `PRD.md` | Product Requirements Document | Product managers, developers |
| `CONFIG_GUIDE.md` | Configuration tuning guide | Game designers, tweakers |
| `MOBILE_CONTROLS.md` | Touch controls documentation | Mobile players |
| `SUPABASE_SETUP.md` | Database setup instructions | DevOps, backend setup |
| `AI_CODING_PROMPT.md` | Original AI coding prompt (legacy) | Historical reference |
| `claude.md` | Implementation guide (legacy, outdated) | Historical reference |

**When to update documentation**:
- Add feature → Update `README.md` and `CLAUDE.md`
- Change config → Update `CONFIG_GUIDE.md`
- Change database schema → Update `SUPABASE_SETUP.md`
- Change touch controls → Update `MOBILE_CONTROLS.md`

---

## Quick Reference Card

### File to Edit for Common Changes

| Change | File | Section |
|--------|------|---------|
| Jump height | `config.js` | `PHYSICS.JUMP_VELOCITY` |
| Game speed | `config.js` | `DIFFICULTY.[level].INITIAL_SPEED / MAX_SPEED` |
| Obstacle spacing | `config.js` | `DIFFICULTY.[level].MIN/MAX_OBSTACLE_DISTANCE` |
| Colors | `config.js` | `COLORS` |
| Collision forgiveness | `config.js` | `CHARACTER.HITBOX_PADDING` |
| UI colors/styles | `css/style.css` | Various selectors |
| Character sprites | `assets/sprites/` | Replace Buddy.png / Neet.png |
| Game logic | `js/game.js` | Class methods |
| Physics | `js/character.js` | `update()` method |
| Spawning | `js/obstacle.js` | `ObstacleManager.spawnObstacle()` |

### Most Common Debugging Commands

```javascript
// In browser console:
window.game.state = 'PLAYING';           // Skip to playing
window.game.gameSpeed = 0;               // Pause scrolling
window.game.obstacleManager.obstacles = []; // Clear obstacles
localStorage.clear();                    // Reset high scores
window.authManager.currentUser;          // Check auth state
```

### Physics Formula Reference

```
Jump Height = (JUMP_VELOCITY²) / (2 × GRAVITY)
Air Time = 2 × |JUMP_VELOCITY| / GRAVITY
Terminal Velocity = MAX_FALL_SPEED

Current values (as of v2.0.0):
  Jump Height = (-17)² / (2 × 0.4) = 361 pixels
  Air Time = 2 × 17 / 0.4 = 85 frames (~1.4 seconds at 60fps)
```

---

## Change Log

### v2.0.0 (2025-11-14)
- Added Supabase authentication and leaderboards
- Added global leaderboard with difficulty filtering
- Added user profiles and score tracking
- Fixed PostgreSQL reserved keyword issue (character → character_name)
- Fixed keyboard input conflict in auth forms
- Made leaderboard button always visible
- Increased jump power for easier gameplay

### v1.x (Earlier)
- Initial release with core game mechanics
- Character selection (Buddy and Neet)
- Three difficulty levels
- Mobile touch controls
- localStorage high scores

---

## Contributing Guidelines for AI Assistants

When making changes to this codebase:

1. ✅ **Do**:
   - Read relevant sections of this guide before starting
   - Test changes locally by opening `index.html`
   - Follow existing code style and naming conventions
   - Update documentation if adding features
   - Use `config.js` for tuning values (don't hardcode)
   - Add comments for complex logic
   - Preserve existing functionality unless explicitly asked to change it

2. ❌ **Don't**:
   - Change script load order in `index.html`
   - Hardcode values that belong in `config.js`
   - Remove obstacle cleanup logic (causes memory leaks)
   - Change collision padding without testing (affects gameplay feel)
   - Commit sensitive keys (only `anon` key is safe)
   - Break existing localStorage/Supabase integration
   - Remove backward compatibility in `constants.js`

3. ⚠️ **Be Careful With**:
   - Physics values (GRAVITY, JUMP_VELOCITY) - small changes have big impact
   - Hitbox padding - too forgiving or too strict ruins gameplay
   - Game speed progression - must feel smooth, not jarring
   - Mobile touch regions - must be large enough for fingers
   - Browser compatibility - test changes in multiple browsers

---

## Additional Resources

- **T-Rex Game**: Play at `chrome://dino` to understand gameplay feel
- **Canvas API**: [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Game Loop Pattern**: [MDN Game Development](https://developer.mozilla.org/en-US/docs/Games/Anatomy)

---

**End of CLAUDE.md**

For questions or clarifications about this codebase, refer to:
1. This document (CLAUDE.md) for architecture and conventions
2. `CONFIG_GUIDE.md` for gameplay tuning
3. `README.md` for user-facing features
4. Source code comments for implementation details
