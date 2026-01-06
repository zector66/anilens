# AniList Interactive Intelligence Platform - Setup Guide

## 🔧 Environment Setup

The application requires an AniList Client ID for OAuth authentication.

### Step 1: Get AniList Client ID
1. Go to [AniList Developer Portal](https://anilist.co/settings/developer)
2. Create a new application
3. Set redirect URI to: `http://localhost:3000/auth/callback`
4. Copy your Client ID

### Step 2: Configure Environment
Create a `.env.local` file in root directory:

```bash
# AniList OAuth Configuration
# Get your Client ID from: https://anilist.co/settings/developer
# Set redirect URI to: http://localhost:3000/auth/callback
NEXT_PUBLIC_ANILIST_CLIENT_ID=your-actual-client-id-here
```

### Step 3: Run the Application
```bash
npm run dev
```

## 🚀 Features

- **Taste Analytics**: Deep analysis of your anime preferences
- **Interactive Games**: Test your anime knowledge
- **OAuth Authentication**: Secure login with AniList
- **Modern UI**: Responsive design with Tailwind CSS

## 📱 Usage

1. Visit `http://localhost:3000`
2. Click "Login with AniList"
3. Authorize the application on AniList
4. You'll be redirected back and automatically logged in
5. Explore your anime intelligence dashboard

## 🔐 OAuth Flow

This application uses the standard Authorization Code flow:

1. **Login Request**: Redirects to AniList for authorization
2. **User Authorization**: User approves the application
3. **Code Exchange**: Authorization code is exchanged for access token
4. **Access Granted**: User is logged in with access token

## 🐛 Troubleshooting

### "unsupported_grant_type" Error
- **Cause**: Using wrong OAuth flow (Token instead of Authorization Code)
- **Fix**: This has been fixed in the latest version

### If you don't see the login button:
1. Check that `.env.local` exists with the correct Client ID
2. Restart the development server
3. Check browser console for errors

### Authentication fails:
1. Verify redirect URI matches exactly: `http://localhost:3000/auth/callback`
2. Ensure Client ID is correct
3. Check that application is not in "development mode" on AniList

## 🎮 Demo Mode

For testing without a real Client ID:
- The app includes a demo Client ID
- OAuth flow will work but won't return real user data
- Get a real Client ID for full functionality
