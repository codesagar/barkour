# Product Requirements Document: Barkour Game

## 1. Project Overview

**Project Name:** Barkour

**Description:** A browser-based endless runner game inspired by Chrome's T-Rex game with a Mario-themed aesthetic and featuring custom dog characters.

**Target Platform:** Web Browser (HTML5 Canvas)

**Core Concept:** Players control one of two selectable dog characters running through a Mario-inspired world, jumping over obstacles to achieve the highest score possible.

---

## 2. Game Objectives

- Create an engaging endless runner that captures the addictive simplicity of Chrome's T-Rex game
- Showcase custom dog characters with personality
- Deliver a nostalgic Mario-themed visual and audio experience
- Provide instant playability with minimal learning curve

---

## 3. Core Features

### 3.1 Character Selection
- **Pre-game Screen:** Character selection menu before game starts
- **Two Dog Options:** Display both dog characters (16x16 bitmap sprites)
- **Selection Method:** Arrow keys or click to select, Enter/Space to confirm
- **Visual Feedback:** Highlight selected character

### 3.2 Gameplay Mechanics
- **Auto-running:** Character runs automatically from left to right
- **Jump Control:** Spacebar to jump (identical to T-Rex game)
- **Gravity & Physics:** Replicate T-Rex game jump arc and timing
- **Collision Detection:** Game ends when dog collides with obstacles
- **Difficulty Scaling:** Game speed increases gradually over time

### 3.3 Obstacles
- **Mario-themed Obstacles:**
  - Pipes (green pipes in various heights)
  - Goombas (walking enemies)
  - Piranha Plants (stationary)
- **Obstacle Patterns:** Randomized spawn with appropriate spacing
- **Progressive Difficulty:** Faster spawn rate and speed as score increases

### 3.4 Scoring System
- **Point Accumulation:** Points increase based on distance traveled
- **High Score Tracking:** Store and display personal best (localStorage)
- **Score Display:** Real-time score counter in top-right corner
- **High Score Display:** Show "HI" score alongside current score

