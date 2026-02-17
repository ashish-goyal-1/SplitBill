# 💰 SplitBill

A powerful real-time full-stack MERN app for smart group expense tracking, optimized debt settlement, and insightful analytics.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-SplitBill-success?style=for-the-badge)](https://splitbill-nx5k.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-ashish--goyal--1-blue?logo=github)](https://github.com/ashish-goyal-1/SplitBill)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ashish%20Goyal-blue?logo=linkedin)](https://www.linkedin.com/in/ashish-goyal-66422b257/)

> 🌐 **Live Demo**: [https://splitbill-nx5k.onrender.com](https://splitbill-nx5k.onrender.com)

---

## 📸 Screenshots

| Dashboard (Light) | Dashboard (Dark) |
|---|---|
| ![Dashboard Light](Screenshots/Dashboard%20(Light).png) | ![Dashboard Dark](Screenshots/Dashboard%20(Dark).png) |

| Analytics | Expense List |
|---|---|
| ![Analytics](Screenshots/Dashboard-%20Analytics.png) | ![Group Expenses](Screenshots/Group%20View%20-%20Expenses.png) |

---

## ✨ Key Highlights

### ⚖️ Smart Debt Settlement
Uses a **Hybrid O(N log N) Algorithm** to minimize total transactions. Supports **Equal, Exact, and Percentage** split types.
- **Transactional Integrity**: All financial updates are wrapped in **ACID Transactions** to prevent data inconsistency.
- **Idempotency**: Duplicate payment prevention using unique keys to handle network retries safely.
- **Verified Accuracy**: 20+ Jest test cases covering edge cases and performance benchmarks.

### 🛡️ Security & Privacy-First Design
- **JWT Dual-Token System**: Secure Access + Refresh token rotation flow.
- **Privacy-Focused Search**: Members can only be found by **exact email**—preventing data harvesting or unintended discovery.
- **Hardened Headers**: **Helmet.js** integration for secure HTTP headers.
- **Brute-Force Protection**: Strict **Rate Limiting** (10 attempts/hour) on Auth endpoints.

### ⚡ Real-Time & High Performance
- **Live Sync**: **Socket.io** powered instant UI updates across all devices.
- **PWA Optimized**: Offline support and installable on mobile/desktop via Service Workers.
- **Performance Tuning**: **Gzip compression** (~70% smaller payloads) and **Code Splitting** (React.lazy) for fast initial loads.

### 📊 Insightful Data & Automation
- **Advanced Analytics**: Real-time spending trends using **MongoDB Aggregation Pipelines**.
- **Pro Automation**: Recurring daily/weekly/monthly expenses and automatic email settlement confirmations.
- **Audit Trail**: Complete group activity history with timestamps.
- **Data Export**: Download group reports as **PDF** invoices or **CSV** spreadsheets for external analysis.

### 🏠 Production-Grade Resilience
- **Health Monitoring**: Dedicated `/health` endpoint for uptime monitoring.
- **Graceful Shutdown**: Clean process termination (`SIGTERM`) ensuring all DB connections close safely.
- **Global Error Handling**: Standardized JSON error response system for predictable failure states.

### 🧪 Robust Testing
- **Jest Test Suite**: Comprehensive unit tests validating the core splitting algorithm.
- **Edge Case Coverage**: Verified against complex scenarios (circular debts, zero-sum cycles).
- **Benchmark Proven**: Algorithm performance validated for large group sizes.

---

## 🧮 How it Works: Debt Simplification

The settlement algorithm uses a **two-step hybrid approach** to minimize transactions:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Hash-based Exact Match [O(N)]                      │
│   Rahul pays Neha ₹30 (Exact balance offset found!)         │
└───────────────────────────────┬─────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Sorted Two-Pointer Greedy [O(N log N)]             │
│   Amit pays Priya ₹20 (Remaining balances cleared)          │
└─────────────────────────────────────────────────────────────┘
```

For a deep dive into the math and logic, see the [Architecture Documentation](./architecture.md#-debt-simplification).

---

## 🛠️ Tech Stack

- **Frontend**: React, Material UI, Socket.io-client, Chart.js, Service Workers (PWA).
- **Backend**: Node.js, Express, Socket.io, Mongoose.
- **Database**: MongoDB Atlas (Aggregation Pipelines, Transactions).
- **DevOps**: Winston Logging, Health Checks, Render Deployment.

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 3001) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | Yes | Secret key for JWT access tokens |
| `REFRESH_TOKEN_SECRET` | No | Secret for refresh tokens (falls back to ACCESS_TOKEN_SECRET) |
| `EMAIL_USER` | No | Gmail address for sending notifications |
| `EMAIL_PASS` | No | Gmail app password (not regular password) |
| `APP_URL` | No | Frontend URL for email links (default: http://localhost:3000) |

**Example `.env`:**
```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/splitbill
ACCESS_TOKEN_SECRET=<your_super_secret_jwt_key_here>
REFRESH_TOKEN_SECRET=<your_refresh_token_secret>
EMAIL_USER=<your_email@gmail.com>
EMAIL_PASS=<your_gmail_app_password>
APP_URL=https://your-app-url.com
```

> **Note**: For Gmail, you need to use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ (LTS recommended)
- MongoDB Atlas account
- Gmail app password for emails

### Installation

1. Clone the repository
```bash
git clone https://github.com/ashish-goyal-1/SplitBill.git
cd SplitBill
```

2. Install dependencies
```bash
npm install
cd client && npm install
```

3. Create `.env` file (see [Environment Variables](#-environment-variables) section above)

4. Start the application
```bash
npm run dev
```

- Client runs on `http://localhost:3000`
- Server runs on `http://localhost:3001`

---

## 📄 Deep Dive Documentation

For a detailed breakdown of the **Technical Architecture**, **Full API Reference**, and **Database Schema**, please refer to:
👉 **[architecture.md](./architecture.md)**

---

## 👨‍💻 Developer

**Ashish Goyal**  
[GitHub](https://github.com/ashish-goyal-1) | [LinkedIn](https://www.linkedin.com/in/ashish-goyal-66422b257/)
