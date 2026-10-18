# 🍲 FoodRescue – Smart Surplus Food Redistribution & Donation System
### Advanced Database (AD) Full-Stack Project

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-cyan.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20v7+-green.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## 🌟 1. Project Objective

**FoodRescue** is a full-stack, college-level Advanced Database (AD) project engineered to combat urban food wastage and hunger. It digitally bridges commercial food donors (**hotels, restaurants, college canteens, bakeries, hostels, and banquet caterers**) with verified recipients (**homeless shelters, charitable NGOs, orphanages, and community kitchens**).

The application reduces food disposal by facilitating real-time surplus food listings, geospatial discovery, atomic stock reservation, intelligent rule-based compatibility matching (**Smart Match AI**), secure 6-digit OTP pickup verification, and comprehensive platform auditing.

---

## 🛠️ 2. Technology Stack

- **Frontend:** React (Vite) + JavaScript (ES6+)
- **Styling:** Tailwind CSS (Green & White modern design system, subtle gradients, soft shadows, glassmorphism)
- **Backend:** Node.js + Express.js (Modular REST API architecture)
- **Database:** MongoDB Atlas / Local MongoDB with official Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` password hashing and Role-Based Access Control (RBAC)
- **AI Matching Engine:** Deterministic rule-based Smart Match AI & Category Demand/Expiry Prediction
- **Data Visualization & Charts:** Recharts
- **Icons:** Lucide React

---

## 🍃 3. MongoDB Advanced Database (AD) Implementation

The database architecture leverages production-grade MongoDB capabilities across **6 core collections**:

| Collection | Schema Purpose & Key Fields |
| :--- | :--- |
| `users` | Role-based accounts (`donor`, `recipient`, `admin`), organization metadata, **GeoJSON 2dsphere Point coordinates**, verification status. |
| `foodListings` | Surplus food batches, category, total/remaining quantity, unit, dietary label, preparation timestamp, **proper BSON Date expiry**, storage protocol. |
| `donationRequests` | Claims linking listings to recipients with requested quantity, head count, vehicle logistics, message, and review status. |
| `pickupRecords` | Scheduled pickups with **6-digit verification OTP codes**, actual pickup timestamps, chain-of-custody notes, and star ratings. |
| `notifications` | Live user alerts configured with a **MongoDB TTL index** to automatically expire obsolete notifications after 30 days. |
| `auditLogs` | Immutable administrative audit stream indexing actors, actions, IP addresses, entity references, and change metadata. |

### Advanced Database Features Implemented:
1. **Compound Indexes:**
   - `{ status: 1, category: 1, expiryTime: 1 }` on `foodListings` for rapid compound filter queries.
   - `{ listingId: 1, recipientId: 1 }` and `{ recipientId: 1, status: 1 }` on `donationRequests`.
2. **Geospatial 2dsphere Indexing:**
   - `'location': '2dsphere'` on both `users` and `foodListings` enabling `$near` and `$geoNear` radius queries.
3. **MongoDB TTL (Time-To-Live) Index:**
   - `{ createdAt: 1 }, { expireAfterSeconds: 2592000 }` on `notifications` for automatic record pruning.
4. **Atomic Conditional Updates (Double-Claim Prevention):**
   - High-concurrency conditional query via `findOneAndUpdate` using `{ _id: listingId, remainingQuantity: { $gte: requestedQty } }` with `$inc: { remainingQuantity: -requestedQty }` preventing race conditions.
5. **MongoDB Aggregation Pipelines:**
   - `$lookup`, `$group`, `$sort`, `$project`, and date-based bucketing (`$dateToString: { format: "%Y-%m" }`) generating real-time dashboard KPIs, category distributions, and monthly donation trajectories.

---

## 🧠 4. Smart Match™ AI & Prediction Feature

The platform includes a transparent, rule-based **Smart Match Engine**:
- **Haversine Distance (30 pts):** Computes geographical distance in kilometers between donor and recipient coordinates.
- **Stock & Demand Fit (25 pts):** Analyzes requested quantity versus recipient's daily meal capacity.
- **Expiry Urgency Window (25 pts):** Prioritizes foods approaching critical shelf life (optimal window: 2 to 8 hours).
- **Dietary Alignment (15 pts):** Validates compatibility (e.g. Vegetarian/Vegan preference vs Non-Veg).
- **Recipient Priority (5 pts):** Favors verified NGOs with proven distribution capacity.

**Output:** A compatibility score out of 100 with an explicit, human-readable breakdown:
> *"95% match — nearby location (4.1 km away), sufficient quantity (50 meals available), 3.5 hrs remaining before expiry. Optimal rescue window before expiry."*

---

## 👥 5. Demonstration Credentials (For College Presentation)

For rapid demonstration during evaluation, use the credentials below or click **"Demo Switcher"** in the top navbar:

| Role | Email | Password | Persona & Purpose |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@foodrescue.org` | `AdminPassword123!` | System statistics, NGO identity verification, audit logs, and expiry cleanup. |
| **Donor (Hotel)** | `donor@foodrescue.org` | `DonorPassword123!` | Chef Rajesh Sharma at The Grand Orchid Banquet (Lists surplus, reviews claims). |
| **Donor (Bakery)** | `bakery@foodrescue.org` | `DonorPassword123!` | Crust & Crumb Artisan Bakery (Artisanal bread and dairy surplus). |
| **Recipient (NGO)** | `ngo@foodrescue.org` | `NgoPassword123!` | Sister Mary Joseph at Hope Community Kitchen (Verified, claims meals, tracks OTP). |
| **Pending NGO** | `newngo@shelter.org` | `NgoPassword123!` | Sunrise Urban Night Shelter (Unverified; test admin approval workflow). |

