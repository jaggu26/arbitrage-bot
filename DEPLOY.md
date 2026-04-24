# 🚀 Deploy Arbitrage Bot to Railway (FREE)

## Quick Deploy (5 minutes)

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with GitHub or email (free tier available)

---

### Step 2: Deploy from GitHub

#### Option A: Push to GitHub First (Recommended)
```bash
cd /home/cfxdev/Desktop/REZOR/arbitrage-bot

# Initialize git if not already done
git init
git add .
git commit -m "Initial arbitrage bot deployment"

# Create a new repo on GitHub: https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/arbitrage-bot.git
git branch -M main
git push -u origin main
```

#### Option B: Connect Existing Repo
If the arbitrage-bot is already in a GitHub repo, just continue to Step 3.

---

### Step 3: Connect to Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub"**
3. Select your repository: `arbitrage-bot`
4. Click **"Deploy Now"**

Railway will automatically:
- Detect Node.js app
- Install dependencies
- Start the server on a public URL

---

### Step 4: Add Environment Variables
1. Go to Railway project **Settings**
2. Click **"Variables"** tab
3. Add the following:

```
REZOREX_ACCESS_TOKEN=<your_token>
REZOREX_REFRESH_TOKEN=<your_token>
CRYPTOFORCE_ACCESS_TOKEN=<your_token>
CRYPTOFORCE_REFRESH_TOKEN=<your_token>
NODE_ENV=production
PORT=3000
```

---

### Step 5: Get Your Public URL
Once deployed:
1. Go to **"Deployments"** tab
2. Find the **"Domains"** section
3. You'll see a URL like: `https://arbitrage-bot-production.up.railway.app`
4. **Share this URL with your friend!** ✅

---

## Alternative: Deploy to Render.com (Also Free)

### Step 1: Create Account
1. Go to **https://render.com**
2. Sign up with GitHub

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repo
3. Configure:
   - **Name:** `arbitrage-bot`
   - **Runtime:** `Node`
   - **Build command:** `npm install`
   - **Start command:** `npm start`

### Step 3: Add Environment Variables
- **Environment:** Add same variables as Railway step
- **Instance:** Free tier (0.5 CPU, 512 MB RAM)

### Step 4: Deploy
- Click **"Deploy"**
- Get your URL in format: `https://arbitrage-bot.onrender.com`

---

## Troubleshooting

### App won't start?
Check logs:
- **Railway:** Settings → Logs
- **Render:** Dashboard → Logs

### Getting 502/503 error?
- Make sure `PORT` environment variable is set
- Check that all required env variables are configured
- Restart the deployment

### API keys expired?
- Update tokens in Environment Variables
- Restart the deployment

---

## Cost
- **Railway:** FREE tier includes $5/month credit (more than enough for this app)
- **Render:** FREE tier with limits (good for testing)
- **GitHub:** FREE if repo is public

---

## Share with Friend
Once deployed, share the URL:
```
Here's the live arbitrage bot dashboard:
https://arbitrage-bot-production.up.railway.app

Check real-time profit opportunities across exchanges!
```

Your friend can:
- ✅ See all profitable arbitrage routes
- ✅ Track live price differences
- ✅ Monitor opportunities in real-time
- ✅ No setup needed (just open the URL)

---

## Next Steps
1. Deploy the app (Railway or Render)
2. Get your live URL
3. Share with friends
4. They can monitor opportunities 24/7

Enjoy! 🚀