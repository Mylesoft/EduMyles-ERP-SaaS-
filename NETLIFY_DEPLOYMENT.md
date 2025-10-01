# 🚀 Deploy EduMyles to Netlify - Complete Guide

## ✅ Configuration Files Added

Your repository now includes:
- `netlify.toml` - Netlify configuration
- Proper Next.js settings for deployment

---

## 🎯 Quick Fix for Current Deployment

### Option 1: Redeploy from Latest Commit

1. **Commit is pushed** - The config is now in your repo
2. **Go to Netlify dashboard**
3. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
4. Wait for build to complete
5. ✅ Should work now!

### Option 2: Manual Configuration

If auto-config doesn't work, set these in Netlify dashboard:

**Site Settings → Build & Deploy → Build Settings**

**Build command:**
```bash
cd apps/web && npm install --legacy-peer-deps && npm run build
```

**Publish directory:**
```bash
apps/web/.next
```

**Base directory:** (leave empty)

---

## 📋 Step-by-Step: Fresh Netlify Deployment

### Step 1: Import to Netlify

1. Go to: https://app.netlify.com/start
2. Click **"Import from Git"**
3. Select **GitHub**
4. Choose: **Mylesoft/EduMyles-ERP-SaaS-**
5. Click **"Deploy"**

### Step 2: Configure Build Settings

Netlify should auto-detect from `netlify.toml`, but verify:

**Build command:**
```
cd apps/web && npm install --legacy-peer-deps && npm run build
```

**Publish directory:**
```
apps/web/.next
```

**Base directory:** (leave empty)

### Step 3: Install Next.js Plugin

Netlify will automatically install `@netlify/plugin-nextjs` from the config.

### Step 4: Add Environment Variables

**Site settings → Environment variables → Add**

```
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

### Step 5: Deploy!

Click **"Deploy site"**

---

## 🐛 Troubleshooting 404 Errors

### Issue: "Page not found" on all routes

**Cause:** Netlify isn't routing correctly for Next.js

**Fix 1: Enable Next.js Plugin**

1. Go to: **Site settings → Plugins**
2. Make sure **@netlify/plugin-nextjs** is installed
3. If not, add it manually

**Fix 2: Update netlify.toml**

Make sure your `netlify.toml` has:
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Fix 3: Check Publish Directory**

The publish directory should be:
- `apps/web/.next` (with Next.js plugin)
- OR `apps/web/out` (if using static export)

**Fix 4: Verify Build Output**

Check build logs for:
```
✓ Compiled successfully
✓ Generating static pages
```

---

## 🔧 Alternative: Static Export

If the plugin doesn't work, use static export:

### Update `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',  // Change from 'standalone'
  images: {
    unoptimized: true,  // Required for static export
  },
  // ... rest of config
};
```

### Update `netlify.toml`:

```toml
[build]
  command = "cd apps/web && npm install --legacy-peer-deps && npm run build"
  publish = "apps/web/out"  # Change from .next to out
```

### Redeploy

Commit changes and redeploy.

---

## 📊 What the Config Does

### `netlify.toml` Breakdown:

```toml
[build]
  command = "..."           # What to run to build
  publish = "apps/web/.next"  # Where the built files are
  
[build.environment]
  NODE_VERSION = "18"       # Use Node 18

[[redirects]]
  from = "/*"               # All routes
  to = "/index.html"        # Go to Next.js
  status = 200              # Rewrite, not redirect

[[plugins]]
  package = "@netlify/plugin-nextjs"  # Next.js support
```

This tells Netlify:
1. How to build your app
2. Where to find built files
3. How to handle routing
4. To use Next.js plugin

---

## ✅ Expected Build Output

In Netlify build logs, you should see:

```
$ cd apps/web && npm install --legacy-peer-deps && npm run build
Installing dependencies...
✓ Dependencies installed
Building Next.js app...
✓ Compiled successfully
✓ Generating static pages (4/4)
✓ Finalizing page optimization
Build complete!
Next.js cache saved
Deploying to Netlify CDN...
✓ Site is live!
```

---

## 🌐 After Successful Deployment

You'll get:
- **Site URL**: `https://your-site-name.netlify.app`
- **Deploy previews**: For each branch/PR
- **Automatic deployments**: On every push

### Custom Domain (Optional)

1. Go to: **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter your domain: `yourdomain.com`
4. Follow DNS setup instructions
5. ✅ SSL automatically configured!

---

## 🚀 Deploy Backend API

Netlify is for frontend only. Deploy your backend separately:

### Option A: Netlify Functions (Serverless)
- Convert Express routes to Netlify Functions
- Good for small APIs

### Option B: Railway/Render (Recommended)
1. Deploy backend to Railway or Render
2. Get API URL
3. Update `NEXT_PUBLIC_API_URL` in Netlify
4. Redeploy

---

## 🎯 Common Issues & Fixes

### 1. Build Fails with "workspace:*" Error

**Solution:** The npm install with `--legacy-peer-deps` should handle this.

If not, remove `@edumyles/types` from `apps/web/package.json` temporarily.

### 2. Images Not Loading

**Problem:** Next.js Image Optimization doesn't work on Netlify free tier.

**Solution:** Add to `next.config.js`:
```javascript
images: {
  unoptimized: true,
}
```

### 3. API Calls Failing

**Problem:** `NEXT_PUBLIC_API_URL` not set or wrong.

**Solution:**
- Set environment variable in Netlify
- Make sure it starts with `https://`
- Test API URL independently

### 4. Build Times Out

**Problem:** Build taking too long (Netlify has limits).

**Solution:**
- Reduce dependencies
- Use Netlify Pro (more build minutes)
- Optimize build process

---

## 📞 Need Help?

**Check these:**

1. **Build logs** - Look for actual error messages
2. **Function logs** - If using Netlify Functions
3. **Deploy logs** - See what's being deployed

**Resources:**
- Netlify Docs: https://docs.netlify.com
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/
- Support: https://answers.netlify.com

---

## ✅ Quick Checklist

- [x] `netlify.toml` added to repository
- [ ] Commit and push to GitHub
- [ ] Trigger new deployment in Netlify
- [ ] Check build logs for errors
- [ ] Verify site loads correctly
- [ ] Set environment variables
- [ ] (Optional) Add custom domain
- [ ] (Optional) Deploy backend API

---

## 🎬 Success Indicators

Your deployment succeeded if:
- ✅ Build completes without errors
- ✅ Site loads at Netlify URL
- ✅ All pages accessible (not 404)
- ✅ Routing works correctly
- ✅ No console errors in browser

---

**Your Netlify configuration is ready! Redeploy to see it work.** 🎉

**Repository**: https://github.com/Mylesoft/EduMyles-ERP-SaaS-
