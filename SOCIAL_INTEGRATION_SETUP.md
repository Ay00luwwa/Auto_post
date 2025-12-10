# Social Media Integration Setup Guide

This guide explains how to set up OAuth credentials for each social media platform.

## Overview

The post automation system supports the following platforms:
- **Twitter/X** - Twitter API v2
- **Instagram** - Instagram Graph API (requires Facebook Business)
- **LinkedIn** - LinkedIn API v2
- **YouTube** - YouTube Data API v3

## Prerequisites

1. Create developer accounts on each platform
2. Create OAuth applications
3. Get API keys and secrets
4. Configure redirect URIs

## Platform-Specific Setup

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `http://localhost:8000/api/oauth/callback/twitter/`
5. Get Client ID and Client Secret
6. Add to `.env`:
   ```
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   ```

### Instagram

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a Facebook App
3. Add Instagram Basic Display or Instagram Graph API product
4. Set OAuth redirect URI: `http://localhost:8000/api/oauth/callback/instagram/`
5. Get App ID and App Secret
6. Add to `.env`:
   ```
   INSTAGRAM_CLIENT_ID=your_app_id
   INSTAGRAM_CLIENT_SECRET=your_app_secret
   ```

**Note:** Instagram requires a Business or Creator account connected to a Facebook Page.

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn using OpenID Connect" product
4. Set authorized redirect URLs: `http://localhost:8000/api/oauth/callback/linkedin/`
5. Get Client ID and Client Secret
6. Add to `.env`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

### YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Set authorized redirect URIs: `http://localhost:8000/api/oauth/callback/youtube/`
6. Get Client ID and Client Secret
7. Add to `.env`:
   ```
   YOUTUBE_CLIENT_ID=your_client_id
   YOUTUBE_CLIENT_SECRET=your_client_secret
   ```

## Environment Variables

Add these to your `.env` file in the project root:

```env
# Twitter
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

## Testing the Integration

1. Start the backend server
2. Use the frontend to connect accounts
3. Create a test post
4. Verify it posts to the platform

## Important Notes

- **Rate Limits**: Each platform has rate limits. Be mindful of how many posts you schedule.
- **Token Expiration**: Tokens expire. The system will attempt to refresh them automatically.
- **Permissions**: Ensure your OAuth apps request the necessary permissions for posting.
- **Production**: Update redirect URIs for production URLs.

## Troubleshooting

### "No active account connected"
- Make sure you've connected your account via the OAuth flow
- Check that the account is marked as active in the database

### "Token expired"
- The system should auto-refresh tokens
- If refresh fails, reconnect the account

### "API Error"
- Check your API credentials are correct
- Verify your app has the necessary permissions
- Check platform-specific requirements (e.g., Instagram requires Business account)

