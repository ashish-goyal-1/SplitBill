# 💰 SplitBill

A powerful real-time full-stack MERN app for smart group expense tracking, optimized debt settlement, activity audit trails, searchable expenses, exportable reports, instant WebSocket sync, and insightful analytics.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-SplitBill-success?style=for-the-badge)](https://splitbill-7p1s.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-ashish--goyal--1-blue?logo=github)](https://github.com/ashish-goyal-1/SplitBill)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ashish%20Goyal-blue?logo=linkedin)](https://www.linkedin.com/in/ashish-goyal-66422b257/)

> 🌐 **Live Demo**: [https://splitbill-7p1s.onrender.com](https://splitbill-7p1s.onrender.com)

---

## 📑 Table of Contents

- [Screenshots](#-screenshots)
- [Features](#-features)
- [Algorithm Details](#-algorithm-details)
- [Tech Stack](#-tech-stack)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [Developer](#-developer)

---

## 📸 Screenshots

### Dashboard
| Light Mode | Dark Mode |
|------------|----------|
| ![Dashboard Light](Screenshots/Dashboard%20(Light).png) | ![Dashboard Dark](Screenshots/Dashboard%20(Dark).png) |

### Analytics & Group Views
| Analytics Overview | Expense List |
|-------------------|---------------|
| ![Analytics](Screenshots/Dashboard-%20Analytics.png) | ![Group Expenses](Screenshots/Group%20View%20-%20Expenses.png) |

| Balance & Settlements | Notifications |
|----------------------|---------------|
| ![Balance 1](Screenshots/Group%20View%20-%20Balance%20-1.png) | ![Notifications](Screenshots/Notifications%20popover.png) |

### Add Expense
![Add Expense Modal](Screenshots/Add%20Expense%20Modal.png)


## ✨ Features

### 🔐 Authentication & Security
- Secure login & registration with **JWT dual-token system**
- **Access Token** (15 min) + **Refresh Token** (7 days) with rotation
- Encrypted passwords (bcryptjs)
- **Email verification** on registration with token-based flow
- **Password reset** via secure email links (15 min expiry)
- Profile view/edit with Gravatar support

### 👥 Group Management
- Create/edit/delete groups with category tags (Trip, Home, Couple, etc.)
- **Privacy-Focused Member Search**: Search by email only (strangers can't be found by name)
- **Pending Invite System**: Strangers must accept invite; recent contacts are added directly
- **Non-User Invites**: Send email invitations to people not yet on SplitBill
- **Share Group**: Copy invite link to clipboard with one click
- Multiple currencies supported (INR, USD, EUR, GBP, etc.)
- **Activity Feed (Audit Trail)**: Complete history of group actions with timestamps

### 💸 Expense Tracking
- Add/edit/delete group expenses with categories
- **Global Quick Add**: Floating Action Button (FAB) for one-click expense creation from dashboard
- **Three Split Types:**
  - ⚖️ **Equal Split**: Auto-divide equally among members
  - 💵 **Exact Amount**: Specify precise amounts per person
  - 📊 **Percentage Split**: Define percentages (e.g., 50%, 30%, 20%)
- **Recurring Expenses**: daily/weekly/monthly/yearly automation
- **Search & Filter**: Instant search by name, filter by category or payer

### 💰 Settlements & Smart Splitting
- **Hybrid O(N log N) Algorithm** for optimal debt simplification:
  - Step 1: O(N) Hash-based exact match heuristic
  - Step 2: O(N log N) Sorted two-pointer greedy
- Minimizes number of transactions between group members
- **Multi-Currency Balance Cards**: Debts aggregated by currency (no mixing ₹ + $)
- Balance view showing who owes whom
- Record settlements with payment method tracking

### 📧 Email & Notifications
- **Real-time in-app notifications** with unread badge
- Manual nudges for unsettled balances
- Daily automatic reminders via node-cron
- Settlement confirmation emails

### 📊 Analytics & Dashboard
- **Action-First Dashboard** with 3-zone layout:
  - Status zone: Greeting + Multi-currency balance cards
  - Navigation zone: Compact group cards + Recent transactions
  - Analytics zone: All charts consolidated
- **MongoDB Aggregation Pipelines** for real-time analytics
- Category-wise expense breakdown (Pie chart)
- Groupwise spending distribution
- Monthly spending trends (Bar chart)

### 🔔 Real-Time Sync (Socket.io)
- **WebSocket-powered** instant expense updates
- Live sync when group members add/edit/delete expenses
- Automatic UI refresh without page reload
- Real-time notification delivery

### 📤 Export Reports
- 📄 **Export to PDF**: Full group expense report
- 📊 **Export to CSV**: All group data as spreadsheet

### ⚡ Performance & PWA
- **Gzip Compression**: ~70% reduction in response size
- **Code Splitting**: React.lazy() for route-based chunking
- **Service Worker Caching**: PWA with offline support
- Lazy loaded routes & optimized bundle
- **Installable** on mobile & desktop

### 🎨 UI/UX
- Material UI with **dark/light mode** toggle
- Custom icons & smooth animations
- Empty-state illustrations
- Responsive design for all screen sizes

### 🧪 Testing
- **Jest Unit Tests** for algorithm validation
- 20+ test cases covering correctness, edge cases, and performance benchmarks
- Run tests: `npm test`

---

## 🧮 Algorithm Details

### Hybrid Debt Settlement Algorithm

The settlement algorithm uses a **two-step hybrid approach** to minimize transactions:

```
┌─────────────────────────────────────────────────────────────┐
│  Input: { Priya: +50, Rahul: -30, Amit: -20, Neha: +30 }    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Hash-based Exact Match [O(N)]                      │
│  ─────────────────────────────────────────                  │
│  • Build Map of {amount → person}                           │
│  • Find pairs: Rahul(-30) ↔ Neha(+30) ✓ Exact match!        │
│  • Settlement: Rahul pays Neha ₹30                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Sorted Two-Pointer [O(N log N)]                    │
│  ────────────────────────────────────────                   │
│  • Remaining: Priya(+50), Amit(-20)                         │
│  • Sort creditors & debtors                                 │
│  • Match using two pointers                                 │
│  • Settlement: Amit pays Priya ₹20                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Output: [ [Rahul, Neha, 30], [Amit, Priya, 20] ]           │
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

### 🔐 Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/v1/register` | POST | Register new user |
| `/api/users/v1/login` | POST | Login (returns access + refresh tokens) |
| `/api/users/v1/refresh` | POST | Refresh access token |
| `/api/users/v1/logout` | POST | Invalidate refresh token |
| `/api/users/v1/view` | POST | View user profile |
| `/api/users/v1/edit` | POST | Update user profile |
| `/api/users/v1/updatePassword` | POST | Change password |
| `/api/users/v1/delete` | DELETE | Delete user account |

### 👥 Groups
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/group/v1/add` | POST | Create new group |
| `/api/group/v1/view` | POST | View group details |
| `/api/group/v1/user` | POST | Get all groups for a user |
| `/api/group/v1/edit` | POST | Update group |
| `/api/group/v1/delete` | DELETE | Delete group |

### 💸 Expenses
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/expense/v1/add` | POST | Add expense (supports equal/exact/percentage split) |
| `/api/expense/v1/edit` | POST | Edit expense |
| `/api/expense/v1/delete` | DELETE | Delete expense |
| `/api/expense/v1/view` | POST | View single expense |
| `/api/expense/v1/group` | POST | Get all expenses for a group |
| `/api/expense/v1/user` | POST | Get all expenses for a user |
| `/api/expense/v1/user/recent` | POST | Get 5 most recent expenses |

### 💰 Settlements
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/group/v1/settlement` | POST | Calculate group balance sheet (who owes whom) |
| `/api/group/v1/makeSettlement` | POST | Record a settlement payment |
| `/api/group/v1/consolidate` | POST | Cross-group debt consolidation |
| `/api/group/v1/nudge` | POST | Send payment reminder email |
| `/api/group/v1/pendingInvites` | POST | Get user's pending group invitations |
| `/api/group/v1/acceptInvite` | POST | Accept a group invitation |
| `/api/group/v1/declineInvite` | POST | Decline a group invitation |
| `/api/group/v1/activity` | POST | Get activity logs for a group |

### 📊 Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/category-breakdown` | POST | Expenses by category |
| `/api/analytics/monthly-trends` | POST | Monthly spending trends |
| `/api/analytics/user-summary` | POST | User spending summary |
| `/api/analytics/top-spenders` | POST | Top spenders in group |
| `/api/analytics/daily-breakdown` | POST | Daily spending breakdown |

---

## 🔧 Environment Variables

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

## 📄 Architecture

For a detailed breakdown of the technical architecture, project structure, and data flow, please refer to the [architecture.md](./architecture.md) file.

---

## 👨‍💻 Developer

**Ashish Goyal**  
Full Stack Developer | MERN Enthusiast

- 🔗 GitHub: [@ashish-goyal-1](https://github.com/ashish-goyal-1)
- 💼 LinkedIn: [Ashish Goyal](https://www.linkedin.com/in/ashish-goyal-66422b257/)
