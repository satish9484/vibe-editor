# 🚀 Production Deployment Guide

## Overview

This guide covers deployment for two scenarios:

1. **Standalone/Docker** - Local production build with `npm start`
2. **Vercel** - Cloud deployment

## ✅ What's Been Configured

### Auth.js Configuration (`auth.ts`)

```typescript
trustHost: process.env.VERCEL ? false : true;
```

- **Standalone/Docker**: `trustHost: true` - Works automatically
- **Vercel**: `trustHost: false` - Requires `AUTH_URL` environment variable

### Headers Configuration (`next.config.ts`)

- COOP/COEP headers only applied in production (HTTPS)
- No more browser warnings on HTTP localhost

### Environment Files

- Automatically included in standalone builds
- Supports both `.env` and `.env.local`

---

## 📦 Standalone Deployment (`npm start`)

### Prerequisites

- `.env` or `.env.local` file in project root
- All required environment variables configured

### Environment Variables Required

Create `.env.local` in your project root:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/vibe-editor?retryWrites=true&w=majority"

# Auth Secrets
AUTH_SECRET="your-super-secret-key-here"

# OAuth Providers
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# Optional: Set explicit URL (otherwise defaults to detected host)
# AUTH_URL="http://localhost:3000"
```

### Deploy Steps

```bash
# 1. Build the standalone version
npm run build

# 2. Start the standalone server
npm start

# 3. Access your app
# http://localhost:3000
```

**Note**: The `.env.local` file is automatically copied to `.next/standalone/`
during build.

---

## ☁️ Vercel Deployment

### Environment Variables Required in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/vibe-editor?retryWrites=true&w=majority

# Auth Configuration
AUTH_SECRET=your-super-secret-key-here
AUTH_URL=https://your-app-name.vercel.app

# OAuth Providers
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Optional: AI Service (Hugging Face)
HUGGINGFACE_API_KEY=hf_your_token_here
```

### Critical Configuration

1. **Set `AUTH_URL`**: Must match your Vercel deployment URL

   ```
   AUTH_URL=https://your-app-name.vercel.app
   ```

2. **Update OAuth Redirect URIs**:
   - Google: Add `https://your-app-name.vercel.app/api/auth/callback/google`
   - GitHub: Add `https://your-app-name.vercel.app/api/auth/callback/github`

3. **Generate Strong AUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

### Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Configure production deployment"
git push

# Vercel will auto-deploy
# Or manually trigger deployment from Vercel dashboard
```

---

## 🔍 Troubleshooting

### Standalone: "UntrustedHost" Error

**Problem**: Auth.js can't verify the host

**Solution**:

1. Ensure `.env.local` exists in project root
2. Verify `AUTH_SECRET` is set
3. Rebuild: `npm run build` then `npm start`

### Vercel: "UntrustedHost" Error

**Problem**: `AUTH_URL` not set or incorrect

**Solution**:

1. Go to Vercel → Settings → Environment Variables
2. Add `AUTH_URL` with your exact Vercel URL
3. Redeploy

### Browser Console: COOP/COEP Warnings

**Problem**: Headers ignored on HTTP

**Solution**: ✅ Already fixed! Headers now only apply in production (HTTPS)

### Environment Variables Not Loading

**Problem**: Variables not available in standalone build

**Solution**:

- Check `next.config.ts` has `outputFileTracingIncludes` configured (✅ already
  done)
- Ensure `.env.local` or `.env` exists in project root
- Rebuild after adding variables

---

## 🧪 Testing Your Deployment

### Standalone Testing

```bash
# 1. Build
npm run build

# 2. Start
npm start

# 3. Test in browser
curl http://localhost:3000/api/auth/session
```

### Vercel Testing

```bash
# Test your deployed app
curl https://your-app-name.vercel.app/api/auth/session
```

---

## 📊 Environment Variable Comparison

| Variable              | Standalone | Vercel       | Required             |
| --------------------- | ---------- | ------------ | -------------------- |
| `DATABASE_URL`        | ✅         | ✅           | Yes                  |
| `AUTH_SECRET`         | ✅         | ✅           | Yes                  |
| `AUTH_URL`            | Optional   | **Required** | Vercel only          |
| `AUTH_GOOGLE_ID`      | ✅         | ✅           | If using Google      |
| `AUTH_GOOGLE_SECRET`  | ✅         | ✅           | If using Google      |
| `AUTH_GITHUB_ID`      | ✅         | ✅           | If using GitHub      |
| `AUTH_GITHUB_SECRET`  | ✅         | ✅           | If using GitHub      |
| `HUGGINGFACE_API_KEY` | ❌         | ✅           | Vercel AI (optional) |

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different secrets** - Development vs Production
3. **Rotate `AUTH_SECRET`** regularly
4. **Limit OAuth redirect URIs** to your domains only
5. **Use HTTPS** - Always in production (Vercel handles this)

---

## 🎯 Quick Reference

### Local Standalone

```bash
# Build and run
npm run build && npm start

# Access
http://localhost:3000

# Environment file
.env.local
```

### Vercel

```bash
# Deploy
git push

# Access
https://your-app-name.vercel.app

# Environment variables
Vercel Dashboard → Settings → Environment Variables
```

---

## ✅ Verification Checklist

### Before Deploying

- [ ] All environment variables configured
- [ ] OAuth redirect URIs updated for production
- [ ] `AUTH_SECRET` is strong and unique
- [ ] `AUTH_URL` set correctly for Vercel
- [ ] Database connection string valid
- [ ] Tested locally first

### After Deploying

- [ ] App loads without errors
- [ ] Authentication works (sign in/sign out)
- [ ] No browser console errors
- [ ] All API endpoints functional
- [ ] Environment variables loaded correctly

---

For more details, see:

- [README.md](../README.md) - General setup
- [DOCKER-README.md](DOCKER-README.md) - Docker deployment
- [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) - API testing
