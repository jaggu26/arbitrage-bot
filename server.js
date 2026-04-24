const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── CONFIG ──────────────────────────────────────────────────────────────────────
// Auth credentials
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'arb123456';

// Exchange tokens & API keys
const REZOREX_ACCESS = process.env.REZOREX_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTA0ZDc2ZWY2OGVhMWUxY2E2NmE4MSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc3MDAyMjg4LCJleHAiOjE3NzcwMDI4ODh9.oQapQxuvX7gsmrISG2qC1Zk-m7bxrTxAto-_gRB7tl4';
const REZOREX_REFRESH = process.env.REZOREX_REFRESH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTA0ZDc2ZWY2OGVhMWUxY2E2NmE4MSIsInJvbGUiOiJ1c2VyIiwidG9rZW5UeXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc3MDAyMjg4LCJleHAiOjE3NzcwMDI4ODh9.oQapQxuvX7gsmrISG2qC1Zk-m7bxrTxAto-_gRB7tl4';
const REZOREX_API_KEY = process.env.REZOREX_API_KEY || 'rzr_eaf1b99124cb761f193e2d980889d9003150b9a3cc42755d';
const CRYPTOFORCE_API_KEY = process.env.CRYPTOFORCE_API_KEY || 'rzr_eaf1b99124cb761f193e2d980889d9003150b9a3cc42755d';

// ── LOGIN API ────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[Login attempt] ${username}`);

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    console.log(`[Login success] ${username}`);
    return res.json({ success: true, token, message: 'Login successful' });
  }

  console.log(`[Login failed] ${username} - wrong credentials`);
  return res.status(401).json({ error: 'Invalid username or password' });
});

// ── SERVE LOGIN PAGE ─────────────────────────────────────────────────────────
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── AUTH MIDDLEWARE (protect dashboard) ──────────────────────────────────────
app.use((req, res, next) => {
  // Public routes
  if (req.path === '/login.html' ||
      req.path === '/api/login' ||
      req.path === '/favicon.ico' ||
      req.path.startsWith('/login')) {
    return next();
  }

  // Check auth token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.includes(':')) {
    console.log(`[Auth] Unauthorized access to ${req.path}, redirecting to login`);
    return res.redirect('/login.html');
  }

  console.log(`[Auth] Authorized access to ${req.path}`);
  next();
});

// ── REDIRECT / TO INDEX.HTML ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 ArbWatch Server running on port ${PORT}`);
  console.log(`   🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`   🔐 Login: http://localhost:${PORT}/login.html`);
  console.log(`   👤 Username: ${AUTH_USERNAME}`);
  console.log(`   🔑 Password: ${AUTH_PASSWORD}\n`);
});

module.exports = app;