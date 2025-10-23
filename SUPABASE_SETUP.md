# Supabase Setup Guide for Barkour

## Quick Setup (5 minutes)

### Step 1: Run the SQL Schema

1. Go to your Supabase project's SQL Editor:
   https://supabase.com/dashboard/project/rnzxoxmhtiectqgytnlq/sql

2. Copy the contents of `supabase-setup.sql` file

3. Paste and click "Run"

4. You should see: "Success. No rows returned"

### Step 2: Enable Email Authentication

1. Go to Authentication → Settings:
   https://supabase.com/dashboard/project/rnzxoxmhtiectqgytnlq/auth/settings

2. Under "Auth Providers", ensure **Email** is enabled

3. (Optional) Configure email templates under "Email Templates"

### Step 3: Test the Game!

That's it! The game is now ready with:
- ✅ User authentication (signup/login)
- ✅ Score tracking
- ✅ Personal best scores
- ✅ Global leaderboards
- ✅ Difficulty-based filtering

## What Was Created

The SQL script creates:

### Tables
1. **profiles** - User profiles (username, created_at)
2. **scores** - Game scores (user_id, score, difficulty, character)

### Security (Row Level Security)
- Users can only insert/update/delete their own data
- All scores are publicly viewable (for leaderboards)
- Profiles are publicly viewable (for usernames)

### Functions
1. **handle_new_user()** - Auto-creates profile on signup
2. **get_leaderboard()** - Fetch top scores
3. **get_personal_best()** - Fetch user's best score

## Features

### For Players
- **Sign up** with email and username
- **Login** to track scores
- **Automatic score saving** after each game
- **Personal best** tracking per difficulty
- **Global leaderboards** with top 10 scores
- **Filter by difficulty** (Easy/Medium/Hard)

### For Developers
- Fully functional auth system
- Secure RLS policies
- Real-time score updates
- Email verification (configurable)
- No backend code needed!

## Troubleshooting

### Issue: "Email not confirmed"
- By default, Supabase requires email confirmation
- To disable for testing: Auth → Settings → "Enable email confirmations" = OFF
- For production: Keep it ON for security

### Issue: "Row level security policy violation"
- Make sure you ran the entire `supabase-setup.sql` file
- Check that RLS policies were created successfully

### Issue: Scores not saving
- Check browser console for errors
- Verify user is logged in (auth state)
- Check Supabase logs: Logs → Auth / Database

## Optional: Email Configuration

To customize signup/login emails:

1. Go to: Auth → Email Templates
2. Customize:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

## Security Notes

### Why is the API key in the code?
- The `anon` key is SAFE to expose in client-side code
- Security is enforced by Row Level Security (RLS) policies
- Users can only access/modify their own data
- This is how Supabase is designed to work!

### Never expose:
- ❌ `service_role` key (has admin access)
- ❌ Database password
- ❌ JWT secret

### Safe to expose:
- ✅ `anon` (public) key
- ✅ Project URL
- ✅ These are protected by RLS!

## Monitoring

### View Recent Signups
```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### View Recent Scores
```sql
SELECT username, score, difficulty, created_at
FROM scores
ORDER BY created_at DESC
LIMIT 10;
```

### Top Scores by Difficulty
```sql
SELECT username, score, difficulty, character
FROM scores
WHERE difficulty = 'HARD'
ORDER BY score DESC
LIMIT 10;
```

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in the repo
