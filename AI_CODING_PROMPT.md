# AI Coding Environment Prompt - Barkour Game

Copy and paste this prompt into any AI coding environment (Bolt.dev, v0.dev, Lovable, Replit, etc.):

---

Build a browser-based endless runner game called **Barkour** - a clone of Chrome's T-Rex dinosaur game with these customizations:

**Core Mechanics (identical to T-Rex game):**
- Player jumps with spacebar to avoid obstacles
- Game speed gradually increases over time
- Collision ends the game
- Score increments based on distance/time survived
- High score saved in localStorage

**Customizations:**
1. **Character Selection Screen**: Player chooses between 2 dog characters before starting
2. **Mario-Themed Visuals**: Use Super Mario Bros pixel art style
   - Sky blue background (#5C94FC)
   - Green pipes as obstacles
   - Brown Goomba enemies
   - Pixel art aesthetic throughout

**Tech Stack:**
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for rendering
- CSS for UI styling
- No frameworks, no build tools, no npm dependencies

**Game Flow:**
1. START: Character selection screen (2 dog options, navigate with arrow keys, select with spacebar)
2. PLAYING: Endless runner gameplay
3. GAME_OVER: Show score, high score, restart with spacebar or return to character selection with 'C'

**Essential Features:**
- Jump physics: Initial velocity -10, gravity 0.6 (same as T-Rex game)
- Game speed: Start at 6, increase to max 13
- Obstacles: Randomly spawn pipes, goombas, or piranha plants
- Obstacle spacing: 200-600px apart
- Score display in top corner
- Smooth 60 FPS rendering
- Pixel-perfect sprite rendering (disable canvas image smoothing)

**Game Objects Needed:**
- Character class (position, velocity, jump, collision bounds)
- Obstacle classes (Pipe, Goomba, Piranha with different sizes)
- Background (scrolling ground, parallax clouds)
- Score manager (current score, high score, localStorage)
- Input handler (spacebar jump, arrow keys for menu)
- Collision detection (AABB with slight hitbox padding for fairness)

**Visual Requirements:**
- All sprites should be pixel art style
- Dog characters: 32x32 pixels (use simple colored squares as placeholders)
- Obstacles: 32-48 pixels tall
- Mario color palette: pipe green (#00A800), goomba brown (#9C5028), sky blue (#5C94FC)

**Implementation Notes:**
- Use requestAnimationFrame for game loop
- Set `ctx.imageSmoothingEnabled = false` for crisp pixels
- Remove off-screen obstacles to prevent memory leaks
- Use state machine: START → PLAYING → GAME_OVER

Make it feel exactly like the Chrome T-Rex game but with dogs and Mario visuals. The game should be immediately playable when deployed.

---

**EVEN SHORTER VERSION (if character limit is an issue):**

---

Build Chrome's T-Rex dinosaur game clone in vanilla JavaScript with these changes:
1. Add character selection screen (choose between 2 dogs)
2. Use Mario-themed pixel art (pipes, goombas, sky blue background)
3. Same physics: jump velocity -10, gravity 0.6, increasing speed
4. HTML5 Canvas, no frameworks, localStorage high score
5. Game states: character selection → playing → game over
6. Pixel-perfect rendering, 60 FPS, AABB collision detection
Make it feel identical to the original T-Rex game.

---
