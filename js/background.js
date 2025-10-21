// Background and environment rendering
class Background {
    constructor(canvas) {
        this.canvas = canvas;
        this.groundY = CONSTANTS.GROUND_Y;
        this.groundOffset = 0;

        // Cloud decorations
        this.clouds = [
            { x: 100, y: 50, speed: 0.2 },
            { x: 300, y: 80, speed: 0.15 },
            { x: 500, y: 60, speed: 0.25 },
            { x: 700, y: 40, speed: 0.18 }
        ];

        // Cloud sprite (set from game.js after loading)
        this.cloudSprite = null;
    }

    update(gameSpeed) {
        // Scroll ground brick pattern at same speed as clouds (use CONFIG for parallax)
        const scrollSpeed = gameSpeed * CONFIG.BACKGROUND.GROUND_PARALLAX_SPEED;
        this.groundOffset -= scrollSpeed;

        // Reset offset when it completes one tile cycle
        const tileSize = CONFIG.BACKGROUND.BRICK_SIZE;
        if (this.groundOffset <= -tileSize) {
            this.groundOffset = 0;
        }

        // Move clouds (parallax effect - same speed as ground for consistency)
        const cloudSpeed = gameSpeed * CONFIG.BACKGROUND.CLOUD_PARALLAX_SPEED;
        this.clouds.forEach(cloud => {
            cloud.x -= cloudSpeed;
            if (cloud.x < -CONFIG.BACKGROUND.CLOUD_SIZES.WIDTH) {
                cloud.x = this.canvas.width + 50;
                cloud.y = 60 + Math.random() * 140; // Random height (doubled range)
            }
        });
    }

    draw(ctx) {
        // Sky
        ctx.fillStyle = CONSTANTS.COLORS.SKY_BLUE;
        ctx.fillRect(0, 0, this.canvas.width, this.groundY);

        // Clouds
        this.drawClouds(ctx);

        // Ground
        this.drawGround(ctx);
    }

    drawClouds(ctx) {
        const cloudWidth = CONFIG.BACKGROUND.CLOUD_SIZES.WIDTH;
        const cloudHeight = CONFIG.BACKGROUND.CLOUD_SIZES.HEIGHT;

        this.clouds.forEach(cloud => {
            if (this.cloudSprite) {
                ctx.drawImage(this.cloudSprite, cloud.x, cloud.y, cloudWidth, cloudHeight);
            } else {
                // Fallback cloud (scaled proportionally)
                ctx.fillStyle = CONSTANTS.COLORS.WHITE;
                ctx.fillRect(cloud.x, cloud.y, cloudWidth, cloudHeight);
                ctx.fillRect(cloud.x + cloudWidth * 0.125, cloud.y - cloudHeight * 0.167, cloudWidth * 0.75, cloudHeight * 0.5);
            }
        });
    }

    drawGround(ctx) {
        // Ground fill
        ctx.fillStyle = CONSTANTS.COLORS.GROUND_BROWN;
        ctx.fillRect(0, this.groundY, this.canvas.width, CONSTANTS.GROUND_HEIGHT);

        // Draw Mario-style brick pattern (scrolling)
        const tileSize = CONFIG.BACKGROUND.BRICK_SIZE;
        const startX = Math.floor(this.groundOffset);

        // Draw brick tiles
        for (let x = startX; x < this.canvas.width + tileSize; x += tileSize) {
            for (let y = this.groundY; y < this.canvas.height; y += tileSize) {
                // Brick fill color
                ctx.fillStyle = '#C84C0C';
                ctx.fillRect(x, y, tileSize, tileSize);

                // Black outline/border around each brick (scaled)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4; // Doubled from 2
                ctx.strokeRect(x, y, tileSize, tileSize);

                // Inner lighter accent (top-left for 3D effect)
                ctx.fillStyle = '#E06428';
                ctx.fillRect(x + 4, y + 4, tileSize - 16, tileSize - 16);

                // Dark accent (bottom-right for shadow)
                ctx.fillStyle = '#9C3810';
                ctx.fillRect(x + tileSize - 12, y + tileSize - 12, 8, 8);
            }
        }
    }

    reset() {
        this.groundOffset = 0;
        // Reset cloud positions
        this.clouds = [
            { x: 100, y: 50, speed: 0.2 },
            { x: 300, y: 80, speed: 0.15 },
            { x: 500, y: 60, speed: 0.25 },
            { x: 700, y: 40, speed: 0.18 }
        ];
    }
}
