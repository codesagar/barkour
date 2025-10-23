// UI Controller for Auth and Leaderboard
class UIController {
    constructor() {
        this.initElements();
        this.attachEventListeners();
        this.currentDifficulty = 'ALL';

        // Set auth callback
        authManager.onAuthChange = (isLoggedIn) => this.updateAuthUI(isLoggedIn);

        // Initialize UI based on auth state
        this.updateAuthUI(authManager.isLoggedIn());
    }

    initElements() {
        // Auth elements
        this.authModal = document.getElementById('authModal');
        this.authClose = document.querySelector('.auth-close');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.authMessage = document.getElementById('authMessage');
        this.authTitle = document.getElementById('authTitle');

        // Auth buttons
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.loginPrompt = document.getElementById('loginPrompt');
        this.leaderboardBtn = document.getElementById('leaderboardBtn');

        // Auth inputs
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.signupUsername = document.getElementById('signupUsername');
        this.signupEmail = document.getElementById('signupEmail');
        this.signupPassword = document.getElementById('signupPassword');

        // User panel
        this.userPanel = document.getElementById('userPanel');
        this.usernameDisplay = document.getElementById('username');

        // Leaderboard elements
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardClose = document.querySelector('.leaderboard-close');
        this.leaderboardTable = document.getElementById('leaderboardTable');
        this.personalBest = document.getElementById('personalBest');
        this.personalBestScore = document.getElementById('personalBestScore');
    }

    attachEventListeners() {
        // Auth modal controls
        this.loginPrompt.addEventListener('click', () => this.showAuthModal('login'));
        this.authClose.addEventListener('click', () => this.hideAuthModal());
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToSignup();
        });
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Auth actions
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.signupBtn.addEventListener('click', () => this.handleSignup());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Enter key submit
        this.loginEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        this.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        this.signupPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });

        // Leaderboard
        this.leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.leaderboardClose.addEventListener('click', () => this.hideLeaderboard());

        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.switchLeaderboardTab(difficulty);
            });
        });

        // Close modals on outside click
        this.authModal.addEventListener('click', (e) => {
            if (e.target === this.authModal) this.hideAuthModal();
        });
        this.leaderboardModal.addEventListener('click', (e) => {
            if (e.target === this.leaderboardModal) this.hideLeaderboard();
        });
    }

    // Auth Modal Methods
    showAuthModal(mode = 'login') {
        this.authModal.classList.remove('hidden');
        if (mode === 'login') {
            this.switchToLogin();
        } else {
            this.switchToSignup();
        }
        this.clearAuthMessage();
    }

    hideAuthModal() {
        this.authModal.classList.add('hidden');
        this.clearForms();
        this.clearAuthMessage();
    }

    switchToLogin() {
        this.loginForm.classList.remove('hidden');
        this.signupForm.classList.add('hidden');
        this.authTitle.textContent = 'Login';
        this.clearAuthMessage();
    }

    switchToSignup() {
        this.loginForm.classList.add('hidden');
        this.signupForm.classList.remove('hidden');
        this.authTitle.textContent = 'Sign Up';
        this.clearAuthMessage();
    }

    clearForms() {
        this.loginEmail.value = '';
        this.loginPassword.value = '';
        this.signupUsername.value = '';
        this.signupEmail.value = '';
        this.signupPassword.value = '';
    }

    showAuthMessage(message, type = 'error') {
        this.authMessage.textContent = message;
        this.authMessage.classList.remove('hidden', 'error', 'success');
        this.authMessage.classList.add(type);
    }

    clearAuthMessage() {
        this.authMessage.classList.add('hidden');
        this.authMessage.textContent = '';
    }

    async handleLogin() {
        const email = this.loginEmail.value.trim();
        const password = this.loginPassword.value;

        if (!email || !password) {
            this.showAuthMessage('Please fill in all fields');
            return;
        }

        this.loginBtn.disabled = true;
        this.loginBtn.textContent = 'Logging in...';

        const result = await authManager.signIn(email, password);

        this.loginBtn.disabled = false;
        this.loginBtn.textContent = 'Login';

        if (result.success) {
            this.showAuthMessage(result.message, 'success');
            setTimeout(() => this.hideAuthModal(), 1500);
        } else {
            this.showAuthMessage(result.message);
        }
    }

    async handleSignup() {
        const username = this.signupUsername.value.trim();
        const email = this.signupEmail.value.trim();
        const password = this.signupPassword.value;

        if (!username || !email || !password) {
            this.showAuthMessage('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters');
            return;
        }

        this.signupBtn.disabled = true;
        this.signupBtn.textContent = 'Signing up...';

        const result = await authManager.signUp(email, password, username);

        this.signupBtn.disabled = false;
        this.signupBtn.textContent = 'Sign Up';

        if (result.success) {
            this.showAuthMessage(result.message, 'success');
        } else {
            this.showAuthMessage(result.message);
        }
    }

    async handleLogout() {
        const result = await authManager.signOut();
        if (result.success) {
            this.updateAuthUI(false);
        }
    }

    updateAuthUI(isLoggedIn) {
        if (isLoggedIn) {
            this.userPanel.classList.remove('hidden');
            this.loginPrompt.classList.add('hidden');
            this.usernameDisplay.textContent = authManager.getUsername();
        } else {
            this.userPanel.classList.add('hidden');
            this.loginPrompt.classList.remove('hidden');
        }
    }

    // Leaderboard Methods
    async showLeaderboard() {
        this.leaderboardModal.classList.remove('hidden');
        await this.loadLeaderboard(this.currentDifficulty);
    }

    hideLeaderboard() {
        this.leaderboardModal.classList.add('hidden');
    }

    async switchLeaderboardTab(difficulty) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        this.currentDifficulty = difficulty;
        await this.loadLeaderboard(difficulty);
    }

    async loadLeaderboard(difficulty) {
        this.leaderboardTable.innerHTML = '<div class="loading">Loading...</div>';

        // Load leaderboard
        const difficultyFilter = difficulty === 'ALL' ? null : difficulty;
        const result = await authManager.getLeaderboard(difficultyFilter, 10);

        // Load personal best if logged in
        if (authManager.isLoggedIn()) {
            const pbResult = await authManager.getPersonalBest(difficultyFilter);
            if (pbResult.success && pbResult.data) {
                this.personalBest.classList.remove('hidden');
                this.personalBestScore.textContent = `Score: ${pbResult.data.score} | ${pbResult.data.difficulty} | ${pbResult.data.character}`;
            } else {
                this.personalBest.classList.add('hidden');
            }
        } else {
            this.personalBest.classList.add('hidden');
        }

        // Display leaderboard
        if (result.success && result.data.length > 0) {
            this.renderLeaderboard(result.data);
        } else {
            this.leaderboardTable.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
        }
    }

    renderLeaderboard(scores) {
        this.leaderboardTable.innerHTML = '';

        scores.forEach((entry, index) => {
            const rank = index + 1;
            const div = document.createElement('div');
            div.className = `leaderboard-entry ${rank <= 3 ? `rank-${rank}` : ''}`;

            div.innerHTML = `
                <div class="leaderboard-rank">#${rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-username">${entry.username}</div>
                    <div class="leaderboard-details">${entry.difficulty} · ${entry.character}</div>
                </div>
                <div class="leaderboard-score">${entry.score}</div>
            `;

            this.leaderboardTable.appendChild(div);
        });
    }
}

// Initialize UI controller when DOM is ready
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    uiController = new UIController();
});
