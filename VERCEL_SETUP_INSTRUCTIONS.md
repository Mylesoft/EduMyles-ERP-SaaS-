# 🚀 Vercel Setup Instructions - Fix Yarn Error

## ⚠️ Current Issue

Vercel is using **yarn** instead of **pnpm**, causing this error:
```
Error: Couldn't find package "@edumyles/database@workspace:*" 
required by "@edumyles/api@1.0.0" on the "npm" registry.
```

## 🔍 Root Cause

Vercel deployed from an old commit (`547b616`) before our pnpm configuration was added. The latest code (`ca4460f`) has the fix, but Vercel hasn't redeployed with it yet.

## ✅ Solution: Manual Vercel Configuration

Since `vercel.json` isn't being auto-detected, you need to **manually configure Vercel's dashboard**.

---

## 📝 Step-by-Step Fix

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your **EduMyles project**
3. Go to: **Settings** tab

### Step 2: Configure Build Settings

Navigate to: **Settings → General → Build & Development Settings**

Click **"Edit"** and set these values:

#### Framework Preset
```
Other
```

#### Root Directory
```
(leave empty)
```
or
```
.
```

#### Build Command
```
cd apps/web && pnpm install && pnpm run build
```
**OR** (recommended):
```
pnpm install && cd apps/web && pnpm run build
```

#### Output Directory
```
apps/web/.next
```

#### Install Command
**Override it** and set to:
```
echo "Using custom build command"
```

### Step 3: Save Changes

Click **"Save"** button

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"…"** (three dots menu)
4. Select **"Redeploy"**
5. ✅ Check **"Use existing Build Cache"** is OFF
6. Click **"Redeploy"**

---

## 🎯 Alternative Solution: Simplified Build

If the above doesn't work, try this **simpler approach**:

### Configuration Option 2

**Build Command:**
```bash
cd apps/web && npm install --legacy-peer-deps && npx next build
```

**Install Command:**
```bash
echo "Skipping root install"
```

**Output Directory:**
```
apps/web/.next
```

This approach:
- Skips the monorepo complexity
- Installs deps directly in `apps/web`
- Uses npm instead of pnpm (simpler for Vercel)

---

## 🔧 Alternative Solution: Deploy Only Web App

Another approach is to tell Vercel to **only look at the web app**:

### Step 1: Set Root Directory

In Vercel settings:

**Root Directory:** `apps/web`

### Step 2: Configure Build

**Framework Preset:** `Next.js`

**Build Command:**
```
npm install && npm run build
```

**Install Command:** (leave default)

**Output Directory:**
```
.next
```

### Step 3: Handle Dependencies

This won't work with `workspace:*` dependencies, so we need to modify the web app's package.json temporarily.

---

## ✅ Recommended Quick Fix

The **fastest solution** right now:

1. **Go to Vercel Dashboard**
2. **Settings → General → Build & Development Settings**
3. Set **Build Command** to:
   ```bash
   cd apps/web && npm install --legacy-peer-deps && npx next build
   ```
4. Set **Install Command** to:
   ```bash
   echo "Skip"
   ```
5. Set **Output Directory** to:
   ```
   apps/web/.next
   ```
6. **Save** and **Redeploy**

This bypasses the workspace issue entirely by installing deps locally in the web app.

---

## 🐛 Why vercel.json Isn't Working

Vercel's automatic detection can be finicky with monorepos. The `vercel.json` file is being ignored because:

1. Vercel detected `yarn.lock` or `package-lock.json` first (even though they don't exist)
2. The build system defaulted to yarn before reading `vercel.json`
3. Monorepo detection failed

**Manual configuration** in the dashboard **always overrides** auto-detection.

---

## 🎯 Long-Term Solution: Simplify for Vercel

If you want automatic deployments to work smoothly, consider:

### Option A: Separate Web App Deployment

Move `apps/web` to its own repository or branch for Vercel deployment.

### Option B: Build Script Wrapper

Create a `build-vercel.sh` script that handles everything:

```bash
#!/bin/bash
set -e

echo "Installing dependencies in web app..."
cd apps/web
npm install --legacy-peer-deps

echo "Building Next.js app..."
npm run build

echo "Build complete!"
```

Then set Vercel's build command to: `bash build-vercel.sh`

---

## 🎬 Expected Result

After configuration, Vercel should:

1. ✅ Run your custom build command
2. ✅ Install dependencies in `apps/web`
3. ✅ Build Next.js app successfully
4. ✅ Deploy without workspace errors

---

## 📞 Need Help?

If issues persist:

1. **Check Vercel build logs** - Look for what command it's actually running
2. **Verify file paths** - Ensure `apps/web/.next` exists after build
3. **Test locally** - Run the exact build command locally first
4. **Contact Vercel Support** - They can help with monorepo issues

---

## 🚀 Quick Start Checklist

- [ ] Go to Vercel dashboard
- [ ] Navigate to Settings → Build & Development
- [ ] Set custom build command
- [ ] Set output directory to `apps/web/.next`
- [ ] Save changes
- [ ] Trigger fresh deployment (no cache)
- [ ] Monitor build logs
- [ ] Verify successful deployment

---

**Once configured correctly, your deployments should succeed!** 🎉
