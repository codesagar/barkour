class InputHandler {
    constructor(game) {
        this.game = game; this.held = new Set();
        document.addEventListener('keydown', event => this.handleKeyDown(event));
        document.addEventListener('keyup', event => {
            if (!['Space','ArrowUp'].includes(event.code) || !this.held.has(event.code)) return;
            this.held.delete(event.code); if (!this.held.size) game.releaseJump();
        });
        game.canvas.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button > 0 || game.state !== 'PLAYING') return;
            event.preventDefault(); game.canvas.focus({preventScroll:true});
            const alreadyHeld = this.held.size > 0;
            this.pointerId = event.pointerId; this.held.add('pointer');
            game.canvas.setPointerCapture(event.pointerId); if (!alreadyHeld) game.jump();
        });
        for (const name of ['pointerup','pointercancel','lostpointercapture']) game.canvas.addEventListener(name, event => {
            if (event.pointerId !== this.pointerId) return;
            this.pointerId = null; this.held.delete('pointer'); if (!this.held.size) game.releaseJump();
        });
        window.addEventListener('blur', () => game.pause());
    }
    clear() { this.held.clear(); this.pointerId = null; this.game.character.jumpBuffer = 0; }
    handleKeyDown(event) {
        const game = this.game, code = event.code;
        // Escape remains available from focused buttons and dialogs.
        if (code === 'Escape' || code === 'KeyP') {
            event.preventDefault();
            if (document.getElementById('optionsPanel') && !document.getElementById('optionsPanel').classList.contains('hidden')) game.ui.closeOptions();
            else if (!document.getElementById('recordsPanel').classList.contains('hidden')) game.ui.closeRecords();
            else game.state === 'PAUSED' ? game.resume() : game.pause();
            return;
        }
        if (event.target.closest('input, textarea, button, summary, a, select, [contenteditable], .panel-overlay')) return;
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','KeyM'].includes(code)) event.preventDefault();
        if (event.repeat) return;
        if (code === 'KeyM') { game.audio.toggle(); game.ui.updateSound(); return; }
        if (game.state === 'START') {
            if (code === 'ArrowLeft' || code === 'ArrowRight') game.selectTrack((game.selectedTrackIndex + (code === 'ArrowRight' ? 1 : TRACKS.length - 1)) % TRACKS.length);
            if (code === 'ArrowUp' || code === 'ArrowDown') {
                const count = game.dogSprites.length;
                game.selectCharacter((game.selectedCharacterIndex + (code === 'ArrowDown' ? 1 : count - 1)) % count);
            }
            if (code === 'Space' || code === 'Enter') game.startGame();
        } else if (game.state === 'PLAYING' && ['Space','ArrowUp'].includes(code)) {
            const alreadyHeld = this.held.size > 0; this.held.add(code); if (!alreadyHeld) game.jump();
        }
    }
}
