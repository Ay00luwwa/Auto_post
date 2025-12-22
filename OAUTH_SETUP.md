# OAuth and Social Media Login Setup Guide

This guide explains how to set up OAuth authentication for user login/signup and social media account connections.

## Overview

The application supports two types of OAuth:

1. **User Authentication OAuth** - For logging in/signing up users (Google, Facebook, GitHub)
2. **Social Media OAuth** - For connecting social media accounts for posting (Twitter, LinkedIn, Instagram, YouTube)

## User Authentication OAuth Setup

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/oauth/google/callback/` (development)
   - `https://yourdomain.com/api/auth/oauth/google/callback/` (production)
7. Copy the Client ID and Client Secret

### 2. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/oauth/facebook/callback/` (development)
   - `https://yourdomain.com/api/auth/oauth/facebook/callback/` (production)
6. Copy the App ID and App Secret

### 3. GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL: `http://localhost:8000/api/auth/oauth/github/callback/`
4. Copy the Client ID and Client Secret

## Social Media OAuth Setup

### 1. Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `http://localhost:8000/api/oauth/callback/twitter/`
5. Copy the Client ID and Client Secret

### 2. LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URL: `http://localhost:8000/api/oauth/callback/linkedin/`
4. Request access to required scopes
5. Copy the Client ID and Client Secret

### 3. Instagram OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Instagram Basic Display" product
4. Configure OAuth redirect URIs
5. Copy the Client ID and Client Secret

### 4. YouTube OAuth Setup

1. Use the same Google Cloud Console project as Google OAuth
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials (can reuse Google OAuth credentials)
4. Add redirect URI: `http://localhost:8000/api/oauth/callback/youtube/`

## Environment Variables

Add the following to your `.env` file:

```env
# User Authentication OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Social Media OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

## How It Works

### User Authentication Flow

1. User clicks "Sign in with Google/Facebook/GitHub" on login/register page
2. Frontend calls `/api/auth/oauth/{provider}/initiate/`
3. Backend returns OAuth authorization URL
4. User is redirected to OAuth provider
5. User authorizes the application
6. OAuth provider redirects to backend callback: `/api/auth/oauth/{provider}/callback/`
7. Backend exchanges code for tokens, creates/gets user, generates JWT
8. Backend redirects to frontend with JWT tokens in URL hash
9. Frontend extracts tokens, stores them, and redirects to dashboard

### Social Media Connection Flow

1. User goes to Connections page
2. User clicks "Connect" for a platform
3. Frontend calls `/api/oauth/initiate/{platform}/`
4. Backend returns OAuth authorization URL
5. User authorizes the connection
6. OAuth provider redirects to backend callback: `/api/oauth/callback/{platform}/`
7. Backend exchanges code for tokens and stores them in SocialAccount model
8. Connection is established

## Frontend Usage

### User Authentication

The OAuth buttons are automatically available on the Login and Register pages. Users can click them to authenticate with their preferred provider.

### Social Media Connections

Users can connect their social media accounts from the Connections page. Once connected, they can schedule posts to those platforms.

## Security Notes

1. **State Parameter**: OAuth flows use state parameters to prevent CSRF attacks
2. **Token Storage**: JWT tokens are stored in localStorage (consider httpOnly cookies for production)
3. **HTTPS**: Always use HTTPS in production
4. **Secrets**: Never commit OAuth secrets to version control
5. **Redirect URIs**: Always validate redirect URIs match your configured ones

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URI in your OAuth app settings matches exactly
2. **"Invalid state parameter"**: This usually means the session expired. Try again.
3. **"No email provided"**: Some OAuth providers require additional scopes to get email. Check your OAuth app configuration.
4. **CORS errors**: Make sure CORS is properly configured in Django settings

### Testing

1. Make sure all environment variables are set
2. Ensure Redis is running (for sessions)
3. Check that frontend and backend URLs match your configuration
4. Verify OAuth app settings match the redirect URIs

## Production Considerations

1. Use environment variables for all secrets
2. Enable HTTPS
3. Use secure session storage (Redis with SSL or database)
4. Implement rate limiting on OAuth endpoints
5. Add logging and monitoring
6. Use proper error handling and user feedback
7. Consider implementing OAuth token refresh for long-lived sessions

