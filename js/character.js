// Character class for the playable dog
class Character {
    constructor(sprite, x, y) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.width = CONSTANTS.CHARACTER_WIDTH;
        this.height = CONSTANTS.CHARACTER_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
        this.gravity = CONSTANTS.GRAVITY;
        this.jumpPower = CONSTANTS.JUMP_VELOCITY;
        this.groundY = CONSTANTS.GROUND_Y - this.height;

        // Animation
        this.frameIndex = 0;
        this.frameCount = 0;
        this.frameDelay = 5; // Change frame every 5 game ticks
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }

    update() {
        // Apply gravity
        this.velocityY += this.gravity;

        // Cap fall speed
        if (this.velocityY > CONSTANTS.MAX_FALL_SPEED) {
            this.velocityY = CONSTANTS.MAX_FALL_SPEED;
        }

        // Update position
        this.y += this.velocityY;

        // Ground collision
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Simple running animation
        if (!this.isJumping) {
            this.frameCount++;
            if (this.frameCount >= this.frameDelay) {
                this.frameIndex = (this.frameIndex + 1) % 2;
                this.frameCount = 0;
            }
        }
    }

    draw(ctx) {
        // Draw the sprite
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

        // Debug hitbox (uncomment to see collision box)
        // ctx.strokeStyle = 'red';
        // ctx.lineWidth = 2;
        // const bounds = this.getBounds();
        // ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    getBounds() {
        // Reduced hitbox for fairer collision (use CONFIG)
        const padding = CONFIG.CHARACTER.HITBOX_PADDING;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }

    reset() {
        this.y = this.groundY;
        this.velocityY = 0;
        this.isJumping = false;
        this.frameIndex = 0;
        this.frameCount = 0;
    }
}