---

## 🚀 6. Installation & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- NPM (v9 or higher)

### Setup Instructions

1. **Clone or Open the Repository:**
   ```bash
   cd AD_Project
   ```

2. **Configure Environment Variables (Optional):**
   - Inspect `server/.env.example` or edit `server/.env`.
   - By default, `server/.env` uses:
     ```env
     PORT=5000
     CLIENT_URL=http://localhost:5173
     MONGODB_URI=mongodb://127.0.0.1:27017/foodrescue
     JWT_SECRET=foodrescue_jwt_super_secure_secret_key_2026_ad_project
     ```
   - **MongoDB Atlas:** You can replace `MONGODB_URI` with your MongoDB Atlas connection string:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/foodrescue?retryWrites=true&w=majority
     ```
   - **Offline / Zero-Config Demonstration:** If local MongoDB or Atlas is not available, the server automatically starts an in-memory MongoDB binary instance so the project can be demonstrated anytime without setup errors.

3. **Install Dependencies:**
   ```bash
   # From root directory:
   npm install --prefix server
   npm install --prefix client
   ```

4. **Seed Database with Realistic Demo Data:**
   ```bash
   npm run seed --prefix server
   ```

5. **Run the Application:**
   Open two terminal tabs:

   **Terminal 1 (Backend API):**
   ```bash
   cd server
   npm start
   # Server listens at http://localhost:5000
   ```

   **Terminal 2 (React Frontend):**
   ```bash
   cd client
   npm run dev
   # Frontend runs at http://localhost:5173
   ```

6. **Run Backend Test Suite:**
   ```bash
   cd server
   npm test
   # Runs 13 automated tests checking BSON models, atomic locks, geospatial queries, and seeds
   ```

---

## 📱 7. Application Page Directory

1. **Landing Page (`/`):** Food wastage crisis counters, solution workflow, live surplus feed, and impact metrics.
2. **Login & Registration (`/login`, `/register`):** Role-based registration with GeoJSON coordinates and 1-click persona switchers.
3. **Donor Dashboard (`/donor/dashboard`):** Active surplus batches, pending claim approvals, and delivery metrics.
4. **Create / Edit Surplus Food (`/listings/create`):** BSON date selector, refrigeration flag, quantity, and pickup address.
5. **Surplus Food Explorer (`/explore`):** 2dsphere distance slider, category filters, and search bar.
6. **Listing Details & Claim Modal (`/listings/:id`):** Food specifications, donor verified badges, and atomic stock claims.
7. **Smart Match Engine (`/smart-match`):** Rule-based compatibility scores (0-100), breakdown tags, and demand predictions.
8. **Recipient / NGO Dashboard (`/recipient/dashboard`):** Active food claims, top AI matches, and meals distributed.
9. **Donation Request Management (`/requests`):** Donor approval/rejection workflows with automatic stock restoration.
10. **Pickup Tracking & Logistics (`/pickups`):** Real-time chain of custody, 6-digit OTP verification, and star ratings.
11. **Admin Dashboard (`/admin/dashboard`):** System KPIs, pending verification queues, and database cleanup triggers.
12. **User Management (`/admin/users`):** Verify or reject NGOs, activate/deactivate accounts.
13. **Impact Analytics (`/analytics`):** Recharts monthly trend bars, category pie charts, and CO2 offset calculators.
14. **Profile & Settings (`/profile`):** User address, GeoJSON coordinates updater, and notification logs.
15. **System Audit Logs (`/admin/audit-logs`):** Immutable database audit log stream with IP and JSON diffs.

---

## 🏆 8. College Presentation Flow (Quick Demonstration Checklist)

1. **Show Landing Page:** Highlight the problem, live impact statistics, and mission.
2. **Use Demo Switcher:** Click **"Donor / Hotel"** in top navbar to log in as *Chef Rajesh Sharma*.
3. **Create Listing:** Click *"+ List Surplus Food"*, create a batch with 40 meals and 4 hours expiry.
4. **Use Demo Switcher:** Click **"NGO / Shelter"** to switch to *Sister Mary Joseph*.
5. **Demonstrate Smart Match:** Open `/smart-match`, demonstrate the 95% compatibility score and explanation.
6. **Submit Atomic Claim:** Claim 20 meals from the newly created batch; observe the remaining quantity update.
7. **Approve Claim & Generate OTP:** Switch back to Donor, approve the claim, and show the generated 6-digit pickup PIN.
8. **Verify Handover:** Enter the 6-digit OTP code to finalize the pickup.
9. **Admin Review:** Switch to **"Platform Admin"**; review the live audit trail and approve the pending NGO (*Sunrise Shelter*).
10. **View Analytics:** Open `/analytics` to show Recharts monthly trends and CO2 offset metrics.
