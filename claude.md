# Barkour Game - Implementation Guide

## Task Overview

Build a browser-based endless runner game that clones Chrome's T-Rex game with two key customizations:
1. Player controls one of two selectable dog characters (16x16 bitmaps provided by user)
2. Mario-inspired visual theme (pixel art, color palette, obstacles)

All other mechanics (jump controls, scoring, physics, difficulty scaling) should replicate the original T-Rex game.

---

## Project Goals

- Create a fully functional endless runner game in the browser
- Implement character selection screen for two dog characters
- Design Mario-themed obstacles and environment
- Replicate T-Rex game physics and feel exactly
- Ensure smooth 60 FPS performance
- Add high score persistence via localStorage

---

## Technical Stack

- **HTML5 Canvas:** For game rendering
- **Vanilla JavaScript (ES6+):** Game logic and state management
- **CSS3:** Styling for UI and responsive layout
- **Web Audio API:** For sound effects and background music (optional)

---

## Project Structure

```
barkour-claude/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Game styling
├── js/
│   ├── game.js            # Main game loop and state management
│   ├── character.js       # Dog character class
│   ├── obstacle.js        # Obstacle classes (Pipe, Goomba, Piranha)
│   ├── background.js      # Background rendering (clouds, ground)
│   ├── collision.js       # Collision detection logic
│   ├── input.js           # Keyboard input handling
│   ├── storage.js         # localStorage utilities
│   └── constants.js       # Game constants and configuration
├── assets/
│   ├── sprites/
│   │   ├── dog1.png       # Dog character 1 sprite
│   │   ├── dog2.png       # Dog character 2 sprite
│   │   ├── pipe.png       # Pipe obstacle
│   │   ├── goomba.png     # Goomba enemy
│   │   ├── piranha.png    # Piranha plant
│   │   ├── cloud.png      # Cloud decoration
│   │   └── bush.png       # Bush decoration
│   └── audio/
│       ├── jump.mp3       # Jump sound effect
│       ├── hit.mp3        # Collision sound
│       └── music.mp3      # Background music (loop)
├── PRD.md                 # Product Requirements Document
└── README.md              # Project documentation
```

---

## Implementation Steps

### Phase 1: Canvas Setup and Basic Structure

**Tasks:**
1. Create `index.html` with canvas element and proper viewport settings
2. Set up `style.css` for full-screen canvas and pixel-perfect rendering
3. Create `constants.js` with all game parameters:
   - Physics constants (gravity, jump velocity)
   - Game speed settings
   - Canvas dimensions
   - Color palette
4. Initialize canvas context in `game.js`
5. Implement basic game loop with `requestAnimationFrame`
6. Set up FPS counter for testing

