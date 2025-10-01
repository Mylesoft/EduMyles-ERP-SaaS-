# 🚀 Deploying EduMyles to Vercel

This guide explains how to deploy the EduMyles frontend to Vercel.

## 📋 Prerequisites

- Vercel account connected to your GitHub repository
- Environment variables configured
- PostgreSQL database (for API connection)

## ⚙️ Vercel Configuration

The repository is configured with:
- `vercel.json` - Specifies build commands and output directory
- `.npmrc` - Configures pnpm settings for Vercel
- `pnpm-lock.yaml` - Lock file for dependency management

## 🔧 Vercel Project Settings

### Root Directory
Leave as **root** (default) - Vercel will detect the monorepo structure

### Framework Preset
- **Framework**: Other (we specify custom commands)
- **Build Command**: `pnpm run build --filter=@edumyles/web`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Output Directory**: `apps/web/.next`

### Node.js Version
- **Version**: 18.x or 20.x (specified in package.json engines)

## 🌍 Environment Variables

Add these environment variables in Vercel dashboard (Settings → Environment Variables):

### Required for Frontend

```env
# API Connection
NEXT_PUBLIC_API_URL=https://your-api-url.com

# If using NextAuth (future)
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

## 📝 Step-by-Step Deployment

### 1. Import Project to Vercel

```bash
# Option A: Via Vercel Dashboard
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your EduMyles repository
4. Click "Import"
```

### 2. Configure Build Settings

In the import wizard:

**Project Name**: `edumyles` (or your preferred name)

**Root Directory**: `.` (leave as root)

**Build and Output Settings**:
- Override: Yes
- Build Command: `pnpm run build --filter=@edumyles/web`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install --frozen-lockfile`

### 3. Add Environment Variables

Click "Environment Variables" and add:
- `NEXT_PUBLIC_API_URL` = Your API URL

### 4. Deploy!

Click **Deploy** and wait for the build to complete.

## 🔍 Troubleshooting

### Issue: "Couldn't find package @edumyles/... on npm registry"

**Solution**: This means Vercel is using yarn instead of pnpm.

Fix:
1. Ensure `pnpm-lock.yaml` is committed
2. Verify `.npmrc` exists in root
3. Check `vercel.json` has correct install command
4. In Vercel dashboard, ensure install command is: `pnpm install --frozen-lockfile`

### Issue: "Module not found: Can't resolve '@edumyles/types'"

**Solution**: The workspace package isn't being transpiled.

Fix:
1. Check `next.config.js` has `transpilePackages: ['@edumyles/types']`
2. Rebuild: `pnpm run build --filter=@edumyles/web`

### Issue: Build succeeds but app crashes at runtime

**Solution**: Missing environment variables or API not accessible.

Fix:
1. Check all `NEXT_PUBLIC_*` environment variables are set
2. Verify API URL is accessible from Vercel
3. Check Vercel function logs for errors

### Issue: "Command 'pnpm' not found"

**Solution**: Vercel isn't detecting pnpm.

Fix:
1. Commit `pnpm-lock.yaml` to git
2. Add `"packageManager": "pnpm@8.15.0"` to root `package.json`
3. Redeploy

## 🎯 Production Checklist

Before going live:

- [ ] Database is production-ready (not local)
- [ ] API is deployed and accessible
- [ ] All environment variables are set
- [ ] Custom domain configured (optional)
- [ ] CORS is configured on API to allow Vercel domain
- [ ] Build completes successfully
- [ ] App loads without errors
- [ ] API connections work
- [ ] Test all critical user flows

## 🔄 Automatic Deployments

Vercel automatically deploys on:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests (for testing)

Each deployment gets a unique URL for testing.

## 📊 Monitoring

Monitor your deployment:
- **Analytics**: Vercel dashboard → Analytics
- **Logs**: Vercel dashboard → Deployments → (select deployment) → Function Logs
- **Performance**: Vercel dashboard → Speed Insights

## 🚀 Deploy API Separately

The frontend (Vercel) needs a backend API. Options:

1. **Railway**: https://railway.app (recommended)
2. **Render**: https://render.com
3. **Fly.io**: https://fly.io
4. **AWS/GCP**: For enterprise scale

Configure `NEXT_PUBLIC_API_URL` to point to your deployed API.

## 📞 Need Help?

Common issues:
- Check Vercel deployment logs
- Verify all files are committed to git
- Test build locally: `pnpm run build --filter=@edumyles/web`
- Review Vercel documentation: https://vercel.com/docs

---

**Happy Deploying!** 🎉
