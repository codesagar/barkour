// localStorage utilities for high score persistence
const Storage = {
    getHighScore() {
        return parseInt(localStorage.getItem('barkour_highscore') || '0');
    },

    saveHighScore(score) {
        localStorage.setItem('barkour_highscore', score.toString());
    },

    getSelectedCharacter() {
        return parseInt(localStorage.getItem('barkour_character') || '0');
    },

    saveSelectedCharacter(index) {
        localStorage.setItem('barkour_character', index.toString());
    }
};
