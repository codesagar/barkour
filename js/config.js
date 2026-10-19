// Physics is expressed in seconds. World speeds retain pixels per nominal 60 Hz tick.
const CONFIG = {
    CANVAS: { WIDTH: 1600, HEIGHT: 800 },
    CAMERA: { PORTRAIT_WIDTH:850, PORTRAIT_PACE:.9, PREVIEW_DISTANCE:1250, DESKTOP_WIDTH:1400, LAUNCH_WIDTH:1650, LANDSCAPE_WIDTH:1600, LANDSCAPE_LAUNCH_WIDTH:1750 },
    GROUND: { Y_POSITION: 600, HEIGHT: 200 },
    PHYSICS: {
        FIXED_STEP: 1 / 120, MAX_FRAME_TIME: 0.1,
        GRAVITY: 1650, JUMP_VELOCITY: -960, MAX_FALL_SPEED: 1400,
        APEX_SPEED: 130, JUMP_BUFFER_MS: 160, RECOVERY_TIME: 0.25
    },
    CHARACTER: { DISPLAY_SIZE: 224, X_POSITION: 260 },
    DIFFICULTY: {
        EASY: { INITIAL_SPEED: 6, MAX_SPEED: 7, SPEED_INCREMENT: 0.0004, LABEL: 'Explorer', HEARTS: 3 },
        MEDIUM: { INITIAL_SPEED: 7, MAX_SPEED: 8, SPEED_INCREMENT: 0.0006, LABEL: 'Adventurer', HEARTS: 3 },
        HARD: { INITIAL_SPEED: 8, MAX_SPEED: 9, SPEED_INCREMENT: 0.0008, LABEL: 'Trailblazer', HEARTS: 2 }
    },
    POWERS: {
        shield: { name: 'Trail shield', short: 'SHIELD', color: '#70D9EF', duration: 0, description: 'Absorbs one collision' },
        magnet: { name: 'Treat magnet', short: 'MAGNET', color: '#ED9AEF', duration: 9, description: 'Pulls in nearby treats for 9s' },
        star: { name: 'Super Paws', short: 'SUPER PAWS', color: '#FFD66D', duration: 6, description: '6s of invincibility + a speed burst' }
    },
    COLORS: { SKY_BLUE: '#C4DDE3', WHITE: '#FFFFFF', BLACK: '#243A38' }
};
CONFIG.getDifficulty = level => CONFIG.DIFFICULTY[level.toUpperCase()] || CONFIG.DIFFICULTY.EASY;
