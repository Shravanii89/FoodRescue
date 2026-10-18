# FoodRescue — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **FoodRescue** platform across **MongoDB Atlas**, **Render** (Node.js/Express Backend API), and **Vercel** (React/Vite Frontend SPA).

GitHub Repository: [https://github.com/Shravanii89/FoodRescue](https://github.com/Shravanii89/FoodRescue)

---

## 🏗 Architecture Overview

| Component | Technology | Platform | Root Directory | Build Command | Start / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Database** | MongoDB Atlas | MongoDB Cloud | N/A | Managed | Replica Set (`0.0.0.0/0` Access) |
| **Backend API** | Node.js / Express | Render Web Service | `server` | `npm install` | `node index.js` (or `npm start`) |
| **Frontend SPA** | React 19 / Vite / Tailwind | Vercel | `client` | `npm run build` | `dist` (with SPA Rewrites) |

---

## 📋 Phase 1: MongoDB Atlas Configuration (Requires Atlas Account)

1. **Log in to MongoDB Atlas:** [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create / Select Cluster:** Create a free M0 cluster or select an existing cluster.
3. **Database Access (User Credentials):**
   - Navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Set a strong username (e.g., `foodrescue_admin`) and password.
   - Database User Privileges: `Read and write to any database` (or specific to `foodrescue`).
   - Save credentials.
4. **Network Access (IP Whitelist for Render):**
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *Rationale:* Render dynamic cloud instances assign variable outbound IPs. Whitelisting `0.0.0.0/0` ensures uninterrupted connectivity.
5. **Get Connection String:**
   - Go to **Database** → **Clusters** → Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy connection string format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/foodrescue?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

> ⚠️ **Security Reminder:** Never commit connection strings or credentials to Git. `server/.env` is tracked in `.gitignore` and must remain private.

---

## 🚀 Phase 2: Render Backend Web Service Deployment (Requires Render Account)

1. **Log in to Render:** [https://dashboard.render.com](https://dashboard.render.com)
2. **Create New Web Service:**
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository: `https://github.com/Shravanii89/FoodRescue`.
3. **Configure Service Settings:**
   - **Name:** `foodrescue-api` (or preferred name)
   - **Region:** Choose the region closest to your MongoDB Atlas cluster (e.g., Singapore, Frankfurt, Oregon)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`
4. **Configure Environment Variables in Render:**
   Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production error sanitization |
   | `HOST` | `0.0.0.0` | Binds server to all network interfaces |
   | `PORT` | `10000` | (Or leave empty, Render assigns automatically) |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/foodrescue?retryWrites=true&w=majority` | Atlas connection string |
   | `JWT_SECRET` | `your_long_random_jwt_secret_key_minimum_32_chars` | Token signing secret |
   | `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
   | `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | Allowed CORS origin (can update after Vercel step) |
   | `AUTO_SEED` | `false` | `false` preserves live database; set `true` only for demo auto-initialization |
5. **Deploy:**
   - Click **Create Web Service**.
   - Wait for deployment logs.
   - Verify health check endpoint:
     ```bash
     curl https://<your-render-subdomain>.onrender.com/api/health
     ```
   - Expect response: `{"status":"ok","project":"FoodRescue...","database":{"isConnected":true}}`.

---

## 🌐 Phase 3: Vercel Frontend SPA Deployment (Requires Vercel Account)

1. **Log in to Vercel:** [https://vercel.com](https://vercel.com)
2. **Add New Project:**
   - Click **Add New...** → **Project**.
   - Import Git repository: `https://github.com/Shravanii89/FoodRescue`.
3. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `client`
   - **Build Command:** `npm run build` (Default)
   - **Output Directory:** `dist` (Default)
   - **Install Command:** `npm install` (Default)
4. **Configure Environment Variables in Vercel:**
   Under **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<your-render-subdomain>.onrender.com/api` | Full URL of your deployed Render backend |
5. **Deploy:**
   - Click **Deploy**.
   - The included [`client/vercel.json`](file:///c:/Users/adhav/OneDrive/Desktop/AD_Project/client/vercel.json) handles SPA client-side routing rewrites so refreshing pages like `/explore` or `/donor/dashboard` loads smoothly without 404 errors.
6. **Copy Deployed Frontend URL:**
   - E.g., `https://foodrescue-frontend.vercel.app`.

---

## 🔄 Phase 4: Finalize CORS Handshake

1. Return to **Render Dashboard** → Your `foodrescue-api` service.
2. Go to **Environment**.
3. Update `CLIENT_URL` to match your Vercel production domain:
   ```text
   CLIENT_URL=https://foodrescue-frontend.vercel.app
   ```
4. Click **Save Changes** (Render will automatically redeploy with the updated CORS policy).

---

## 🧪 Phase 5: Verification & Post-Deployment Checklist

- [ ] **Backend Health:** Open `https://<render-url>/api/health` and verify `database.isConnected` is `true`.
- [ ] **Frontend Loading:** Open `https://<vercel-url>` and verify landing page loads without console errors.
- [ ] **SPA Direct Refresh:** Navigate to `/explore` and refresh the browser page to ensure Vercel rewrites work.
- [ ] **User Registration / Login:** Register a test donor or recipient user and verify JWT persistence in browser `localStorage`.
- [ ] **Food Listing Creation:** Create a test food donation listing from the donor dashboard.
- [ ] **Atomic Claim Request:** Log in as a recipient and claim a portion of the listing; check remaining quantity decrements.
- [ ] **Pickup Completion:** Approve request and complete pickup using the 6-digit verification PIN.
- [ ] **Smart Match Engine:** Check `/smart-match` recommendations score transparency.
- [ ] **Admin Dashboard:** Access analytics and audit logs to verify aggregation pipelines.
