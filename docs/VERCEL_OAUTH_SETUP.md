# OAuth Configuration for Vercel Deployment

## Google OAuth Setup

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **learning-apps** (or your project name)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   https://vibe-editor-two.vercel.app/api/auth/callback/google
   ```
6. If you're testing locally, also add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Save**

### Step 2: Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

```env
AUTH_URL=https://vibe-editor-two.vercel.app
AUTH_SECRET=your-secret-key-here
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### Step 3: GitHub OAuth (if using)

1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Edit your OAuth App
3. Update **Authorization callback URL** to:
   ```
   https://vibe-editor-two.vercel.app/api/auth/callback/github
   ```
4. Add environment variables to Vercel:
   ```env
   AUTH_GITHUB_ID=your-github-client-id
   AUTH_GITHUB_SECRET=your-github-client-secret
   ```

### Step 4: Redeploy

After updating the OAuth settings and environment variables:

1. **GitHub** (if you pushed changes) - Wait for auto-deploy
2. **OR** Go to Vercel → Deployments → Click **Redeploy**

## Testing Locally

If you want to test OAuth locally, you need:

**Google Cloud Console:**

```
http://localhost:3000/api/auth/callback/google
```

**GitHub:**

```
http://localhost:3000/api/auth/callback/github
```

## Common Issues

### Error 400: redirect_uri_mismatch

**Problem**: The redirect URI in your OAuth client doesn't match the actual URL.

**Solution**:

1. Copy the exact URL from the error message
2. Add it to Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized
   redirect URIs
3. Wait 5-10 minutes for changes to propagate
4. Try again

### Application name mismatch

**Problem**: "learning-apps sent an invalid request"

**Solution**:

- Your Google OAuth client is named "learning-apps"
- Make sure you're using the correct client credentials in Vercel
- Check that `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` match the OAuth client
  named "learning-apps"

## Quick Checklist

- [ ] Added Vercel URL to Google OAuth redirect URIs
- [ ] Added Vercel URL to GitHub OAuth redirect URIs (if using GitHub)
- [ ] Set `AUTH_URL=https://vibe-editor-two.vercel.app` in Vercel
- [ ] Set all OAuth credentials in Vercel environment variables
- [ ] Redeployed the application
