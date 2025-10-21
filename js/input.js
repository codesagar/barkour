// Input handler for keyboard and touch controls
class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};

        // Touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isTouching = false;

        // Bind keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Bind touch event listeners
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Also listen on document to catch taps outside canvas
        document.addEventListener('touchstart', (e) => {
            // Prevent default to avoid scrolling, zooming, etc.
            if (e.target === canvas || e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleKeyDown(event) {
        // Prevent default for game controls
        if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'KeyC'].includes(event.code)) {
            event.preventDefault();
        }

        // Avoid repeat events
        if (this.keys[event.code]) return;
        this.keys[event.code] = true;

        switch(this.game.state) {
            case 'START':
                this.handleStartInput(event.code);
                break;

            case 'SELECT_SPEED':
                this.handleSpeedSelectionInput(event.code);
                break;

            case 'PLAYING':
                this.handlePlayingInput(event.code);
                break;

            case 'GAME_OVER':
                this.handleGameOverInput(event.code);
                break;
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
    }

    handleStartInput(code) {
        if (code === 'ArrowLeft') {
            this.game.selectPreviousCharacter();
        } else if (code === 'ArrowRight') {
            this.game.selectNextCharacter();
        } else if (code === 'Space' || code === 'Enter') {
            this.game.proceedToSpeedSelection();
        }
    }

    handleSpeedSelectionInput(code) {
        if (code === 'ArrowUp') {
            this.game.selectPreviousSpeed();
        } else if (code === 'ArrowDown') {
            this.game.selectNextSpeed();
        } else if (code === 'Space' || code === 'Enter') {
            this.game.startGame();
        }
    }

    handlePlayingInput(code) {
        if (code === 'Space') {
            this.game.character.jump();
        }
    }

    handleGameOverInput(code) {
        if (code === 'Space') {
            this.game.restart();
        } else if (code === 'KeyC') {
            this.game.returnToCharacterSelection();
        }
    }

    // Touch event handlers
    handleTouchStart(event) {
        event.preventDefault();

        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isTouching = true;
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
    }

    handleTouchEnd(event) {
        event.preventDefault();

        if (!this.isTouching) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const touchDuration = Date.now() - this.touchStartTime;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Determine if it's a tap (short duration, small movement)
        const isTap = touchDuration < 300 && absDeltaX < 30 && absDeltaY < 30;

        // Determine if it's a swipe (larger movement)
        const isSwipe = absDeltaX > 50 || absDeltaY > 50;

        this.isTouching = false;

        // Handle based on game state
        switch(this.game.state) {
            case 'START':
                this.handleStartTouch(isTap, isSwipe, deltaX, deltaY, touchEndX, touchEndY);
                break;

            case 'SELECT_SPEED':
                this.handleSpeedSelectionTouch(isTap, isSwipe, deltaX, deltaY, touchEndX, touchEndY);
                break;

            case 'PLAYING':
                this.handlePlayingTouch(isTap);
                break;

            case 'GAME_OVER':
                this.handleGameOverTouch(isTap, touchEndX, touchEndY);
                break;
        }
    }

    handleStartTouch(isTap, isSwipe, deltaX, deltaY, touchX, touchY) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const relativeX = touchX - rect.left;

        if (isSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.game.selectNextCharacter();
            } else {
                this.game.selectPreviousCharacter();
            }
        } else if (isTap) {
            // Tap on left/right side to navigate, center to select
            if (relativeX < canvasWidth * 0.33) {
                this.game.selectPreviousCharacter();
            } else if (relativeX > canvasWidth * 0.67) {
                this.game.selectNextCharacter();
            } else {
                // Center tap to proceed
                this.game.proceedToSpeedSelection();
            }
        }
    }

    handleSpeedSelectionTouch(isTap, isSwipe, deltaX, deltaY, touchX, touchY) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const canvasHeight = rect.height;
        const relativeY = touchY - rect.top;

        if (isSwipe && Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical swipe
            if (deltaY > 0) {
                this.game.selectNextSpeed();
            } else {
                this.game.selectPreviousSpeed();
            }
        } else if (isTap) {
            // Tap on top/bottom to navigate, center to select
            if (relativeY < canvasHeight * 0.33) {
                this.game.selectPreviousSpeed();
            } else if (relativeY > canvasHeight * 0.67) {
                this.game.selectNextSpeed();
            } else {
                // Center tap to start game
                this.game.startGame();
            }
        }
    }

    handlePlayingTouch(isTap) {
        // Any tap during gameplay = jump
        if (isTap) {
            this.game.character.jump();
        }
    }

    handleGameOverTouch(isTap, touchX, touchY) {
        if (!isTap) return;

        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const canvasHeight = rect.height;
        const relativeY = touchY - rect.top;

        // Tap on top half = restart, bottom half = return to character selection
        if (relativeY < canvasHeight * 0.6) {
            this.game.restart();
        } else {
            this.game.returnToCharacterSelection();
        }
    }
}
