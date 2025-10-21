// Game Configuration - Tune all game parameters here
const CONFIG = {
    // ===================
    // DISPLAY SETTINGS
    // ===================
    CANVAS: {
        WIDTH: 1600,           // Base canvas width (doubled from 800)
        HEIGHT: 800,           // Base canvas height (doubled from 400)
        SCALE_TO_VIEWPORT: 0.9, // Use 90% of viewport width (0.5 = 50%, 1.0 = 100%)
        MAINTAIN_ASPECT: true   // Keep aspect ratio when scaling
    },

    GROUND: {
        Y_POSITION: 600,       // Doubled from 300
        HEIGHT: 200            // Doubled from 100
    },

    // ===================
    // PHYSICS SETTINGS
    // ===================
    PHYSICS: {
        GRAVITY: 0.3,              // How fast character falls (higher = falls faster)
        JUMP_VELOCITY: -15,        // Initial jump power (more negative = higher jump)
        MAX_FALL_SPEED: 15         // Terminal velocity
    },

    // ===================
    // DIFFICULTY PROFILES
    // ===================
    DIFFICULTY: {
        EASY: {
            // Speed settings
            INITIAL_SPEED: 3,           // Starting scroll speed
            SPEED_INCREMENT: 0.0003,    // How fast speed increases per frame
            MAX_SPEED: 6,               // Maximum scroll speed

            // Obstacle spawning
            MIN_OBSTACLE_DISTANCE: 700, // Doubled from 350
            MAX_OBSTACLE_DISTANCE: 1400, // Doubled from 700
            FIRST_OBSTACLE_DELAY: 2000  // Delay before first obstacle (ms)
        },

        MEDIUM: {
            // Speed settings
            INITIAL_SPEED: 5,
            SPEED_INCREMENT: 0.0006,
            MAX_SPEED: 9,

            // Obstacle spawning
            MIN_OBSTACLE_DISTANCE: 500, // Doubled from 250
            MAX_OBSTACLE_DISTANCE: 1100, // Doubled from 550
            FIRST_OBSTACLE_DELAY: 1500
        },

        HARD: {
            // Speed settings
            INITIAL_SPEED: 6,
            SPEED_INCREMENT: 0.001,
            MAX_SPEED: 13,

            // Obstacle spawning
            MIN_OBSTACLE_DISTANCE: 400, // Doubled from 200
            MAX_OBSTACLE_DISTANCE: 900, // Doubled from 450
            FIRST_OBSTACLE_DELAY: 1000
        }
    },

    // ===================
    // CHARACTER SETTINGS
    // ===================
    CHARACTER: {
        WIDTH: 96,              // Increased by 50% from 64
        HEIGHT: 96,             // Increased by 50% from 64
        X_POSITION: 200,        // Keep same position
        HITBOX_PADDING: 12      // Increased by 50% from 8
    },

    // ===================
    // OBSTACLE SETTINGS
    // ===================
    OBSTACLES: {
        PIPE: {
            WIDTH: 80,          // Doubled from 40
            MIN_HEIGHT: 60,     // Doubled from 30
            MAX_HEIGHT: 100,    // Doubled from 50
            HITBOX_PADDING: 4   // Doubled from 2
        }
    },

    // ===================
    // SCORING SETTINGS
    // ===================
    SCORE: {
        INCREMENT_PER_FRAME: 0.5    // Points gained per frame
    },

    // ===================
    // BACKGROUND SETTINGS
    // ===================
    BACKGROUND: {
        CLOUD_PARALLAX_SPEED: 0.4,  // Clouds move at 40% of game speed
        GROUND_PARALLAX_SPEED: 0.4, // Ground scrolls at 40% of game speed
        CLOUD_SIZES: {
            WIDTH: 128,             // Doubled from 64
            HEIGHT: 48              // Doubled from 24
        },
        BRICK_SIZE: 32              // Doubled from 16
    },

    // ===================
    // COLOR PALETTE
    // ===================
    COLORS: {
        SKY_BLUE: '#5C94FC',
        GROUND_BROWN: '#C84C0C',
        GROUND_DARK: '#9C3810',
        GROUND_HIGHLIGHT: '#E06428',
        PIPE_GREEN: '#00A800',
        BLOCK_ORANGE: '#F89028',
        WHITE: '#FFFFFF',
        BLACK: '#000000'
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
