// ═══════════════════════════════════════════════════════════════════════════════
// BARKOUR GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
//
// 🎮 TUNING GUIDE - How to adjust gameplay feel:
//
// ┌─────────────────────────────────────────────────────────────────────────────
// │ MAKING JUMPS HIGHER/LOWER:
// ├─────────────────────────────────────────────────────────────────────────────
// │ • Increase JUMP_VELOCITY (more negative = higher, e.g., -15 → -20)
// │ • Keep GRAVITY the same for realistic arc
// │ • Current: -15 velocity + 0.3 gravity = ~375px jump height, ~2s air time
// │
// │ MAKING JUMPS FLOATIER/SNAPPIER:
// ├─────────────────────────────────────────────────────────────────────────────
// │ • Lower GRAVITY = floaty (0.3 → 0.2)
// │ • Higher GRAVITY = snappy (0.3 → 0.5)
// │ • Adjust JUMP_VELOCITY to maintain same height if needed
// │
// │ MAKING GAME EASIER/HARDER:
// ├─────────────────────────────────────────────────────────────────────────────
// │ • Easier: Increase MIN/MAX_OBSTACLE_DISTANCE (more space between obstacles)
// │ • Easier: Decrease INITIAL_SPEED and MAX_SPEED (slower scrolling)
// │ • Easier: Increase HITBOX_PADDING (more forgiving collisions)
// │ • Harder: Increase SPEED_INCREMENT (reaches max speed faster)
// │
// │ TIME TO REACH MAX SPEED:
// ├─────────────────────────────────────────────────────────────────────────────
// │ • Formula: (MAX_SPEED - INITIAL_SPEED) / SPEED_INCREMENT / 60 = seconds
// │ • Easy:   (6 - 3) / 0.0003 / 60 = ~166 seconds
// │ • Medium: (9 - 5) / 0.0006 / 60 = ~111 seconds
// │ • Hard:   (13 - 6) / 0.001 / 60 = ~116 seconds
// │
// │ VISUAL COMFORT (PREVENTING EYE STRAIN):
// ├─────────────────────────────────────────────────────────────────────────────
// │ • GROUND_PARALLAX_SPEED: 0.0 = static (best), 0.1 = subtle, 0.4+ = may cause headache
// │ • BRICK_SIZE: Larger = less strobing (64+ recommended for fast games)
// │ • CLOUD_PARALLAX_SPEED: 0.3-0.5 is fine (clouds are larger, less detail)
// └─────────────────────────────────────────────────────────────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // ===================
    // DISPLAY SETTINGS
    // ===================
    CANVAS: {
        WIDTH: 1600,           // Base canvas width in pixels (internal resolution)
        HEIGHT: 800,           // Base canvas height in pixels
        SCALE_TO_VIEWPORT: 0.9, // Percentage of browser window to fill (0.9 = 90%)
        MAINTAIN_ASPECT: true   // true = no stretching, false = fill entire viewport
    },

    GROUND: {
        Y_POSITION: 600,       // Vertical position where ground starts (pixels from top)
        HEIGHT: 200            // Visual height of ground area (pixels)
    },

    // ===================
    // PHYSICS SETTINGS
    // ===================
    // These control how the character moves and jumps
    // Formula: Each frame, velocityY += GRAVITY, then y += velocityY
    PHYSICS: {
        GRAVITY: 0.4,              // Pixels/frame² added to fall speed (0.2 = floaty, 0.5 = heavy)
                                   // Effect: Controls how quickly character falls after jumping

        JUMP_VELOCITY: -15,        // Initial upward velocity in pixels/frame (more negative = higher)
                                   // Effect: -15 with gravity 0.3 = ~375px height, ~2 seconds air time
                                   // Try: -12 (lower jump), -18 (higher jump)

        MAX_FALL_SPEED: 15         // Maximum downward velocity (prevents infinite acceleration)
                                   // Effect: Terminal velocity when falling
    },

    // ===================
    // DIFFICULTY PROFILES
    // ===================
    // Three preset difficulty levels with different speed and obstacle spacing
    DIFFICULTY: {
        EASY: {
            // === SPEED SETTINGS ===
            INITIAL_SPEED: 3,           // Pixels/frame the world scrolls at start (slower start)
            SPEED_INCREMENT: 0.0003,    // Speed added each frame (0.0003 × 60fps = 0.018 px/s²)
                                        // Effect: Takes ~166 seconds to reach max speed
            MAX_SPEED: 6,               // Maximum pixels/frame (moderate top speed)

            // === OBSTACLE SPACING ===
            MIN_OBSTACLE_DISTANCE: 700, // Minimum pixels between obstacles (generous spacing)
            MAX_OBSTACLE_DISTANCE: 1400, // Maximum pixels between obstacles (lots of breathing room)
                                         // Effect: At speed 6, obstacles appear every 2-4 seconds
            FIRST_OBSTACLE_DELAY: 100  // Wait 2 seconds before first obstacle appears (ms)
        },

        MEDIUM: {
            // === SPEED SETTINGS ===
            INITIAL_SPEED: 5,           // Faster starting speed than EASY
            SPEED_INCREMENT: 0.0006,    // Doubles the speed-up rate of EASY
                                        // Effect: Takes ~111 seconds to reach max speed
            MAX_SPEED: 9,               // 50% faster top speed than EASY

            // === OBSTACLE SPACING ===
            MIN_OBSTACLE_DISTANCE: 500, // Tighter minimum spacing (less reaction time)
            MAX_OBSTACLE_DISTANCE: 1100, // Less variation in gaps
                                         // Effect: At speed 9, obstacles appear every 1-2 seconds
            FIRST_OBSTACLE_DELAY: 100  // Shorter grace period (1.5s)
        },

        HARD: {
            // === SPEED SETTINGS ===
            INITIAL_SPEED: 6,           // Starts fast (same as EASY's max speed!)
            SPEED_INCREMENT: 0.001,     // Aggressive speed increase
                                        // Effect: Takes ~116 seconds to reach max speed
            MAX_SPEED: 13,              // Very fast (2x EASY's max speed)

            // === OBSTACLE SPACING ===
            MIN_OBSTACLE_DISTANCE: 400, // Tight spacing requires quick reflexes
            MAX_OBSTACLE_DISTANCE: 900, // Even gaps become challenging at high speed
                                        // Effect: At speed 13, obstacles appear every 0.5-1 second
            FIRST_OBSTACLE_DELAY: 100  // Minimal grace period (1s)
        }
    },

    // ===================
    // CHARACTER SETTINGS
    // ===================
    CHARACTER: {
        WIDTH: 96,              // Visual width in pixels (sprite size)
        HEIGHT: 96,             // Visual height in pixels (sprite size)
        X_POSITION: 200,        // Horizontal position on screen (pixels from left edge)
                                // Effect: Character stays at this X position while world scrolls

        HITBOX_PADDING: 12      // Pixels to shrink hitbox on all sides (forgiveness factor)
                                // Effect: Higher = more forgiving collisions (edges can overlap)
                                // Example: 12 padding = actual hitbox is 72×72 instead of 96×96
    },

    // ===================
    // OBSTACLE SETTINGS
    // ===================
    OBSTACLES: {
        PIPE: {
            WIDTH: 80,          // Visual width in pixels
            MIN_HEIGHT: 60,     // Shortest possible pipe height in pixels
            MAX_HEIGHT: 100,    // Tallest possible pipe height in pixels
                                // Effect: Pipes randomly vary between 60-100px tall

            HITBOX_PADDING: 4   // Pixels to shrink obstacle hitbox (collision forgiveness)
                                // Effect: 4 padding = actual hitbox is 72px wide instead of 80px
        }
    },

    // ===================
    // SCORING SETTINGS
    // ===================
    SCORE: {
        INCREMENT_PER_FRAME: 0.5    // Points added each frame (at 60fps = 30 points/second)
                                    // Effect: Score increases continuously while playing
                                    // Try: 1.0 for faster scoring, 0.25 for slower
    },

    // ===================
    // BACKGROUND SETTINGS
    // ===================
    BACKGROUND: {
        CLOUD_PARALLAX_SPEED: 0.4,  // Clouds move at 40% of game speed (creates depth)
                                    // Effect: Slower than obstacles = feel farther away
                                    // Range: 0.0 (static) to 1.0 (same as game speed)

        GROUND_PARALLAX_SPEED: 0.05, // ⚠️ REDUCED FROM 0.4 TO PREVENT EYE STRAIN
                                     // Ground moves at 5% of game speed (nearly static)
                                     // Effect: Subtle movement without strobing/headache
                                     // Original was 0.4 which caused visual discomfort!

        CLOUD_SIZES: {
            WIDTH: 128,             // Cloud sprite width in pixels
            HEIGHT: 48              // Cloud sprite height in pixels
        },

        BRICK_SIZE: 64              // Size of each ground brick tile in pixels
                                    // Effect: Smaller = more detail but may cause strobing at high speed
                                    // Consider increasing to 64 if still experiencing eye strain
    },

    // ===================
    // COLOR PALETTE
    // ===================
    // Mario-inspired retro color scheme
    COLORS: {
        SKY_BLUE: '#5C94FC',        // Background sky color (Mario's classic sky blue)
        GROUND_BROWN: '#C84C0C',    // Main ground/brick color (warm brown)
        GROUND_DARK: '#9C3810',     // Ground shadow/detail color (darker brown)
        GROUND_HIGHLIGHT: '#E06428', // Ground highlight color (lighter orange-brown)
        PIPE_GREEN: '#00A800',      // Pipe/obstacle color (classic Mario pipe green)
        BLOCK_ORANGE: '#F89028',    // Block accent color (Mario brick orange)
        WHITE: '#FFFFFF',           // White for clouds and highlights
        BLACK: '#000000'            // Black for outlines and text
    }
};

// Helper function to get difficulty settings
CONFIG.getDifficulty = function(level) {
    const levelKey = level.toUpperCase();
    if (this.DIFFICULTY[levelKey]) {
        return this.DIFFICULTY[levelKey];
    }
    console.warn(`Unknown difficulty level: ${level}, defaulting to MEDIUM`);
    return this.DIFFICULTY.MEDIUM;
};
