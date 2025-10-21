# Barkour Game Configuration Guide

This guide explains how to customize your game using the `js/config.js` file.

## Quick Start

All game parameters are now centralized in **`js/config.js`**. Simply edit the values in that file to customize your game!

---

## Configuration Sections

### 1. Display Settings

```javascript
CANVAS: {
    WIDTH: 800,    // Game canvas width in pixels
    HEIGHT: 400    // Game canvas height in pixels
}

GROUND: {
    Y_POSITION: 300,  // Where the ground starts (higher = lower on screen)
    HEIGHT: 100       // Height of the ground area
}
```

---

### 2. Physics Settings

Control how the character moves and jumps:

```javascript
PHYSICS: {
    GRAVITY: 0.6,              // How fast character falls (0.5 = slow, 1.0 = fast)
    JUMP_VELOCITY: -12,        // Jump power (more negative = higher jump)
                              // Try: -10 (lower), -14 (higher)
    MAX_FALL_SPEED: 10        // Terminal velocity when falling
}
```

**Tuning Tips:**
- **Can't jump high enough?** Decrease `JUMP_VELOCITY` (e.g., -14 or -15)
- **Jumping too high?** Increase `JUMP_VELOCITY` (e.g., -10 or -11)
- **Falls too slow?** Increase `GRAVITY` (e.g., 0.8 or 1.0)
- **Falls too fast?** Decrease `GRAVITY` (e.g., 0.4 or 0.5)

---

### 3. Difficulty Profiles

Each difficulty level (Easy/Medium/Hard) has its own settings:

```javascript
DIFFICULTY: {
    EASY: {
        INITIAL_SPEED: 3,           // Starting scroll speed
        SPEED_INCREMENT: 0.0003,    // Speed increase per frame (very gradual)
        MAX_SPEED: 6,               // Maximum speed cap

        MIN_OBSTACLE_DISTANCE: 350, // Closest pipes can spawn (pixels)
        MAX_OBSTACLE_DISTANCE: 700, // Farthest pipes can spawn (pixels)
        FIRST_OBSTACLE_DELAY: 2000  // Delay before first pipe (milliseconds)
    }
}
```

**Tuning Tips:**
- **Too fast?** Decrease `INITIAL_SPEED`, `MAX_SPEED`, and `SPEED_INCREMENT`
- **Too slow?** Increase these values
- **Pipes too close together?** Increase `MIN_OBSTACLE_DISTANCE` and `MAX_OBSTACLE_DISTANCE`
- **Pipes too far apart?** Decrease these values
- **Need more time to prepare?** Increase `FIRST_OBSTACLE_DELAY`

**Recommended Settings:**

| Difficulty | Initial | Max | Increment | Min Dist | Max Dist | Delay |
|-----------|---------|-----|-----------|----------|----------|-------|
| **Very Easy** | 2 | 5 | 0.0002 | 400 | 800 | 3000 |
| **Easy** | 3 | 6 | 0.0003 | 350 | 700 | 2000 |
| **Medium** | 5 | 9 | 0.0006 | 250 | 550 | 1500 |
| **Hard** | 6 | 13 | 0.001 | 200 | 450 | 1000 |
| **Very Hard** | 8 | 15 | 0.0015 | 150 | 350 | 500 |

---

### 4. Character Settings

```javascript
CHARACTER: {
    WIDTH: 32,             // Character sprite width
    HEIGHT: 32,            // Character sprite height
    X_POSITION: 100,       // Fixed X position (distance from left edge)
    HITBOX_PADDING: 4      // Shrink hitbox for fairer collisions
                          // Higher = more forgiving (0-6 recommended)
}
```

**Tuning Tips:**
- **Collisions feel unfair?** Increase `HITBOX_PADDING` (try 6 or 8)
- **Too easy to avoid pipes?** Decrease `HITBOX_PADDING` (try 2 or 3)

---

### 5. Obstacle Settings

```javascript
OBSTACLES: {
    PIPE: {
        WIDTH: 40,
        MIN_HEIGHT: 30,         // Shortest pipe
        MAX_HEIGHT: 50,         // Tallest pipe
        HITBOX_PADDING: 2
    }
}
```

**Tuning Tips:**
- **Pipes too tall?** Decrease `MAX_HEIGHT` (try 40 or 45)
- **Pipes too short?** Increase `MIN_HEIGHT` (try 35 or 40)
- **Want all pipes same height?** Set `MIN_HEIGHT = MAX_HEIGHT`

---

### 6. Scoring Settings

