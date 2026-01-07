# 📚 SplitBill - Complete Technical Documentation

A comprehensive guide to understanding the SplitBill expense-sharing application without running it.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Core Features & Data Flows](#5-core-features--data-flows)
6. [Settlement Algorithm](#6-settlement-algorithm)
7. [Frontend Structure](#7-frontend-structure)
8. [API Reference](#8-api-reference)
9. [Real-Time Features](#9-real-time-features)
10. [Advanced Features](#10-advanced-features)

---

## 1. Project Overview

### What is SplitBill?

SplitBill is a **full-stack MERN application** for tracking shared expenses among groups of people (roommates, trips, events) and calculating optimal settlements to minimize the number of transactions needed.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js, Material UI, Formik, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (Access + Refresh tokens) |
| **Real-time** | Socket.io WebSockets |
| **Email** | Nodemailer (Gmail SMTP) |
| **Scheduling** | node-cron |

### File Structure

```
SplitBill/
├── app.js                 # Express server entry point
├── package.json           # Dependencies
├── .env                   # Environment variables
│
├── model/
│   └── schema.js          # MongoDB schemas (User, Group, Expense, Settlement, Notification)
│
├── routes/
│   ├── userRouter.js      # Auth & user endpoints
│   ├── groupRouter.js     # Group & settlement endpoints
│   ├── expenseRouter.js   # Expense endpoints
│   └── analyticsRouter.js # Analytics endpoints
│
├── components/            # Business logic controllers
│   ├── user.js            # User registration, login, profile
│   ├── group.js           # Group CRUD, settlements
│   ├── expense.js         # Expense CRUD, split calculations
│   └── notification.js    # In-app notification service
│
├── helper/
│   ├── split.js           # Debt settlement algorithm
│   ├── apiAuthentication.js # JWT middleware
│   ├── validation.js      # Input validation
│   ├── logger.js          # Winston logging
│   └── socketHelper.js    # Socket.io event emitters
│
└── client/                # React frontend
    └── src/
        ├── components/    # UI components
        ├── services/      # API call functions
        ├── api/           # Axios configuration
        └── theme/         # Material UI theming
```

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Login/    │  │   Groups    │  │  Expenses   │  │  Dashboard  │ │
│  │  Register   │  │   CRUD      │  │    CRUD     │  │  Analytics  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │               │               │                │          │
│         └───────────────┴───────────────┴────────────────┘          │
│                                │                                     │
│                    ┌───────────┴───────────┐                        │
│                    │   Axios HTTP Client   │                        │
│                    │   Socket.io Client    │                        │
│                    └───────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ════════════╪═══════════════ (HTTP/WebSocket)
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Express)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    API Routes Layer                          │   │
│  │   /api/users/*  │  /api/group/*  │  /api/expense/*          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                JWT Authentication Middleware                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Business Logic Controllers                  │   │
│  │   user.js  │  group.js  │  expense.js  │  notification.js   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Helper Modules                          │   │
│  │   split.js (Algorithm)  │  validation.js  │  socketHelper   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ════════════╪═══════════════ (Mongoose)
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  users   │  │  groups  │  │ expenses │  │settlements│ │notifs  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 User Collection

Stores registered users and their preferences.

```javascript
{
    _id: ObjectId,
    firstName: String (required),
    lastName: String,
    emailId: String (required, unique),    // Primary identifier
    password: String (bcrypt hashed),
    refreshToken: String,                   // For token rotation
    paymentMethods: [{
        type: String,          // "UPI", "Bank", "PayPal"
        details: String,       // "user@upi", account number
        isDefault: Boolean
    }],
    defaultCurrency: String    // "INR", "USD", "EUR"
}
```

### 3.2 Group Collection

Stores expense groups and member balances.

```javascript
{
    _id: ObjectId,
    groupName: String (required),
    groupDescription: String,
    groupCurrency: String,                  // "INR", "USD", etc.
    groupOwner: String,                     // Email of creator
    groupMembers: [String],                 // Array of confirmed member emails
    pendingMembers: [String],               // Array of pending invite emails
    groupCategory: String,                  // "Trip", "Home", "Couple"
    groupTotal: Number,                     // Sum of all expenses
    split: [{                               // Balance tracking
        "alice@email.com": 50,              // Positive = owed money
        "bob@email.com": -30,               // Negative = owes money
        "charlie@email.com": -20
    }]
}
```

**Key Insight:** The `split` array maintains real-time balances. When expenses are added/edited/deleted, balances are updated atomically.

### 3.3 Expense Collection

Individual expense records with split information.

```javascript
{
    _id: ObjectId,
    groupId: String (required),             // Reference to group
    expenseName: String (required),
    expenseDescription: String,
    expenseAmount: Number (required),       // Total amount
    expenseCategory: String,                // "Food", "Transport", etc.
    expenseCurrency: String,
    expenseDate: Date,
    expenseOwner: String,                   // Who paid (email)
    expenseMembers: [String],               // Who owes (emails)
    expensePerMember: Number,               // For equal splits
    expenseType: String,                    // "Cash", "Card", "UPI"
    
    // Split type configuration
    splitType: String,                      // "equal", "exact", "percentage"
    splitDetails: [{                        // Per-member amounts
        email: String,
        amount: Number,                     // Calculated owed amount
        percentage: Number                  // For percentage splits
    }],
    
    // Recurring expense support
    isRecurring: Boolean,
    recurrenceFrequency: String,            // "daily", "weekly", "monthly"
    nextRecurrenceDate: Date,
    parentExpenseId: String                 // Links recurring expenses
}
```

### 3.4 Settlement Collection

Records of completed settlements between members.

```javascript
{
    _id: ObjectId,
    groupId: String,
    settleTo: String,          // Creditor email (receiving money)
    settleFrom: String,        // Debtor email (paying money)
    settleDate: String,
    settleAmount: Number,
    paymentMethod: String,     // "Cash", "UPI", "Bank Transfer"
    currency: String
}
```

### 3.5 Notification Collection

In-app notifications for real-time updates.

```javascript
{
    _id: ObjectId,
    userId: String,            // Recipient email
    type: String,              // "expense_added", "settlement", "nudge", "group_invite", "invite_accepted", "invite_declined"
    title: String,
    message: String,
    groupId: String,
    groupName: String,
    isRead: Boolean,
    createdAt: Date,
    metadata: Object           // Additional data (expenseId, amount, etc.)
}
```

### 3.6 ActivityLog Collection

Audit trail for all group actions.

```javascript
{
    _id: ObjectId,
    groupId: ObjectId,          // Reference to group (indexed)
    action: String,             // "EXPENSE_ADDED", "EXPENSE_UPDATED", "EXPENSE_DELETED",
                               // "SETTLEMENT_MADE", "MEMBER_JOINED", "GROUP_CREATED"
    description: String,        // Human-readable: "Ashish added 'Dinner' for ₹500"
    performedBy: String,        // Email of actor
    metadata: Object,           // Additional context (expenseId, amount, etc.)
    timestamp: Date (indexed)   // When action occurred
}
```

---

## 4. Authentication System

### JWT Dual-Token System

```
┌──────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                │
└──────────────────────────────────────────────────────────────────┘
                                │
User submits email + password   │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. Validate credentials (bcrypt.compare)                        │
│  2. Generate Access Token (15 min expiry)                        │
│  3. Generate Refresh Token (7 days expiry)                       │
│  4. Store Refresh Token in DB (user.refreshToken)                │
│  5. Return both tokens to client                                 │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Client stores:                                                  │
│  - Access Token → localStorage (for API calls)                   │
│  - Refresh Token → localStorage (for token refresh)              │
└──────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                     TOKEN REFRESH FLOW                            │
└──────────────────────────────────────────────────────────────────┘
                                │
Access token expires (401)      │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. Client sends refresh token to /api/users/v1/refresh          │
│  2. Server validates: token valid + matches DB                   │
│  3. Server generates NEW access token + NEW refresh token        │
│  4. Old refresh token invalidated (rotation)                     │
│  5. Return new tokens                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Why Token Rotation?

- If refresh token is stolen, attacker can only use it ONCE
- Legitimate user's next refresh will fail → detected breach
- More secure than static refresh tokens

---

## 5. Core Features & Data Flows

### 5.1 Group Creation Flow

```
User Action                     Frontend                        Backend                         Database
───────────────────────────────────────────────────────────────────────────────────────────────────────────

Fill form with:                 ┌─────────────┐
- groupName                     │ createGroup │
- groupCurrency                 │   .jsx      │
- groupCategory                 └──────┬──────┘
- groupMembers[]                       │
                                       ▼
                               POST /api/group/v1/add
                               {groupName, groupMembers, ...}
                                       │
                                       ▼
                               ┌───────────────┐
                               │   group.js    │
                               │ createGroup() │
                               └───────┬───────┘
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                          ▼            ▼            ▼
                    Validate     Validate      Initialize
                    groupName    each member   split = {
                    not empty    exists in DB    member1: 0,
                                                 member2: 0
                                               }
                                       │
                                       ▼
                               Group.create(newGroup)
                                       │
                                       ▼
                               ┌───────────────────┐
                               │  groups collection │
                               └───────────────────┘
```

### 5.2 Add Expense Flow (with Split Types)

```
User Action                     Processing                              Result
─────────────────────────────────────────────────────────────────────────────────

1. User fills expense form
   - expenseName: "Dinner"
   - expenseAmount: 300
   - expenseOwner: "alice@email.com"
   - expenseMembers: ["alice", "bob", "charlie"]
   - splitType: "equal" | "exact" | "percentage"
       │
       ▼
2. SPLIT TYPE HANDLING:

   ┌─────────────────────────────────────────────────────────────────────┐
   │ IF splitType === "equal":                                          │
   │   perMember = 300 / 3 = 100                                        │
   │   splitDetails = [                                                 │
   │     {email: "alice", amount: 100},                                 │
   │     {email: "bob", amount: 100},                                   │
   │     {email: "charlie", amount: 100}                                │
   │   ]                                                                │
   └─────────────────────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────────────────────┐
   │ IF splitType === "exact":                                          │
   │   User provides: alice=150, bob=100, charlie=50                    │
   │   Validate: 150 + 100 + 50 === 300 ✓                              │
   │   splitDetails = [                                                 │
   │     {email: "alice", amount: 150},                                 │
   │     {email: "bob", amount: 100},                                   │
   │     {email: "charlie", amount: 50}                                 │
   │   ]                                                                │
   └─────────────────────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────────────────────┐
   │ IF splitType === "percentage":                                     │
   │   User provides: alice=50%, bob=30%, charlie=20%                   │
   │   Validate: 50 + 30 + 20 === 100% ✓                               │
   │   Calculate amounts:                                               │
   │     alice = 300 × 0.50 = 150                                       │
   │     bob = 300 × 0.30 = 90                                          │
   │     charlie = 300 × 0.20 = 60                                      │
   │   splitDetails = [                                                 │
   │     {email: "alice", amount: 150, percentage: 50},                 │
   │     {email: "bob", amount: 90, percentage: 30},                    │
   │     {email: "charlie", amount: 60, percentage: 20}                 │
   │   ]                                                                │
   └─────────────────────────────────────────────────────────────────────┘
       │
       ▼
3. UPDATE GROUP BALANCES (addSplit function):

   Before: split = {alice: 0, bob: 0, charlie: 0}
   
   Step 1: Credit payer (alice paid 300)
           alice: 0 + 300 = +300
   
   Step 2: Debit each member by their splitDetails.amount
           alice: +300 - 150 = +150  (owed 150)
           bob: 0 - 90 = -90         (owes 90)
           charlie: 0 - 60 = -60     (owes 60)
   
   After: split = {alice: +150, bob: -90, charlie: -60}
       │
       ▼
4. SAVE TO DATABASE:
   - Create expense document
   - Update group.split balances
   - Emit Socket.io event to group members
   - Create notifications for group members
```

### 5.3 Settlement Calculation Flow

```
User clicks "View Settlements"
              │
              ▼
POST /api/group/v1/settlement
{id: groupId}
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Fetch group.split balances:                                        │
│  {alice: +150, bob: -90, charlie: -60}                              │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Call simplifyDebts(split) algorithm                                │
│  (Detailed in Section 6)                                            │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Result: Optimal settlements                                        │
│  [                                                                  │
│    ["bob@email.com", "alice@email.com", 90],                        │
│    ["charlie@email.com", "alice@email.com", 60]                     │
│  ]                                                                  │
│  Meaning: Bob pays Alice ₹90, Charlie pays Alice ₹60               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Settlement Algorithm

### The Problem

Given balances like:
```
Alice: +500 (is owed ₹500)
Bob: -200 (owes ₹200)
Charlie: -150 (owes ₹150)
David: +100 (is owed ₹100)
Eve: -250 (owes ₹250)
```

Find minimum number of transactions to settle all debts.

### Hybrid O(N log N) Algorithm

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: EXACT MATCH (O(N)) - Hash-based optimization               │
│  ────────────────────────────────────────────────────────────────   │
│                                                                     │
│  Build a Map: {amount → person index}                               │
│                                                                     │
│  For each person:                                                   │
│    Check if opposite amount exists in Map                           │
│    If Bob owes -200 and David is owed +200 → PERFECT MATCH!         │
│    Settlement: Bob pays David ₹200                                  │
│                                                                     │
│  Why? Socially cleaner (1 person fully settles with 1 person)       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: SORTED TWO-POINTER (O(N log N)) - Remaining balances       │
│  ────────────────────────────────────────────────────────────────   │
│                                                                     │
│  Remaining after Step 1:                                            │
│  Creditors: [Alice: +500, ...]                                      │
│  Debtors: [Eve: -250, Charlie: -150, ...]                           │
│                                                                     │
│  Sort both by amount (descending)                                   │
│  Use two pointers to match largest creditor with largest debtor     │
│                                                                     │
│  Pointer i → Creditors                                              │
│  Pointer j → Debtors                                                │
│                                                                     │
│  Match minimum of (credit, debt)                                    │
│  Move pointer when balance reaches 0                                │
└─────────────────────────────────────────────────────────────────────┘


EXAMPLE WALKTHROUGH:
────────────────────
Input: {Alice: +500, Bob: -200, Charlie: -150, David: +100, Eve: -250}

Step 1: Exact Match
  - Check Bob (-200): Is there +200? No
  - Check David (+100): Is there -100? No
  - No exact matches found

Step 2: Sorted Greedy
  Creditors (sorted): [Alice: +500, David: +100]
  Debtors (sorted): [Eve: 250, Bob: 200, Charlie: 150]
  
  Round 1: i=0 (Alice +500), j=0 (Eve -250)
    Settle: min(500, 250) = 250
    Eve pays Alice ₹250
    Alice: +500 - 250 = +250 remaining
    Eve: settled, j++
    
  Round 2: i=0 (Alice +250), j=1 (Bob -200)
    Settle: min(250, 200) = 200
    Bob pays Alice ₹200
    Alice: +250 - 200 = +50 remaining
    Bob: settled, j++
    
  Round 3: i=0 (Alice +50), j=2 (Charlie -150)
    Settle: min(50, 150) = 50
    Charlie pays Alice ₹50
    Alice: settled, i++
    Charlie: -150 + 50 = -100 remaining
    
  Round 4: i=1 (David +100), j=2 (Charlie -100)
    Settle: min(100, 100) = 100
    Charlie pays David ₹100
    Both settled

Output: [
  [Eve, Alice, 250],
  [Bob, Alice, 200],
  [Charlie, Alice, 50],
  [Charlie, David, 100]
]

Total: 4 transactions (optimal!)
```

### Floating-Point Handling

```javascript
const TOLERANCE = 0.01;  // ₹0.01 tolerance

function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isZero(value) {
    return Math.abs(value) < TOLERANCE;
}
```

This prevents issues like `33.33% + 33.33% + 33.33% = 99.99%` causing validation failures.

---

## 7. Frontend Structure

### Component Hierarchy

```
<App>
├── <ThemeProvider>              # Material UI theming (light/dark)
│   ├── <Router>
│   │   ├── PUBLIC ROUTES (no auth required)
│   │   │   ├── /login      → <LoginPage>
│   │   │   ├── /register   → <RegisterPage>
│   │   │   └── /about      → <AboutPage>
│   │   │
│   │   └── PROTECTED ROUTES (JWT required)
│   │       ├── <DashboardLayout>    # Sidebar + Header wrapper
│   │       │   ├── /dashboard           → <DashboardPage>
│   │       │   ├── /groups              → <GroupList>
│   │       │   ├── /group/:groupId      → <ViewGroup>
│   │       │   ├── /create-group        → <CreateGroup>
│   │       │   ├── /edit-group/:id      → <EditGroup>
│   │       │   ├── /add-expense/:groupId → <AddExpense>
│   │       │   ├── /edit-expense/:id    → <EditExpense>
│   │       │   ├── /view-expense/:id    → <ViewExpense>
│   │       │   └── /profile             → <ProfilePage>
```

### Key Component Details

#### AddExpense.jsx
- Uses Formik for form state management
- Uses Yup for validation schema
- Split Type dropdown (Equal/Exact/Percentage)
- Dynamic per-member input fields for non-equal splits
- Real-time validation feedback (green check / red warning)

#### ViewGroup/index.jsx
- Three tabs: Group Expenses | Group Balance | My Balance
- ExpenseCard components for each expense
- GroupSettlements component for balance sheet
- Chart.js graphs for category/monthly breakdowns
- Export buttons (PDF/CSV)

### State Management

- **Local State**: useState for component-specific state
- **Form State**: Formik for complex forms
- **Auth State**: localStorage for tokens + profile
- **Real-time**: Socket.io listeners update local state

---

## 8. API Reference

### Authentication Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/users/v1/register` | `{firstName, lastName, emailId, password}` | `{status, userId}` |
| POST | `/api/users/v1/login` | `{emailId, password}` | `{accessToken, refreshToken, user}` |
| POST | `/api/users/v1/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/api/users/v1/logout` | - | `{status}` |

### Group Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/group/v1/add` | `{groupName, groupMembers, groupCurrency, ...}` | `{Id}` |
| POST | `/api/group/v1/view` | `{id}` | `{group}` |
| POST | `/api/group/v1/user` | `{user}` | `{groups[]}` |
| POST | `/api/group/v1/edit` | `{id, groupName, ...}` | `{status}` |
| DELETE | `/api/group/v1/delete` | `{id}` | `{status}` |
| POST | `/api/group/v1/settlement` | `{id}` | `{settlements[]}` |
| POST | `/api/group/v1/makeSettlement` | `{groupId, settleTo, settleFrom, settleAmount}` | `{status}` |
| POST | `/api/group/v1/pendingInvites` | `{email}` | `{pendingInvites[]}` |
| POST | `/api/group/v1/acceptInvite` | `{groupId}` | `{status, groupId}` |
| POST | `/api/group/v1/declineInvite` | `{groupId}` | `{status}` |
| POST | `/api/group/v1/activity` | `{groupId, limit?}` | `{activities[]}` |

### Expense Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/expense/v1/add` | `{groupId, expenseName, expenseAmount, splitType, splitDetails, ...}` | `{Id}` |
| POST | `/api/expense/v1/edit` | `{id, ...updates}` | `{status}` |
| DELETE | `/api/expense/v1/delete` | `{id}` | `{status}` |
| POST | `/api/expense/v1/group` | `{id}` | `{expenses[], total}` |

---

## 9. Real-Time Features

### Socket.io Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                                  │
│                                                                     │
│  // When expense is added:                                          │
│  socketHelper.emitExpenseAdded(groupId, expense, addedBy)           │
│                                                                     │
│  // Emits to all sockets in room 'group_{groupId}':                 │
│  io.to(`group_${groupId}`).emit('expense_added', {                  │
│    expense: expenseData,                                            │
│    addedBy: userEmail                                               │
│  })                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                                  │
│                                                                     │
│  // Join room when viewing group                                    │
│  socket.emit('join_group', groupId)                                 │
│                                                                     │
│  // Listen for updates                                              │
│  socket.on('expense_added', (data) => {                             │
│    setExpenses(prev => [data.expense, ...prev])                     │
│    showNotification(`${data.addedBy} added expense`)                │
│  })                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Events Emitted

| Event | Trigger | Data |
|-------|---------|------|
| `expense_added` | New expense created | `{expense, addedBy}` |
| `expense_updated` | Expense edited | `{expense, updatedBy}` |
| `expense_deleted` | Expense deleted | `{expenseId, deletedBy}` |
| `settlement_made` | Settlement recorded | `{settlement}` |

---

## 10. Advanced Features

### 10.1 Recurring Expenses

When `isRecurring: true`:
- node-cron job runs daily
- Checks for expenses where `nextRecurrenceDate <= today`
- Creates new expense copy
- Updates `nextRecurrenceDate` based on `recurrenceFrequency`

### 10.2 Pending Invite System

Privacy-focused member invitation with accept/decline flow:

```
User adds member email
         │
         ├── Is Recent Contact? ──Yes──► Add to groupMembers directly
         │      (from shared groups)
         │
         └── No (Stranger) ──────────► Add to pendingMembers
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                              In-App Notif         Email Sent
                              (group_invite)       "Action Required"
                                    │
                                    ▼
                          User sees on Dashboard
                          "Pending Group Invitations"
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                      [Accept]           [Decline]
                          │                   │
                          ▼                   ▼
                  Move to groupMembers   Remove from pending
                  Initialize split=0     Notify owner
```

**Visual Distinction in UI:**
- Recent Contacts: Blue avatar, "+ Add" button
- Strangers: Orange avatar, "+ Invite" button, "Will receive invite" text

### 10.3 Email Notifications

**Email Types:**
| Type | Trigger | Template |
|------|---------|----------|
| Nudge Reminder | User clicks "Nudge" | Payment reminder to debtor |
| Daily Reminder | Cron job (9 AM) | Auto-reminder for pending balances |
| Settlement Confirmation | Settlement made | Confirmation to both parties |
| Group Invite (Non-user) | Invite non-registered email | Sign-up link + invitation |
| Pending Invite (User) | Invite registered stranger | Login link + accept/decline |

**Daily Cron:**
- Runs every day at 9 AM
- Finds users with negative balances (owes money)
- Sends reminder emails automatically

### 10.4 Analytics (MongoDB Aggregation)

```javascript
// Category-wise expense breakdown
Expense.aggregate([
    { $match: { groupId: groupId } },
    { $group: {
        _id: "$expenseCategory",
        totalAmount: { $sum: "$expenseAmount" },
        count: { $sum: 1 }
    }},
    { $sort: { totalAmount: -1 } }
])

// Monthly trends
Expense.aggregate([
    { $match: { groupId: groupId } },
    { $group: {
        _id: {
            year: { $year: "$expenseDate" },
            month: { $month: "$expenseDate" }
        },
        total: { $sum: "$expenseAmount" }
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } }
])
```

### 10.5 Export Features

**PDF Export:**
- Uses jspdf library
- Generates formatted report with:
  - Group details
  - All expenses table
  - Category breakdown
  - Member balances

**CSV Export:**
- Simple comma-separated format
- All expense records with fields:
  - Date, Name, Amount, Paid By, Split Among, Category

### 10.6 PWA (Progressive Web App)

- Service Worker caches static assets
- Manifest.json for "Add to Home Screen"
- Works offline for cached pages
- Push notifications (if enabled)

---

## Summary

SplitBill is a production-ready expense-sharing application featuring:

1. **Secure Authentication** - JWT dual-token with rotation + email verification
2. **Flexible Splitting** - Equal, exact amount, or percentage
3. **Smart Settlements** - O(N log N) algorithm minimizes transactions
4. **Real-time Updates** - Socket.io for instant sync
5. **Rich Analytics** - MongoDB aggregation pipelines
6. **Email System** - Manual nudges + automated reminders + password reset
7. **Privacy-Focused Invites** - Pending invite system with accept/decline
8. **Export Options** - PDF and CSV reports
9. **Modern UI** - Material UI with dark mode
10. **Activity Feed** - Complete audit trail of all group actions
11. **Search & Filter** - Instant expense search and filtering
12. **Action-First Dashboard** - 3-zone layout with compact group cards
13. **Multi-Currency Balance Cards** - Smart grouping by currency (no mixing ₹ + $)
14. **Global Quick Add FAB** - One-click expense creation from dashboard
15. **Share Group** - One-click clipboard copy for invites

The codebase follows a clean separation of concerns with distinct layers for routing, business logic, data validation, and database operations.
