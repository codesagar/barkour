// Main game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas dimensions
        this.canvas.width = CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = CONSTANTS.CANVAS_HEIGHT;

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;

        // Game state: 'LOADING', 'START', 'SELECT_SPEED', 'PLAYING', 'GAME_OVER'
        this.state = 'LOADING';

        // Game objects
        this.character = null;
        this.background = null;
        this.obstacleManager = null;
        this.inputHandler = null;

        // Game variables
        this.gameSpeed = 0;
        this.score = 0;
        this.highScore = Storage.getHighScore();
        this.selectedCharacterIndex = Storage.getSelectedCharacter();
        this.selectedSpeedIndex = 0; // 0: EASY, 1: MEDIUM, 2: HARD
        this.speedOptions = ['EASY', 'MEDIUM', 'HARD'];
        this.currentSpeedProfile = null;

        // Assets
        this.dogSprites = [];
        this.pipeSprite = null;
        this.cloudSprite = null;

        // Animation
        this.lastTime = 0;
        this.animationId = null;

        // Initialize
        this.init();
    }

    async init() {
        try {
            // Load all assets
            await this.loadAssets();

            // Initialize game objects
            this.background = new Background(this.canvas);
            this.background.cloudSprite = this.cloudSprite;

            this.obstacleManager = new ObstacleManager(this.canvas);
            this.obstacleManager.pipeSprite = this.pipeSprite;

            // Create character with selected dog sprite
            this.character = new Character(
                this.dogSprites[this.selectedCharacterIndex],
                CONSTANTS.CHARACTER_X,
                CONSTANTS.GROUND_Y - CONSTANTS.CHARACTER_HEIGHT
            );

            // Set up input handler
            this.inputHandler = new InputHandler(this);

            // Hide loading screen
            document.getElementById('loadingScreen').style.display = 'none';

            // Start with character selection
            this.state = 'START';

            // Start game loop
            this.startGameLoop();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load game assets. Please refresh the page.');
        }
    }

    async loadAssets() {
        const assetPromises = [
            this.loadImage('assets/sprites/Buddy.png'),
            this.loadImage('assets/sprites/Neet.png'),
            this.loadImage('assets/sprites/pipe.svg'),
            this.loadImage('assets/sprites/cloud.svg')
        ];

        const [buddy, neet, pipe, cloud] = await Promise.all(assetPromises);

        this.dogSprites = [buddy, neet];
        this.dogNames = ['Buddy', 'Neet'];
        this.pipeSprite = pipe;
        this.cloudSprite = cloud;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(deltaTime);
            this.render();

            this.animationId = requestAnimationFrame(gameLoop);
        };

        this.animationId = requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        switch(this.state) {
            case 'LOADING':
                // Waiting for assets
                break;

            case 'START':
                // Character selection screen (no updates needed)
                break;

            case 'SELECT_SPEED':
                // Speed selection screen (no updates needed)
                break;

            case 'PLAYING':
                this.updatePlaying();
                break;

            case 'GAME_OVER':
                // Game over (no updates needed)
                break;
        }
    }

    updatePlaying() {
        // Increase game speed over time
        this.gameSpeed = Math.min(
            this.gameSpeed + this.currentSpeedProfile.SPEED_INCREMENT,
            this.currentSpeedProfile.MAX_SPEED
        );

        // Update game objects
        this.character.update();
        this.background.update(this.gameSpeed);
        this.obstacleManager.update(this.gameSpeed);

        // Update score
        this.score += CONSTANTS.SCORE_INCREMENT;

        // Check collisions
        if (Collision.checkCollisions(this.character, this.obstacleManager.getObstacles())) {
            this.gameOver();
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch(this.state) {
            case 'LOADING':
                this.renderLoading();
                break;

            case 'START':
                this.renderCharacterSelection();
                break;

            case 'SELECT_SPEED':
                this.renderSpeedSelection();
                break;

            case 'PLAYING':
                this.renderPlaying();
                break;

            case 'GAME_OVER':
                this.renderGameOver();
                break;
        }

        // Always render version on top right (visible in all states)
        this.renderVersion();
    }

    renderLoading() {
        this.ctx.fillStyle = CONSTANTS.COLORS.SKY_BLUE;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderCharacterSelection() {
        // Sky background
        this.ctx.fillStyle = CONSTANTS.COLORS.SKY_BLUE;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title (scaled up for larger canvas)
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '64px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BARKOUR', this.canvas.width / 2, 120);

        // Subtitle
        this.ctx.font = '24px "Press Start 2P"';
        this.ctx.fillText('SELECT YOUR DOG', this.canvas.width / 2, 180);

        // Draw dog options (scaled up for larger canvas)
        const dog1X = this.canvas.width / 2 - 350;
        const dog2X = this.canvas.width / 2 + 50;
        const dogY = 220;

        // Buddy
        this.drawDogOption(this.dogSprites[0], this.dogNames[0], dog1X, dogY, this.selectedCharacterIndex === 0);

        // Neet
        this.drawDogOption(this.dogSprites[1], this.dogNames[1], dog2X, dogY, this.selectedCharacterIndex === 1);

        // Instructions (scaled up for larger canvas)
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText('ARROW KEYS / CLICK / TAP TO SELECT', this.canvas.width / 2, 700);
        this.ctx.fillText('SPACE / CLICK / TAP TO CONTINUE', this.canvas.width / 2, 750);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    renderSpeedSelection() {
        // Sky background
        this.ctx.fillStyle = CONSTANTS.COLORS.SKY_BLUE;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title (scaled up for larger canvas)
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT DIFFICULTY', this.canvas.width / 2, 120);

        // Draw speed options
        const startY = 280;
        const spacing = 140;

        this.speedOptions.forEach((speed, index) => {
            const y = startY + index * spacing;
            this.drawSpeedOption(speed, this.canvas.width / 2, y, this.selectedSpeedIndex === index);
        });

        // Instructions (scaled up for larger canvas)
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText('ARROW KEYS / CLICK / TAP TO SELECT', this.canvas.width / 2, 700);
        this.ctx.fillText('SPACE / DOUBLE-CLICK / TAP TO START', this.canvas.width / 2, 750);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawSpeedOption(speedName, x, y, selected) {
        const width = 600; // Doubled from 300
        const height = 100; // Doubled from 50
        const boxX = x - width / 2;
        const boxY = y - height / 2;

        // Selection highlight
        if (selected) {
            this.ctx.fillStyle = CONSTANTS.COLORS.BLOCK_ORANGE;
            this.ctx.fillRect(boxX - 5, boxY - 5, width + 10, height + 10);
        }

        // Background
        this.ctx.fillStyle = CONSTANTS.COLORS.WHITE;
        this.ctx.fillRect(boxX, boxY, width, height);

        // Border
        this.ctx.strokeStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.lineWidth = 6; // Doubled from 3
        this.ctx.strokeRect(boxX, boxY, width, height);

        // Text (doubled font size)
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(speedName, x, y + 16);
    }

    renderVersion() {
        // Save context state
        this.ctx.save();

        // Version display in top right corner
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(CONSTANTS.VERSION, this.canvas.width - 20, 30);

        // Restore context state
        this.ctx.restore();
    }

    drawDogOption(sprite, name, x, y, selected) {
        const size = 300; // Extra large size to show dog details!

        // Selection highlight
        if (selected) {
            this.ctx.fillStyle = CONSTANTS.COLORS.BLOCK_ORANGE;
            this.ctx.fillRect(x - 20, y - 20, size + 40, size + 90);
        }

        // Background
        this.ctx.fillStyle = CONSTANTS.COLORS.WHITE;
        this.ctx.fillRect(x - 15, y - 15, size + 30, size + 30);

        // Border
        this.ctx.strokeStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.lineWidth = 6; // Thicker border for larger dogs
        this.ctx.strokeRect(x - 15, y - 15, size + 30, size + 30);

        // Draw dog sprite at high quality (no downscaling)
        this.ctx.drawImage(sprite, x, y, size, size);

        // Draw dog name below sprite
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '32px "Press Start 2P"'; // Even larger font
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x + size / 2, y + size + 50);
    }

    renderPlaying() {
        // Draw background
        this.background.draw(this.ctx);

        // Draw obstacles
        this.obstacleManager.draw(this.ctx);

        // Draw character
        this.character.draw(this.ctx);

        // Draw score
        this.drawScore();
    }

    renderGameOver() {
        // Draw the game state (frozen)
        this.background.draw(this.ctx);
        this.obstacleManager.draw(this.ctx);
        this.character.draw(this.ctx);
        this.drawScore();

        // Game over overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game over text (scaled up for larger canvas)
        this.ctx.fillStyle = CONSTANTS.COLORS.WHITE;
        this.ctx.font = '64px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, 250);

        // Score display (doubled font sizes)
        this.ctx.font = '32px "Press Start 2P"';
        this.ctx.fillText(`SCORE: ${Math.floor(this.score)}`, this.canvas.width / 2, 350);
        this.ctx.fillText(`BEST: ${this.highScore}`, this.canvas.width / 2, 410);

        // Instructions (doubled font sizes)
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText('SPACE / CLICK TOP TO RESTART', this.canvas.width / 2, 500);
        this.ctx.fillText('C / CLICK BOTTOM TO CHANGE CHARACTER', this.canvas.width / 2, 550);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawScore() {
        this.ctx.fillStyle = CONSTANTS.COLORS.BLACK;
        this.ctx.font = '32px "Press Start 2P"'; // Doubled from 16px

        // High score
        this.ctx.fillText(`HI ${String(this.highScore).padStart(5, '0')}`, 40, 60);

        // Current score
        this.ctx.fillText(`${String(Math.floor(this.score)).padStart(5, '0')}`, 500, 60);
    }

    // Game state methods
    selectPreviousCharacter() {
        this.selectedCharacterIndex = (this.selectedCharacterIndex - 1 + this.dogSprites.length) % this.dogSprites.length;
        Storage.saveSelectedCharacter(this.selectedCharacterIndex);
        // Immediately update the character sprite so it shows in game
        if (this.character) {
            this.character.sprite = this.dogSprites[this.selectedCharacterIndex];
        }
    }

    selectNextCharacter() {
        this.selectedCharacterIndex = (this.selectedCharacterIndex + 1) % this.dogSprites.length;
        Storage.saveSelectedCharacter(this.selectedCharacterIndex);
        // Immediately update the character sprite so it shows in game
        if (this.character) {
            this.character.sprite = this.dogSprites[this.selectedCharacterIndex];
        }
    }

    selectPreviousSpeed() {
        this.selectedSpeedIndex = (this.selectedSpeedIndex - 1 + this.speedOptions.length) % this.speedOptions.length;
    }

    selectNextSpeed() {
        this.selectedSpeedIndex = (this.selectedSpeedIndex + 1) % this.speedOptions.length;
    }

    proceedToSpeedSelection() {
        // Update character sprite based on selection
        this.character.sprite = this.dogSprites[this.selectedCharacterIndex];
        this.state = 'SELECT_SPEED';
    }

    startGame() {
        // Set difficulty profile based on selection
        const difficultyKey = this.speedOptions[this.selectedSpeedIndex];
        this.currentSpeedProfile = CONFIG.getDifficulty(difficultyKey);

        // Update character sprite based on selection
        this.character.sprite = this.dogSprites[this.selectedCharacterIndex];
        this.character.reset();

        // Reset game state
        this.gameSpeed = this.currentSpeedProfile.INITIAL_SPEED;
        this.score = 0;
        this.background.reset();
        this.obstacleManager.reset();

        // Set difficulty for obstacle manager
        this.obstacleManager.setDifficulty(this.currentSpeedProfile);

        // Enable obstacle spawning after a short delay
        setTimeout(() => {
            if (this.state === 'PLAYING') {
                this.obstacleManager.enableSpawning();
            }
        }, this.currentSpeedProfile.FIRST_OBSTACLE_DELAY);

        this.state = 'PLAYING';
    }

    async gameOver() {
        // Update high score
        if (Math.floor(this.score) > this.highScore) {
            this.highScore = Math.floor(this.score);
            Storage.saveHighScore(this.highScore);
        }

        // Save score to Supabase if user is logged in
        if (authManager.isLoggedIn()) {
            const difficulty = this.speedOptions[this.selectedSpeedIndex];
            const characterName = this.dogNames[this.selectedCharacterIndex];
            await authManager.saveScore(this.score, difficulty, characterName);
        }

        this.state = 'GAME_OVER';
    }

    restart() {
        this.startGame();
    }

    returnToCharacterSelection() {
        this.character.reset();
        this.background.reset();
        this.obstacleManager.reset();
        this.gameSpeed = 0;
        this.score = 0;
        this.state = 'START';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
