// Input handler for keyboard controls
class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};

        // Bind event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
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
}