**Key Code (game.js):**
```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

let gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER'
let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

### Phase 2: Character Selection Screen

**Tasks:**
1. Create character selection UI in `game.js`
2. Load dog sprites from assets folder
3. Implement keyboard/click selection logic in `input.js`
4. Store selected character in game state
5. Add visual feedback (highlight selected character)
6. Transition to game on spacebar/enter press

**Key Features:**
- Display both dog options side-by-side
- Arrow keys to navigate, space to confirm
- Visual indicator for selected character
- Smooth transition to gameplay

**Code Structure:**
```javascript
// In game.js
function renderCharacterSelection() {
  ctx.fillStyle = '#5C94FC'; // Mario sky blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.fillStyle = '#000';
  ctx.font = '32px "Press Start 2P"'; // Pixel font
  ctx.fillText('SELECT YOUR DOG', 200, 100);

  // Draw dog options
  drawDogOption(dog1Sprite, 250, 200, selectedIndex === 0);
  drawDogOption(dog2Sprite, 450, 200, selectedIndex === 1);

  // Instructions
  ctx.font = '16px "Press Start 2P"';
  ctx.fillText('PRESS SPACE TO START', 220, 350);
}
```

### Phase 3: Character Physics and Movement

**Tasks:**
1. Create `Character` class in `character.js`
2. Implement properties: x, y, velocityY, isJumping, sprite
3. Implement jump method with T-Rex game physics:
   - Initial jump velocity: -10
   - Gravity: 0.6
   - Ground position detection
4. Add running animation (2-3 sprite frames)
5. Handle spacebar input for jumping in `input.js`

**Character Class (character.js):**
```javascript
class Character {
  constructor(sprite, x, y) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.width = 32; // Scaled from 16x16
    this.height = 32;
    this.velocityY = 0;
    this.isJumping = false;
    this.gravity = 0.6;
    this.jumpPower = -10;
    this.groundY = 300; // Adjust based on canvas height
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = this.jumpPower;
      this.isJumping = true;
      // Play jump sound
    }
  }

  update() {
    // Apply gravity
    this.velocityY += this.gravity;
    this.y += this.velocityY;

    // Ground collision
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

  draw(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
```

### Phase 4: Background and Environment

**Tasks:**
1. Create `Background` class in `background.js`
2. Implement scrolling ground with Mario-style tiles
3. Add parallax cloud movement
4. Draw bushes/decorations
5. Ensure infinite scrolling (wrap around)

**Key Visual Elements:**
- Sky: Solid `#5C94FC` color
- Ground: Repeating brick pattern (brown/orange)
- Clouds: White pixel art, slow movement
- Bushes: Green pixel art, same speed as obstacles

**Background Rendering:**
```javascript
class Background {
  constructor(canvas) {
    this.canvas = canvas;
    this.groundY = 300;
    this.groundSpeed = 0; // Syncs with game speed
    this.groundOffset = 0;
    this.clouds = [
      { x: 100, y: 50 },
      { x: 400, y: 80 },
      { x: 700, y: 60 }
    ];
  }

  update(gameSpeed) {
    // Scroll ground
    this.groundOffset -= gameSpeed;
    if (this.groundOffset <= -16) {
      this.groundOffset = 0;
    }

    // Move clouds (slower parallax)
    this.clouds.forEach(cloud => {
      cloud.x -= gameSpeed * 0.3;
      if (cloud.x < -50) {
        cloud.x = this.canvas.width + 50;
      }
    });
  }

  draw(ctx) {
    // Sky
    ctx.fillStyle = '#5C94FC';
    ctx.fillRect(0, 0, this.canvas.width, this.groundY);

    // Ground
    ctx.fillStyle = '#C84C0C'; // Mario ground brown
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

    // Draw ground tiles (16x16 pattern)
    // ... tile rendering logic

    // Clouds
    this.clouds.forEach(cloud => {
      ctx.drawImage(cloudSprite, cloud.x, cloud.y);
    });
  }
}
```

### Phase 5: Obstacles

**Tasks:**
1. Create base `Obstacle` class in `obstacle.js`
2. Extend for each type: `Pipe`, `Goomba`, `Piranha`
3. Implement obstacle spawning logic:
   - Random intervals (200-600px apart)
   - Random obstacle type selection
   - Progressive spawn rate increase
4. Add obstacle movement (scrolls left at game speed)
5. Remove off-screen obstacles from array

**Obstacle System:**
```javascript
class Obstacle {
  constructor(x, y, width, height, sprite) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sprite = sprite;
  }

  update(gameSpeed) {
    this.x -= gameSpeed;
  }

  draw(ctx) {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class Pipe extends Obstacle {
  constructor(x, height) {
    const y = 300 - height;
    super(x, y, 32, height, pipeSprite);
  }
}

// Obstacle Manager
class ObstacleManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.obstacles = [];
    this.nextObstacleDistance = 300;
    this.distanceSinceLastObstacle = 0;
  }

  spawnObstacle() {
    const types = ['pipe', 'goomba', 'piranha'];
    const type = types[Math.floor(Math.random() * types.length)];

    const x = this.canvas.width + 20;

    switch(type) {
      case 'pipe':
        this.obstacles.push(new Pipe(x, 48 + Math.random() * 32));
        break;
      case 'goomba':
        this.obstacles.push(new Goomba(x));
        break;
      case 'piranha':
        this.obstacles.push(new Piranha(x));
        break;
    }

    this.nextObstacleDistance = 200 + Math.random() * 400;
  }

  update(gameSpeed) {
    this.distanceSinceLastObstacle += gameSpeed;

    if (this.distanceSinceLastObstacle >= this.nextObstacleDistance) {
      this.spawnObstacle();
      this.distanceSinceLastObstacle = 0;
    }

    // Update all obstacles
    this.obstacles.forEach(obstacle => obstacle.update(gameSpeed));

    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffScreen());
  }

  draw(ctx) {
    this.obstacles.forEach(obstacle => obstacle.draw(ctx));
  }
}
```

### Phase 6: Collision Detection

**Tasks:**
1. Create collision detection function in `collision.js`
2. Use axis-aligned bounding box (AABB) collision
3. Add slight hitbox reduction for fairness (reduce by 2-3px on each side)
4. Trigger game over on collision

**Collision Detection (collision.js):**
```javascript
function checkCollision(rect1, rect2) {
  // Add slight padding for fairness (reduce hitbox by 4px)
  const padding = 4;

  return rect1.x + padding < rect2.x + rect2.width - padding &&
         rect1.x + rect1.width - padding > rect2.x + padding &&
         rect1.y + padding < rect2.y + rect2.height - padding &&
         rect1.y + rect1.height - padding > rect2.y + padding;
}

function checkCollisions(character, obstacles) {
  const charBounds = character.getBounds();

  for (let obstacle of obstacles) {
    const obsBounds = obstacle.getBounds();
    if (checkCollision(charBounds, obsBounds)) {
      return true; // Collision detected
    }
  }

  return false;
}
```

### Phase 7: Score System

**Tasks:**
1. Implement score counter in `game.js`
2. Increment score based on frames/distance
3. Display score in top-right corner
4. Load high score from localStorage on start
5. Save high score on game over if beaten
6. Display both current and high score

**Score Implementation:**
```javascript
class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.scoreIncrement = 0.5; // Points per frame
  }

  update() {
    this.score += this.scoreIncrement;
  }

  reset() {
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      this.saveHighScore();
    }
    this.score = 0;
  }

  loadHighScore() {
    return parseInt(localStorage.getItem('barkour_highscore') || '0');
  }

  saveHighScore() {
    localStorage.setItem('barkour_highscore', this.highScore.toString());
  }

  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.font = '16px "Press Start 2P"';

    // High score
    ctx.fillText(`HI: ${String(this.highScore).padStart(5, '0')}`, 20, 30);

    // Current score
    ctx.fillText(`SCORE: ${String(Math.floor(this.score)).padStart(5, '0')}`, 250, 30);
  }
}
```

### Phase 8: Game States and Flow

**Tasks:**
1. Implement state machine: START → PLAYING → GAME_OVER
2. Handle transitions between states
3. Render appropriate UI for each state
4. Implement restart functionality
5. Add "return to character selection" option on game over

**State Management:**
```javascript
let gameState = 'START'; // START, PLAYING, GAME_OVER

function update(deltaTime) {
  switch(gameState) {
    case 'START':
      // Handle character selection
      break;

    case 'PLAYING':
      // Update game speed
      gameSpeed = Math.min(gameSpeed + 0.001, 13);

      // Update game objects
      character.update();
      background.update(gameSpeed);
      obstacleManager.update(gameSpeed);
      scoreManager.update();

      // Check collisions
      if (checkCollisions(character, obstacleManager.obstacles)) {
        gameState = 'GAME_OVER';
        scoreManager.reset();
        // Play hit sound
      }
      break;

    case 'GAME_OVER':
      // Wait for restart input
      break;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch(gameState) {
    case 'START':
      renderCharacterSelection();
      break;

    case 'PLAYING':
      background.draw(ctx);
      obstacleManager.draw(ctx);
      character.draw(ctx);
      scoreManager.draw(ctx);
      break;

    case 'GAME_OVER':
      background.draw(ctx);
      obstacleManager.draw(ctx);
      character.draw(ctx);
      renderGameOver();
      break;
  }
}
```

### Phase 9: Input Handling

**Tasks:**
1. Create centralized input handler in `input.js`
2. Handle spacebar for jump/start/restart
3. Handle arrow keys for character selection
4. Handle 'C' key to return to character selection
5. Prevent default spacebar scrolling

**Input System (input.js):**
```javascript
class InputHandler {
  constructor(game) {
    this.game = game;

    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleKeyDown(event) {
    switch(this.game.state) {
      case 'START':
        if (event.code === 'ArrowLeft') {
          this.game.selectPreviousCharacter();
        } else if (event.code === 'ArrowRight') {
          this.game.selectNextCharacter();
        } else if (event.code === 'Space' || event.code === 'Enter') {
          this.game.startGame();
          event.preventDefault();
        }
        break;

      case 'PLAYING':
        if (event.code === 'Space') {
          this.game.character.jump();
          event.preventDefault();
        }
        break;

      case 'GAME_OVER':
        if (event.code === 'Space') {
          this.game.restart();
          event.preventDefault();
        } else if (event.code === 'KeyC') {
          this.game.returnToCharacterSelection();
        }
        break;
    }
  }

  handleKeyUp(event) {
    // Handle key release if needed
  }
}
```

### Phase 10: Audio Integration (Optional)

**Tasks:**
1. Load audio assets in `game.js`
2. Play jump sound on jump
3. Play hit sound on collision
4. Loop background music during gameplay
5. Add mute toggle functionality

**Audio Setup:**
```javascript
class AudioManager {
  constructor() {
    this.sounds = {
      jump: new Audio('assets/audio/jump.mp3'),
      hit: new Audio('assets/audio/hit.mp3'),
      music: new Audio('assets/audio/music.mp3')
    };

    this.sounds.music.loop = true;
    this.muted = false;
  }

  play(soundName) {
    if (!this.muted && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play();
    }
  }

  startMusic() {
    if (!this.muted) {
      this.sounds.music.play();
    }
  }

  stopMusic() {
    this.sounds.music.pause();
    this.sounds.music.currentTime = 0;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    }
  }
}
```

### Phase 11: Polish and Optimization

**Tasks:**
1. Add pixel-perfect rendering (disable image smoothing)
2. Implement running animation for dog sprites
3. Add visual effects (dust clouds on jump/landing)
4. Optimize canvas rendering (dirty rectangles if needed)
5. Test on different screen sizes
6. Add loading screen for assets
7. Implement FPS cap at 60

**Rendering Optimization:**
```javascript
// Disable image smoothing for pixel-perfect sprites
ctx.imageSmoothingEnabled = false;

// Asset preloading
async function preloadAssets() {
  const assets = [
    'assets/sprites/dog1.png',
    'assets/sprites/dog2.png',
    'assets/sprites/pipe.png',
    // ... more assets
  ];

  const promises = assets.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  });

  return Promise.all(promises);
}

// Initialize game after assets load
preloadAssets().then(loadedAssets => {
  initGame(loadedAssets);
  startGameLoop();
});
```

---

## Key Implementation Details

### T-Rex Game Physics Replication

To accurately replicate the T-Rex game feel:

1. **Jump Arc:**
   - Initial velocity: -10
   - Gravity: 0.6 per frame
   - This creates the characteristic parabolic arc

2. **Game Speed:**
   - Start: 6 pixels/frame
   - Increment: 0.001 per frame
   - Max: 13 pixels/frame

3. **Collision Timing:**
   - Check collisions BEFORE rendering
   - Use slightly smaller hitboxes than sprites (reduce by 4px total)

4. **Obstacle Spacing:**
   - Minimum gap: 200px
   - Maximum gap: 600px
   - First obstacle spawns after 1 second

### Mario Theme Guidelines

**Color Palette:**
```css
--mario-sky-blue: #5C94FC;
--mario-ground-brown: #C84C0C;
--mario-pipe-green: #00A800;
--mario-goomba-brown: #9C5028;
--mario-block-orange: #F89028;
```

**Sprite Style:**
- 8-bit pixel art
- Clean outlines (black, 1px)
- Limited color palette (3-4 colors per sprite)
- No anti-aliasing
- Square pixels

**Obstacles:**
- Green pipes: Classic Mario pipe design (green with black outline, highlight details)
- Goombas: Brown mushroom enemies with angry eyes
- Piranha Plants: Red with white spots, green stem

---

## Testing Checklist

### Functional Testing
- [ ] Character selection displays both dogs correctly
- [ ] Arrow keys navigate selection
- [ ] Spacebar starts game from selection screen
- [ ] Character jumps when spacebar pressed during game
- [ ] Jump physics feel responsive (T-Rex game comparison)
- [ ] Obstacles spawn at appropriate intervals
- [ ] All three obstacle types appear randomly
- [ ] Collision detection is accurate (no false positives/negatives)
- [ ] Game over triggers on collision
- [ ] Score increments correctly during gameplay
- [ ] High score saves and loads from localStorage
- [ ] Spacebar restarts game from game over screen
- [ ] 'C' key returns to character selection from game over

### Visual Testing
- [ ] Game runs at 60 FPS consistently
- [ ] Sprites render without blurring (pixel-perfect)
- [ ] Background scrolls smoothly
- [ ] Clouds move at parallax speed
- [ ] Character animation plays smoothly
- [ ] Game is playable at different window sizes
- [ ] UI elements (score) are readable
- [ ] Mario theme is recognizable and cohesive

### Audio Testing (if implemented)
- [ ] Jump sound plays on jump
- [ ] Hit sound plays on collision
- [ ] Background music loops without gap
- [ ] Mute toggle works correctly
- [ ] No audio lag or stuttering

### Performance Testing
- [ ] Game loads in < 2 seconds
- [ ] No memory leaks during extended play
- [ ] Obstacle array doesn't grow unbounded
- [ ] Game works on Chrome, Firefox, Safari, Edge

---

## Common Pitfalls to Avoid

1. **Canvas Blurry Sprites:**
   - Set `ctx.imageSmoothingEnabled = false`
   - Use integer coordinates for drawing (no decimals)

2. **Inconsistent Frame Rate:**
   - Use `deltaTime` for frame-independent movement
   - Cap game speed increments appropriately

3. **Collision Detection Issues:**
   - Reduce hitboxes by 4-6px for fairness
   - Check collisions before rendering
   - Debug with visible hitboxes during development

4. **Memory Leaks:**
   - Remove off-screen obstacles from array
   - Don't create new audio objects every time
   - Clear intervals/timeouts on game over

5. **Input Lag:**
   - Use `keydown` event, not `keyup` for jump
   - Prevent default spacebar behavior (page scroll)
   - Check `!isJumping` before allowing jump

6. **State Management:**
   - Use clear state machine (START, PLAYING, GAME_OVER)
   - Reset all game variables on restart
   - Don't update game objects in wrong state

---

## Debug Tools

**Useful debug overlays to add during development:**

```javascript
// FPS counter
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;

function updateFPS(timestamp) {
  frameCount++;
  if (timestamp - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = timestamp;
  }
}

function drawDebugInfo(ctx) {
  ctx.fillStyle = '#000';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${fps}`, 10, 10);
  ctx.fillText(`Speed: ${gameSpeed.toFixed(2)}`, 10, 25);
  ctx.fillText(`Score: ${score.toFixed(0)}`, 10, 40);
  ctx.fillText(`Obstacles: ${obstacles.length}`, 10, 55);
}