```javascript
SCORE: {
    INCREMENT_PER_FRAME: 0.5    // Points gained per frame
                                // Higher = score increases faster
}
```

---

### 7. Background Settings

```javascript
BACKGROUND: {
    CLOUD_PARALLAX_SPEED: 0.2,  // Clouds move at 20% of game speed
    GROUND_PARALLAX_SPEED: 0.2, // Ground scrolls at 20% of game speed
                                // Keep these the same to avoid eye strain!
    CLOUD_SIZES: {
        WIDTH: 64,
        HEIGHT: 24
    }
}
```

**Important:** Keep `CLOUD_PARALLAX_SPEED` and `GROUND_PARALLAX_SPEED` equal to prevent visual mismatch!

---

## Common Adjustments

### Make the game easier:
1. Increase `JUMP_VELOCITY` (more negative, e.g., -14)
2. Decrease all difficulty `INITIAL_SPEED` and `MAX_SPEED`
3. Increase `MIN_OBSTACLE_DISTANCE` and `MAX_OBSTACLE_DISTANCE`
4. Increase `CHARACTER.HITBOX_PADDING`
5. Decrease `OBSTACLES.PIPE.MAX_HEIGHT`

### Make the game harder:
1. Decrease `JUMP_VELOCITY` (less negative, e.g., -10)
2. Increase all difficulty speeds
3. Decrease obstacle distances
4. Decrease `CHARACTER.HITBOX_PADDING`
5. Increase `OBSTACLES.PIPE.MIN_HEIGHT`

### Fix "pipes coming too fast":
1. Increase `MIN_OBSTACLE_DISTANCE` (e.g., 400 for Easy)
2. Increase `MAX_OBSTACLE_DISTANCE` (e.g., 800 for Easy)
3. Decrease `INITIAL_SPEED` and `MAX_SPEED`

### Make difficulty levels more distinct:
1. Widen the gap between Easy/Medium/Hard speeds
2. Use larger differences in `MIN_OBSTACLE_DISTANCE`
3. Example:
   - Easy: `MIN_OBSTACLE_DISTANCE: 400`, `INITIAL_SPEED: 3`
   - Medium: `MIN_OBSTACLE_DISTANCE: 250`, `INITIAL_SPEED: 6`
   - Hard: `MIN_OBSTACLE_DISTANCE: 150`, `INITIAL_SPEED: 9`

---

## How to Apply Changes

1. Open `js/config.js` in a text editor
2. Modify the values you want to change
3. Save the file
4. Refresh your browser (F5 or Cmd+R)
5. Test the changes!

---

## Debugging Tips

If the game breaks after changes:
1. Check browser console for errors (F12 → Console tab)
2. Make sure all numbers are valid (no missing commas, quotes, or brackets)
3. Restore `config.js` from backup if needed
4. Common mistakes:
   - Missing comma after a line
   - Negative numbers where positive expected (except `JUMP_VELOCITY`)
   - Min > Max values (e.g., `MIN_HEIGHT` > `MAX_HEIGHT`)

---

## Examples

### Super Easy Mode (for kids or testing):
```javascript
EASY: {
    INITIAL_SPEED: 2,
    SPEED_INCREMENT: 0.0001,
    MAX_SPEED: 4,
    MIN_OBSTACLE_DISTANCE: 500,
    MAX_OBSTACLE_DISTANCE: 900,
    FIRST_OBSTACLE_DELAY: 3000
}

PHYSICS: {
    GRAVITY: 0.5,
    JUMP_VELOCITY: -14,
    MAX_FALL_SPEED: 8
}

CHARACTER: {
    HITBOX_PADDING: 8  // Very forgiving
}
```

### Extreme Hard Mode:
```javascript
HARD: {
    INITIAL_SPEED: 10,
    SPEED_INCREMENT: 0.002,
    MAX_SPEED: 18,
    MIN_OBSTACLE_DISTANCE: 120,
    MAX_OBSTACLE_DISTANCE: 300,
    FIRST_OBSTACLE_DELAY: 500
}

PHYSICS: {
    GRAVITY: 0.8,
    JUMP_VELOCITY: -10,
    MAX_FALL_SPEED: 12
}

CHARACTER: {
    HITBOX_PADDING: 2  // Strict collisions
}
```

---

## Need Help?

If you're stuck tuning the config, start with these safe changes:
1. Adjust only ONE section at a time
2. Make small changes (±10-20% of original value)
3. Test after each change
4. Keep notes on what works!

Happy tuning! 🎮
