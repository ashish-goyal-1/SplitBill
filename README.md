# 💰 SplitBill

A powerful full-stack MERN app for smart group expense tracking, optimized debt settlement, recurring expenses, exportable reports, real-time notifications, and insightful analytics.

[![GitHub](https://img.shields.io/badge/GitHub-ashish--goyal--1-blue?logo=github)](https://github.com/ashish-goyal-1/SplitBill)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ashish%20Goyal-blue?logo=linkedin)](https://www.linkedin.com/in/ashish-goyal-66422b257/)

---

## ✨ Features

### 🔐 Authentication & User Management
- Secure login & registration with JWT
- Encrypted passwords (bcryptjs)
- Profile view/edit with Gravatar support
- Password update flow with verification

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
- Greedy transaction minimization algorithm
- Balance view (who owes whom)
- Record settlements and payment methods

### 📧 Email System
- Manual nudges for unsettled balances
- Daily automatic reminders via node-cron
- Settlement confirmation notifications

### 📊 Analytics & Dashboard
- Monthly and daily spend visualizations
- Pie chart breakdown by category
- Dashboard widgets for quick overview

### 🔔 Notifications
- Real-time in-app notifications for updates
- Unread badge and notification drawer
- Auto-refresh every 30 seconds

### 📤 Export Reports
- 📄 Export to PDF: Full group expense report
- 📊 Export to CSV: All group data as spreadsheet

### 🎨 UI/UX Enhancements
- Material UI theming (dark/light toggle)
- PWA installable on mobile
- Lazy loaded routes & custom icons
- Empty-state illustrations for cleaner UI

---

## 🛠️ Tech Stack

### Frontend
- React.js (with React Router)
- Material UI & Emotion
- Axios, Formik, Yup
- Chart.js via react-chartjs-2
- Iconify & Simplebar
- Gravatar, React Context API

### Backend
- Node.js + Express.js
- MongoDB Atlas via Mongoose
- JWT authentication
- bcryptjs for password encryption
- Nodemailer (Gmail SMTP)
- node-cron for scheduling
- Winston for structured logging

### DevOps & Deployment
- Environment config via dotenv
- MongoDB Atlas cloud database
- Concurrently for dev scripts
- PWA optimized frontend

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
