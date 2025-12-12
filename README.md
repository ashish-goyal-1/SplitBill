# 💰 SplitBill

A powerful full-stack MERN app for smart group expense tracking, optimized debt settlement, recurring expenses, exportable reports, real-time notifications, and insightful analytics.

[![GitHub](https://img.shields.io/badge/GitHub-ashish--goyal--1-blue?logo=github)](https://github.com/ashish-goyal-1/SplitBill)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ashish%20Goyal-blue?logo=linkedin)](https://www.linkedin.com/in/ashish-goyal-66422b257/)

---

## ✨ Features

### 🔐 Authentication & Security
- Secure login & registration with **JWT dual-token system**
- **Access Token** (15 min) + **Refresh Token** (7 days) with rotation
- Encrypted passwords (bcryptjs)
- Profile view/edit with Gravatar support
- Automatic token refresh for seamless UX

### 👥 Group Management
- Create/edit/delete groups
- Add/remove members by email
- Multiple currencies supported (INR, USD, EUR)
- Group categories: Trip, Home, Couple, etc.

### 💸 Expense Tracking
- Add/edit/delete group expenses
- Categorize and filter by type/date
- Auto-split expenses by group size
- Recurring options: daily/weekly/monthly/yearly

### 💰 Settlements & Smart Splitting
- **Hybrid O(N log N) Algorithm** for optimal debt simplification:
  - **Step 1**: O(N) Hash-based exact match heuristic
  - **Step 2**: O(N log N) Sorted two-pointer greedy
- Minimizes number of transactions between group members
- Balance view (who owes whom)
- Record settlements and payment methods

### 📧 Email System
- Manual nudges for unsettled balances
- Daily automatic reminders via node-cron
- Settlement confirmation notifications

### 📊 Analytics & Dashboard
- **MongoDB Aggregation Pipelines** for real-time analytics
- Category-wise expense breakdown
- Monthly spending trends
- Top spenders in group
- Daily spending breakdown
- Dashboard widgets for quick overview

### 🔔 Real-Time Updates & Notifications
- **Socket.io WebSocket** for instant expense updates
- Real-time sync when group members add/edit/delete expenses
- In-app notifications with unread badge
- Automatic UI refresh without page reload

### 📤 Export Reports
- 📄 Export to PDF: Full group expense report
- 📊 Export to CSV: All group data as spreadsheet

### ⚡ Performance Optimizations
- **Gzip Compression**: ~70% reduction in response size
- **Code Splitting**: React.lazy() for route-based chunking
- **Service Worker Caching**: PWA with offline support
- Lazy loaded routes & optimized bundle

### 🎨 UI/UX Enhancements
- Material UI theming (dark/light toggle)
- **PWA installable** on mobile & desktop
- Custom icons & smooth animations
- Empty-state illustrations for cleaner UI

---

## 🧮 Algorithm Details

### Hybrid Debt Settlement Algorithm

The settlement algorithm uses a **two-step hybrid approach** to minimize transactions:

```
┌─────────────────────────────────────────────────────────────┐
│  Input: { Alice: +50, Bob: -30, Charlie: -20, Dave: +30 }   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Hash-based Exact Match [O(N)]                      │
│  ─────────────────────────────────────────                  │
│  • Build Map of {amount → person}                           │
│  • Find pairs: Bob(-30) ↔ Dave(+30) ✓ Exact match!          │
│  • Settlement: Bob pays Dave $30                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Sorted Two-Pointer [O(N log N)]                    │
│  ────────────────────────────────────────                   │
│  • Remaining: Alice(+50), Charlie(-20)                      │
│  • Sort creditors & debtors                                 │
│  • Match using two pointers                                 │
│  • Settlement: Charlie pays Alice $20                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Output: [ [Bob, Dave, 30], [Charlie, Alice, 20] ]          │
│  Total Complexity: O(N log N)                               │
└─────────────────────────────────────────────────────────────┘
```

| Step | Complexity | Technique |
|------|------------|-----------|
| Exact Match | O(N) | Hash Map lookup |
| Sorting | O(N log N) | JavaScript TimSort |
| Two-Pointer | O(N) | Greedy matching |
| **Total** | **O(N log N)** | Hybrid approach |

---

## 🛠️ Tech Stack

### Frontend
- React.js (with React Router)
- Material UI & Emotion
- **Socket.io-client** for real-time WebSocket
- Axios, Formik, Yup
- Chart.js via react-chartjs-2
- Iconify & Simplebar
- Gravatar, React Context API
- **Service Worker** for PWA

### Backend
- Node.js + Express.js
- **Socket.io** for real-time WebSocket communication
- MongoDB Atlas via Mongoose
- **MongoDB Aggregation Pipelines** for analytics
- JWT authentication with **Refresh Token Rotation**
- bcryptjs for password encryption
- **Gzip Compression** via compression middleware
- Nodemailer (Gmail SMTP)
- node-cron for scheduling
- Winston for structured logging

### DevOps & Deployment
- Environment config via dotenv
- MongoDB Atlas cloud database
- Concurrently for dev scripts
- **PWA optimized** with Service Worker caching

---

## 📡 API Endpoints

### Analytics (New)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/category-breakdown` | POST | Expenses by category |
| `/api/analytics/monthly-trends` | POST | Monthly spending trends |
| `/api/analytics/user-summary` | POST | User spending summary |
| `/api/analytics/top-spenders` | POST | Top spenders in group |
| `/api/analytics/daily-breakdown` | POST | Daily spending |

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/v1/login` | POST | Login (returns access + refresh tokens) |
| `/api/users/v1/refresh` | POST | Refresh access token |
| `/api/users/v1/logout` | POST | Invalidate refresh token |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
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

3. Create `.env` in the root directory
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret  # Optional
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

4. Start the application
```bash
npm run dev
```

- Client runs on `http://localhost:3000`
- Server runs on `http://localhost:3001`

---

## 📸 Screenshots

### Dashboard
![Dashboard](Screenshots/dashboard.png)

### Group View with Export Icons
![Group View](Screenshots/group-view.png)

### Analytics Page
![Analytics](Screenshots/analytics.png)

### Dark Mode Toggle
![Dark Mode](Screenshots/dark-mode.png)

### Add Expense Dialog
![Add Expense](Screenshots/add-expense.png)

---

## 👨‍💻 Developer

**Ashish Goyal**  
Full Stack Developer | MERN Enthusiast

- 🔗 GitHub: [@ashish-goyal-1](https://github.com/ashish-goyal-1)
- 💼 LinkedIn: [Ashish Goyal](https://www.linkedin.com/in/ashish-goyal-66422b257/)
- 📧 Email: goyalashish809@gmail.com