### 3.5 Visual Theme (Mario-inspired)
- **Background:** Pixel art sky with clouds and bushes (Mario style)
- **Ground:** Brick/block pattern similar to Mario levels
- **Color Palette:**
  - Sky: Light blue (#5C94FC)
  - Ground: Brown/orange blocks
  - Obstacles: Classic Mario colors (green pipes, brown Goombas)
- **Pixel Art Style:** 8-bit aesthetic consistent with original Mario games

### 3.6 Audio (Optional but Recommended)
- **Background Music:** 8-bit chiptune track (Mario-style)
- **Jump Sound:** Classic Mario jump sound effect
- **Collision Sound:** Game over sound effect
- **Point Milestone Sounds:** Sound effect at score milestones

---

## 4. User Interface

### 4.1 Start Screen
```
┌─────────────────────────────────────┐
│         BARKOUR GAME                │
│                                     │
│   Select Your Character:            │
│                                     │
│   [Dog 1]    [Dog 2]               │
│   (16x16)    (16x16)               │
│                                     │
│   Press SPACE to Start              │
└─────────────────────────────────────┘
```

### 4.2 Game Screen
```
┌─────────────────────────────────────┐
│ HI: 00000  SCORE: 00000            │
│                                     │
│      ☁️        ☁️                  │
│                                     │
│  🐕                  🌵             │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
└─────────────────────────────────────┘
```

### 4.3 Game Over Screen
```
┌─────────────────────────────────────┐
│         GAME OVER!                  │
│                                     │
│    Your Score: 00000                │
│    High Score: 00000                │
│                                     │
│   Press SPACE to Restart            │
│   Press C to Change Character       │
└─────────────────────────────────────┘
```

---

## 5. Controls

| Input | Action |
|-------|--------|
| Spacebar | Jump (during game) / Start game / Restart |
| Arrow Keys / Click | Select character (pre-game screen) |
| Enter | Confirm selection |
| C | Return to character selection (game over screen) |

---

## 6. Technical Requirements

### 6.1 Technology Stack
- **Frontend:** HTML5 Canvas
- **Scripting:** Vanilla JavaScript (ES6+)
- **Styling:** CSS3
- **Assets:**
  - 16x16 bitmap sprites for dogs (user-provided)
  - Custom or sourced Mario-themed obstacle sprites
  - Background elements (clouds, bushes, ground tiles)

### 6.2 Performance Requirements
- **Frame Rate:** 60 FPS
- **Responsive:** Scale to different screen sizes while maintaining aspect ratio
- **Load Time:** < 2 seconds on standard broadband
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

### 6.3 Data Persistence
- **Local Storage:** Save high score per character
- **Session Data:** Track current game state

---

## 7. Game Parameters (T-Rex Clone Reference)

### 7.1 Physics Constants
```javascript
GRAVITY = 0.6
JUMP_VELOCITY = -10
MAX_FALL_SPEED = 10
GROUND_Y_POSITION = canvas.height - 50
```

### 7.2 Game Speed
```javascript
INITIAL_SPEED = 6
SPEED_INCREMENT = 0.001 (per frame)
MAX_SPEED = 13
```

### 7.3 Character Dimensions
```javascript
CHARACTER_WIDTH = 32 (scaled from 16x16)
CHARACTER_HEIGHT = 32 (scaled from 16x16)
```

### 7.4 Obstacle Spawning
```javascript
MIN_OBSTACLE_DISTANCE = 200
MAX_OBSTACLE_DISTANCE = 600
FIRST_OBSTACLE_DELAY = 1000ms
```

---

## 8. Asset Requirements

### 8.1 Dog Sprites (User-Provided)
- Dog Character 1: 16x16 bitmap (multiple frames for running animation)
- Dog Character 2: 16x16 bitmap (multiple frames for running animation)

### 8.2 Obstacle Sprites (To Be Created)
- Green Pipe: Multiple heights (small, medium, tall)
- Goomba: 16x16, walking animation (2 frames)
- Piranha Plant: 16x16, emerging animation (2-3 frames)

### 8.3 Background Elements
- Cloud: 32x16 pixel art
- Bush: 32x16 pixel art
- Ground Tile: 16x16 repeating pattern
- Sky: Solid color or gradient

### 8.4 UI Elements
- Font: Pixel/retro font for score display
- Game Over text overlay

---

## 9. User Stories

1. **As a player**, I want to select my favorite dog character so I can personalize my gameplay experience
2. **As a player**, I want simple one-button controls so I can start playing immediately without a tutorial
3. **As a player**, I want to see my score increase so I feel a sense of progression
4. **As a player**, I want to beat my high score so I have a reason to replay
5. **As a player**, I want Mario-themed visuals so the game feels nostalgic and fun
6. **As a player**, I want the game to get progressively harder so it remains challenging
7. **As a player**, I want instant restarts so I can quickly try again after failing

---

## 10. Success Criteria

### 10.1 Functional Requirements
- ✅ Character selection works correctly
- ✅ Jump mechanic feels responsive (< 100ms input lag)
- ✅ Collision detection is accurate (no unfair hits)
- ✅ Score tracking works correctly
- ✅ High score persists between sessions
- ✅ Game difficulty scales appropriately

### 10.2 Quality Requirements
- ✅ Game runs at stable 60 FPS
- ✅ Visual theme is cohesive and recognizable as Mario-inspired
- ✅ Controls are intuitive (no tutorial needed)
- ✅ Game is playable on different screen sizes

### 10.3 Player Experience
- ✅ First-time player can start playing within 10 seconds
- ✅ Game loop is addictive (players want to beat their score)
- ✅ Visual feedback is clear (easy to see obstacles and character)

---

## 11. Future Enhancements (Post-MVP)

- **Power-ups:** Mushrooms for invincibility, stars for speed boost
- **Multiple Worlds:** Different Mario-themed backgrounds (underground, castle, etc.)
- **Leaderboard:** Global high scores
- **Mobile Support:** Touch controls for mobile devices
- **Sound Toggle:** Mute/unmute audio
- **Additional Characters:** More dog variations
- **Day/Night Cycle:** Visual variation as game progresses
- **Achievements:** Unlock badges for milestones

---

## 12. Development Phases

### Phase 1: Core Game Loop (Week 1)
- Basic canvas setup
- Character movement and jump physics
- Single obstacle type (pipe)
- Collision detection
- Score tracking

### Phase 2: Character Selection (Week 1)
- Pre-game character selection screen
- Load and display dog sprites
- Selection state management

### Phase 3: Visual Theme (Week 2)
- Mario-inspired background
- Ground and obstacle sprites
- UI styling and fonts

### Phase 4: Obstacle Variety (Week 2)
- Add Goomba and Piranha Plant obstacles
- Randomized obstacle spawning
- Difficulty progression

### Phase 5: Polish & Audio (Week 3)
- Sound effects and music
- Animations and visual effects
- High score persistence
- Bug fixes and optimization

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dog sprites need animation frames | Medium | Request multiple frames from user or create simple animations |
| Asset creation takes longer than expected | Medium | Use placeholder assets initially, replace later |
| Performance issues on older browsers | Low | Optimize canvas rendering, test early |
| Mario assets copyright concerns | High | Use original pixel art "inspired by" not copied |

---

## 14. Constraints

- Must work in modern web browsers without plugins
- Must use provided 16x16 dog bitmaps
- Must replicate T-Rex game mechanics accurately
- Must avoid direct copyright infringement (Mario-inspired, not copied)

---

## Appendix: Chrome T-Rex Game Reference

**Original Game Mechanics to Replicate:**
- Single-button jump control
- Automatic forward movement
- Progressive speed increase
- Obstacle collision = game over
- Score based on distance
- High score tracking
- Simple grayscale aesthetic (adapted to Mario colors for this project)
- Running animation (2-3 frames)
- Day/night transition (optional for MVP)
