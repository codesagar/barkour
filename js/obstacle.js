// Base Obstacle class
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
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback colored rectangle
            ctx.fillStyle = CONSTANTS.COLORS.PIPE_GREEN;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Debug hitbox (uncomment to see collision box)
        // ctx.strokeStyle = 'blue';
        // ctx.lineWidth = 2;
        // const bounds = this.getBounds();
        // ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getBounds() {
        // Slightly reduced hitbox for fairness (use CONFIG)
        const padding = CONFIG.OBSTACLES.PIPE.HITBOX_PADDING;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}

// Pipe obstacle (various heights)
class Pipe extends Obstacle {
    constructor(x, sprite) {
        // Use config for pipe dimensions
        const heightRange = CONFIG.OBSTACLES.PIPE.MAX_HEIGHT - CONFIG.OBSTACLES.PIPE.MIN_HEIGHT;
        const height = CONFIG.OBSTACLES.PIPE.MIN_HEIGHT + Math.floor(Math.random() * heightRange);
        const y = CONSTANTS.GROUND_Y - height;
        const width = CONFIG.OBSTACLES.PIPE.WIDTH;
        super(x, y, width, height, sprite);
    }
}

// Obstacle Manager
class ObstacleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.obstacles = [];
        this.nextObstacleDistance = 300; // Default
        this.distanceSinceLastObstacle = 0;
        this.canSpawn = false; // Don't spawn immediately

        // Difficulty settings (set from game.js)
        this.difficultySettings = null;

        // Sprites (set from game.js after loading)
        this.pipeSprite = null;
    }

    setDifficulty(difficultySettings) {
        this.difficultySettings = difficultySettings;
        this.nextObstacleDistance = difficultySettings.MIN_OBSTACLE_DISTANCE;
    }

    enableSpawning() {
        this.canSpawn = true;
    }

    spawnObstacle() {
        if (!this.canSpawn || !this.difficultySettings) return;

        const x = this.canvas.width + 20;

        // Only spawn pipes
        this.obstacles.push(new Pipe(x, this.pipeSprite));

        // Random distance for next obstacle based on difficulty
        const minDist = this.difficultySettings.MIN_OBSTACLE_DISTANCE;
        const maxDist = this.difficultySettings.MAX_OBSTACLE_DISTANCE;
        this.nextObstacleDistance = minDist + Math.random() * (maxDist - minDist);
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

    reset() {
        this.obstacles = [];
        this.distanceSinceLastObstacle = 0;
        if (this.difficultySettings) {
            this.nextObstacleDistance = this.difficultySettings.MIN_OBSTACLE_DISTANCE;
        }
        this.canSpawn = false;
    }

    getObstacles() {
        return this.obstacles;
    }
}