// Hitbox visualization
function drawHitbox(ctx, bounds) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}
```

---

## Asset Creation Tips

### For Dog Sprites:
- User provides 16x16 bitmaps
- You'll need to scale 2x for canvas (32x32)
- Request at least 2 frames for running animation
- Ensure transparent background (PNG with alpha)

### For Obstacles:
- Create in pixel art editor (Aseprite, Piskel, Photoshop)
- Use Mario game screenshots as reference
- Keep to 16x16 or 32x32 dimensions
- Export as PNG with transparency

### Placeholder Assets:
If assets aren't ready, use colored rectangles:
```javascript
// Temporary dog sprite
ctx.fillStyle = '#FF6B6B';
ctx.fillRect(character.x, character.y, 32, 32);

// Temporary pipe
ctx.fillStyle = '#00A800';
ctx.fillRect(obstacle.x, obstacle.y, 32, obstacle.height);
```

---

## Next Steps After Implementation

1. **Playtesting:**
   - Get feedback on difficulty curve
   - Adjust obstacle spacing and spawn rate
   - Fine-tune jump physics if needed

2. **Performance Optimization:**
   - Profile with browser DevTools
   - Optimize rendering pipeline
   - Reduce unnecessary calculations

3. **Accessibility:**
   - Add keyboard shortcuts guide
   - Implement screen reader support (optional)
   - Add color-blind friendly mode (optional)

4. **Deployment:**
   - Host on GitHub Pages / Netlify / Vercel
   - Optimize assets (compress images)
   - Add meta tags for social sharing

---

## Resources

- **T-Rex Game Source:** Study Chrome's implementation at `chrome://dino`
- **Pixel Fonts:** Use "Press Start 2P" from Google Fonts
- **Mario Sprite References:** Search "Mario NES sprite sheet" for style guide
- **Canvas API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Game Loop Pattern:** https://developer.mozilla.org/en-US/docs/Games/Anatomy

---

## Success Criteria

The game is complete when:
- ✅ Both dog characters are selectable and playable
- ✅ Jump controls match T-Rex game feel exactly
- ✅ At least 2 obstacle types spawn randomly
- ✅ Mario visual theme is cohesive and recognizable
- ✅ Score tracking and high score persistence work
- ✅ Game runs at stable 60 FPS
- ✅ Game over and restart flow works smoothly
- ✅ Game is playable and fun for 5+ minute sessions

---

## Implementation Priority

**MVP (Minimum Viable Product):**
1. Basic game loop and canvas setup
2. Single dog character with jump physics
3. One obstacle type (pipe)
4. Collision detection and game over
5. Score display
6. Restart functionality

**Version 1.0 (Full Feature Set):**
1. Character selection for both dogs
2. Three obstacle types
3. Mario-themed visuals
4. High score persistence
5. Background parallax
6. Polish and animations

**Version 1.1 (Enhanced):**
1. Sound effects and music
2. Multiple difficulty modes
3. Additional visual effects
4. Mobile support

---

Good luck building Barkour! Remember to test frequently and compare the feel to the original T-Rex game to ensure the physics are accurate.
