# Quick Fix: Clerk JWT Issuer Domain Error

## The Error You're Seeing

```
[CONVEX] MissingEnvironmentVariable: CLERK_JWT_ISSUER_DOMAIN Not configured as environment variable
```

This error appears when trying to use the code lab grading feature because Convex needs to validate Clerk authentication tokens.

---

## Fix in 2 Steps

### Step 1: Get Your Clerk Issuer Domain

1. Go to your Clerk dashboard: https://dashboard.clerk.com/
2. Select your application
3. Click "API Keys" in the left sidebar
4. Scroll to "JWT Templates" section
5. Copy the **Issuer** URL (looks like: `https://absolute-elf-27.clerk.accounts.dev`)

### Step 2: Set in Convex Environment

Open terminal in your KRUZ project folder and run:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-domain.clerk.accounts.dev
```

**Replace** `https://your-clerk-domain.clerk.accounts.dev` with your actual Clerk issuer URL from Step 1.

---

## Verify the Fix

```bash
# Check that it's set
npx convex env list
```

You should see `CLERK_JWT_ISSUER_DOMAIN` in the list.

---

## Restart and Test

1. Restart your dev server if it's running:

   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. Go to a case study Practice section
3. Try submitting code again
4. The error should be gone ✅

---

## Still Having Issues?

### Make sure Convex is running:

```bash
npx convex dev
```

### Check if you have Clerk configured:

Your `.env.local` file should have:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

If not, get your Clerk publishable key from the dashboard and add it to `.env.local`.

---

## Complete Setup

If you're setting up for the first time, see:

- **`ENVIRONMENT_SETUP.md`** - Full environment configuration
- **`AI_GRADING_SETUP.md`** - AI provider setup for code grading

---

## What This Variable Does

`CLERK_JWT_ISSUER_DOMAIN` tells Convex:

1. Where to verify authentication tokens from
2. How to validate that signed-in users are legitimate
3. Which Clerk instance to trust

Without it, Convex can't verify user identity, so authenticated features (like code grading that awards RC) won't work.

---

## Quick Reference

```bash
# 1. Get Clerk issuer from dashboard
# https://dashboard.clerk.com/ → API Keys → JWT Templates → Issuer

# 2. Set in Convex
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-domain.clerk.accounts.dev

# 3. Verify
npx convex env list

# 4. Restart dev server
npm run dev
```

That's it! The error should be resolved. 🎉
