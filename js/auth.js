// Supabase Authentication and Score Management
class AuthManager {
    constructor() {
        // Initialize Supabase client
        const { createClient } = supabase;
        this.supabase = createClient(
            'https://rnzxoxmhtiectqgytnlq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenhveG1odGllY3RxZ3l0bmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA0NTYsImV4cCI6MjA3NjcxNjQ1Nn0.I7Awfo_o5m8N38ZroECPJ8hTMnAnGtGpE69VTod1oWM'
        );

        this.currentUser = null;
        this.currentProfile = null;

        // Initialize auth state
        this.initAuth();
    }

    async initAuth() {
        // Check for existing session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadProfile();
        }

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                this.currentUser = session.user;
                await this.loadProfile();
                this.onAuthChange(true);
            } else {
                this.currentUser = null;
                this.currentProfile = null;
                this.onAuthChange(false);
            }
        });
    }

    async loadProfile() {
        if (!this.currentUser) return;

        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (data) {
            this.currentProfile = data;
        }
    }

    // Sign up new user
    async signUp(email, password, username) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            return { success: true, message: 'Check your email to confirm your account!' };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: error.message };
        }
    }

    // Sign in existing user
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { success: true, message: 'Logged in successfully!' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            return { success: true, message: 'Logged out successfully!' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: error.message };
        }
    }

    // Save score to database
    async saveScore(score, difficulty, characterName) {
        if (!this.currentUser || !this.currentProfile) {
            console.log('Not logged in, score not saved');
            return { success: false, message: 'Not logged in' };
        }

        try {
            const { data, error } = await this.supabase
                .from('scores')
                .insert([
                    {
                        user_id: this.currentUser.id,
                        username: this.currentProfile.username,
                        score: Math.floor(score),
                        difficulty: difficulty,
                        character: characterName
                    }
                ])
                .select();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Save score error:', error);
            return { success: false, message: error.message };
        }
    }

    // Get global leaderboard
    async getLeaderboard(difficulty = null, limit = 10) {
        try {
            let query = this.supabase
                .from('scores')
                .select('username, score, difficulty, character, created_at')
                .order('score', { ascending: false })
                .limit(limit);

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return { success: false, message: error.message };
        }
    }

    // Get user's personal best
    async getPersonalBest(difficulty = null) {
        if (!this.currentUser) {
            return { success: false, message: 'Not logged in' };
        }

        try {
            let query = this.supabase
                .from('scores')
                .select('score, difficulty, character, created_at')
                .eq('user_id', this.currentUser.id)
                .order('score', { ascending: false })
                .limit(1);

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data: data[0] || null };
        } catch (error) {
            console.error('Get personal best error:', error);
            return { success: false, message: error.message };
        }
    }

    // Get user's score history
    async getScoreHistory(limit = 20) {
        if (!this.currentUser) {
            return { success: false, message: 'Not logged in' };
        }

        try {
            const { data, error } = await this.supabase
                .from('scores')
                .select('score, difficulty, character, created_at')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Get score history error:', error);
            return { success: false, message: error.message };
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.currentUser;
    }

    // Get current username
    getUsername() {
        return this.currentProfile?.username || 'Guest';
    }

    // Callback for auth state changes (to be overridden by game)
    onAuthChange(isLoggedIn) {
        // This will be overridden by the game to update UI
        console.log('Auth state changed:', isLoggedIn);
    }
}

// Create global auth manager instance
const authManager = new AuthManager();
