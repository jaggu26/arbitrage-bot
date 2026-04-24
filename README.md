# 🚀 ArbWatch — Real-Time Arbitrage Dashboard

Your arbitrage bot is **READY TO DEPLOY** with built-in authentication!

## ✨ Features

- 🔐 **Login Protection** — Only you and your friend can access
- 📊 **Real-Time Dashboard** — Live arbitrage opportunities
- 💰 **Profit Calculator** — Instant ROI calculations
- 🌐 **Multi-Exchange** — Binance, KuCoin, Gate.io, RezorEx, CryptoForce
- 📱 **Responsive UI** — Works on mobile & desktop

---

## 🔑 Login Credentials (Pre-configured)

```
Username: admin
Password: arb123456
```

> **⚠️ Change these after deployment!** Update `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables.

---

## 📦 Deploy Now (Choose One)

### **Option 1: Render.com (Easiest - 2 minutes)**

```bash
1. Go to https://render.com
2. Click "New Web Service"
3. Connect GitHub → Select arbitrage-bot
4. Set environment variables:
   - AUTH_USERNAME=admin
   - AUTH_PASSWORD=arb123456
   - NODE_ENV=production
5. Click "Deploy"
6. Get URL from dashboard (e.g., https://arbitrage-bot.onrender.com)
```

**Cost:** FREE  
**Uptime:** 99.99%

---

### **Option 2: Railway.app (Also Easy - 3 minutes)**

```bash
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select arbitrage-bot repository
4. Go to Settings → Variables
5. Add same 3 environment variables
6. Get URL from Domains section
```

**Cost:** FREE ($5/month credit)  
**Uptime:** High

---

### **Option 3: Vercel (For Static + Serverless)**

```bash
1. Go to https://vercel.com
2. Import GitHub repo
3. Add environment variables
4. Deploy
```

**Cost:** FREE  
**Perfect for:** High traffic

---

## 🌐 Your Live URL

Once deployed, share this with your friend:

```
https://your-deployed-url.com

Login with:
Username: admin
Password: arb123456
```

---

## 📊 What Your Friend Will See

- Real-time arbitrage opportunities across exchanges
- Profit calculations for different capital amounts
- Live bid-ask spreads
- Exchange price comparisons
- Historical data tracking

---

## ⚙️ Customize Login

**Change credentials anytime:**

1. Go to your platform dashboard (Render/Railway)
2. Update environment variables:
   ```
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_password
   ```
3. Restart the app

---

## 📝 Environment Variables

Required variables (set in platform dashboard):

```
AUTH_USERNAME       Username for login (default: admin)
AUTH_PASSWORD       Password for login (default: arb123456)
NODE_ENV            Should be "production"
PORT                Usually 3000 (auto-set by platform)
```

Optional (if connecting to exchanges):
```
REZOREX_ACCESS_TOKEN
REZOREX_REFRESH_TOKEN
CRYPTOFORCE_ACCESS_TOKEN
CRYPTOFORCE_REFRESH_TOKEN
```

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Visit http://localhost:3000
```

---

## 📊 Architecture

```
┌─────────────────────┐
│   User Browser      │
│   (Frontend)        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Login.html        │  ← Authentication
│   (Protected)       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Dashboard UI      │  ← Real-time updates
│   (Index.html)      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Express Server    │
│   (Backend)         │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │  Exchanges   │
    │ (Live Prices)│
    └──────────────┘
```

---

## 🚀 Get Started Now!

**Choose Render.com (easiest):**
1. https://render.com → Sign up
2. New Web Service → GitHub
3. Select arbitrage-bot
4. Add 3 environment variables
5. Deploy! ✅

**5 minutes later:**
- Your bot is live
- Share URL with friend
- Monitor arbitrage 24/7

---

## 💡 Pro Tips

1. **Customize Port:** Update `PORT` environment variable if needed
2. **Enable HTTPS:** Most platforms (Render, Railway) do this automatically
3. **Monitor Logs:** Check platform logs if something breaks
4. **Scale Up:** Upgrade to paid plan if you get thousands of visitors

---

## 🆘 Support

- **Deployment issues?** Check platform's documentation
- **Login not working?** Verify environment variables
- **App crashing?** Check logs in platform dashboard

---

## 📄 License

This arbitrage bot is yours to use, modify, and share!

---

**Ready to deploy?** Pick a platform above and go live in 5 minutes! 🎉