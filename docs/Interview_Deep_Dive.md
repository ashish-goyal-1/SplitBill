# 🎓 SplitBill - Complete Technical Deep Dive
## Interview Preparation Master Guide (Beginner-Friendly)

**Purpose:** This document explains EVERY major component of the SplitBill project in detail, as if teaching a beginner engineer. Study this thoroughly for your interview.

---

# 📚 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack Explained](#2-technology-stack-explained)
3. [Project Architecture](#3-project-architecture)
4. [Database Design (MongoDB)](#4-database-design-mongodb)
5. [Authentication System (JWT)](#5-authentication-system-jwt)
6. [Core Business Logic](#6-core-business-logic)
7. [Debt Simplification Algorithm](#7-debt-simplification-algorithm)
8. [Real-Time System (Socket.IO)](#8-real-time-system-socketio)
9. [Email Service](#9-email-service)
10. [Scheduling System (Cron Jobs)](#10-scheduling-system-cron-jobs)
11. [Analytics (MongoDB Aggregation)](#11-analytics-mongodb-aggregation)
12. [API Endpoints Reference](#12-api-endpoints-reference)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Security Features](#14-security-features)
15. [Common Interview Questions](#15-common-interview-questions)

---

# 1. PROJECT OVERVIEW

## What is SplitBill?

SplitBill is a **full-stack web application** for sharing expenses among groups of people. Think of it like Splitwise - when you go on a trip with friends or live with roommates, you need to track who paid for what and who owes whom.

## The Problem It Solves

**Without SplitBill:**
- Person A pays for dinner (₹1000)
- Person B pays for hotel (₹3000)
- Person C pays for taxi (₹500)
- Now everyone owes different amounts... to different people... it gets confusing!

**With SplitBill:**
- All expenses are tracked automatically
- The system calculates exactly who owes whom
- Minimizes the number of transactions needed to settle up

## Assignment Requirements (What They Asked For)

The company asked for:
```
✅ Create groups
✅ Add shared expenses
✅ Track balances
✅ Settle dues
✅ Support: Equal split, Exact amount split, Percentage split
✅ Show: How much you owe, How much others owe you
✅ Simplify balances (minimize transactions)
```

## What I Built (Extra Features)

Beyond the requirements, this project includes:
- Real-time updates via WebSocket
- Email notifications
- Activity audit trail
- Pending invite system
- Recurring expenses
- Analytics/Charts
- Dark mode
- PDF/CSV export
- PWA (installable on mobile)

---

# 2. TECHNOLOGY STACK EXPLAINED

## Frontend: React.js

**What is React?**
React is a JavaScript library for building user interfaces. Instead of writing HTML directly, you write "components" - reusable pieces of UI.

**Why React for this project?**
- **Component-based:** Each part of the UI (ExpenseCard, GroupList, BalanceChart) is a separate component
- **Virtual DOM:** React is fast because it only updates what changed
- **Huge ecosystem:** Lots of libraries available (Material-UI, Chart.js, etc.)

**Key React Concepts Used:**
```javascript
// 1. Components - Reusable UI pieces
function ExpenseCard({ expense }) {
    return <div>{expense.name} - ₹{expense.amount}</div>
}

// 2. Hooks - State management
const [expenses, setExpenses] = useState([]);

// 3. useEffect - Side effects (API calls)
useEffect(() => {
    fetchExpenses();
}, [groupId]);

// 4. Context - Global state
const { user } = useContext(AuthContext);
```

## Backend: Node.js + Express.js

**What is Node.js?**
Node.js lets you run JavaScript on the server (outside the browser). It's non-blocking, meaning it can handle many requests at once.

**What is Express.js?**
Express is a framework for Node.js that makes it easy to create web servers and APIs.

**Why Node.js for this project?**
- **JavaScript everywhere:** Same language on frontend and backend
- **Non-blocking I/O:** Great for real-time apps
- **npm ecosystem:** Thousands of packages available
- **Easy Socket.IO integration:** Perfect for real-time features

**Key Express Concepts Used:**
```javascript
// 1. Creating a server
const app = express();

// 2. Middleware - Functions that run before route handlers
app.use(express.json());  // Parse JSON bodies
app.use(cors());          // Allow cross-origin requests
app.use(compression());   // Gzip responses

// 3. Routes - URL endpoints
app.use('/api/users', usersRouter);
app.use('/api/expense', expenseRouter);

// 4. Middleware for authentication
app.use('/api/group', apiAuth.validateToken, groupRouter);
//                    ↑ This runs BEFORE the route
```

## Database: MongoDB

**What is MongoDB?**
MongoDB is a "NoSQL" database that stores data as JSON-like documents instead of tables with rows/columns.

**Why MongoDB for this project?**
- **Flexible schema:** Expenses can have different split types with varying fields
- **Document-oriented:** Perfect for expense data that varies in structure
- **Aggregation pipeline:** Great for analytics (category breakdown, monthly trends)
- **MongoDB Atlas:** Free cloud hosting

**Key MongoDB Concepts:**
```javascript
// 1. Document (like a row in SQL)
{
    _id: "507f1f77bcf86cd799439011",
    expenseName: "Dinner",
    expenseAmount: 1000,
    expenseMembers: ["a@email.com", "b@email.com"]
}

// 2. Collection (like a table in SQL)
// We have: users, groups, expenses, settlements, notifications, activitylogs

// 3. Mongoose (ODM - Object Document Mapper)
const Expense = mongoose.model('expense', ExpenseSchema);
await Expense.create(newExpense);  // Insert
await Expense.find({ groupId });   // Query
```

## Real-Time: Socket.IO

**What is Socket.IO?**
Socket.IO enables real-time, bidirectional communication between web clients and servers. Unlike HTTP (request → response), WebSocket keeps a connection open.

**Why Socket.IO for this project?**
- **Instant updates:** When Person A adds an expense, Person B sees it immediately
- **Room-based:** Each group is a "room" - messages only go to group members
- **Fallback support:** If WebSocket fails, it falls back to long-polling
- **Built-in reconnection:** Handles network issues gracefully

---

# 3. PROJECT ARCHITECTURE

## Directory Structure

```
SplitBill/
├── app.js                 # Main entry point - Express server setup
├── model/
│   └── schema.js          # Database schemas (User, Group, Expense, etc.)
├── routes/
│   ├── userRouter.js      # Authentication endpoints
│   ├── groupRouter.js     # Group management endpoints
│   ├── expenseRouter.js   # Expense CRUD endpoints
│   ├── analyticsRouter.js # Analytics endpoints
│   └── notificationRouter.js
├── components/
│   ├── user.js            # User business logic
│   ├── group.js           # Group business logic (settlements, invites)
│   ├── expense.js         # Expense business logic (split calculations)
│   └── notification.js    # Notification logic
├── helper/
│   ├── apiAuthentication.js # JWT token handling
│   ├── split.js           # Debt simplification algorithm
│   ├── socketHelper.js    # Real-time event emitters
│   ├── emailService.js    # SendGrid/Gmail email sending
│   ├── scheduler.js       # Cron jobs for reminders
│   ├── validation.js      # Input validation
│   ├── logger.js          # Winston logging
│   └── activityLogger.js  # Audit trail
└── client/                # React frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── services/      # API call functions
    │   ├── context/       # React Context providers
    │   └── theme/         # Material-UI theme
    └── public/            # Static assets
```

## Request Flow (How a Request Travels)

When a user adds an expense, here's what happens:

```
1. FRONTEND (React)
   User clicks "Add Expense" → Form submits
   ↓
   expenseService.addExpense(data) → Axios POST request

2. NETWORK
   POST /api/expense/v1/add
   Headers: { Authorization: "Bearer <JWT>" }
   Body: { groupId, expenseName, expenseAmount, ... }
   ↓

3. BACKEND (Express)
   app.js receives request
   ↓
   Middleware chain:
   - express.json() → Parses JSON body
   - cors() → Adds CORS headers
   - apiAuth.validateToken → Checks JWT, extracts user email
   ↓
   Route handler: expenseRouter.js
   ↓
   Business logic: expense.js addExpense()

4. DATABASE (MongoDB)
   - Validate input
   - Calculate split amounts
   - Save expense document
   - Update group.split balance
   ↓

5. REAL-TIME (Socket.IO)
   socketHelper.emitExpenseAdded(groupId, expense, addedBy)
   ↓
   All users in group room receive 'expense-added' event
   ↓

6. RESPONSE
   { status: "Success", message: "New expense added", Id: "..." }
   ↓

7. FRONTEND (React)
   Updates UI with new expense
   Other users' UIs update automatically via Socket.IO
```

---

# 4. DATABASE DESIGN (MongoDB)

## Schema Definitions

### User Schema
```javascript
const User = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    emailId: { type: String, required: true, unique: true },
    password: { type: String, required: true },  // Hashed with bcrypt
    
    // Dual Token Authentication
    refreshToken: { type: String, default: null },
    
    // Email Verification
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    
    // Password Reset
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
    
    // User Preferences
    paymentMethods: [{
        type: { type: String },      // UPI, Bank, PayPal
        details: { type: String },   // account number
        isDefault: { type: Boolean }
    }],
    defaultCurrency: { type: String, default: 'INR' }
});
```

**Why these fields?**
- `emailId` is unique because it's used for login
- `password` is hashed before storing (never store plain text!)
- `refreshToken` enables "remember me" functionality
- `isVerified` prevents unverified users from using the app
- `paymentMethods` lets users save their preferred payment options

### Group Schema
```javascript
const Group = new mongoose.Schema({
    groupName: { type: String, required: true },
    groupDescription: { type: String },
    groupCurrency: { type: String, default: "INR" },
    groupOwner: { type: String, required: true },  // Email of creator
    groupMembers: { type: Array, required: true }, // Emails of members
    pendingMembers: { type: Array, default: [] },  // Awaiting acceptance
    groupCategory: { type: String, default: "Others" },  // Trip, Home, etc.
    groupTotal: { type: Number, default: 0 },      // Total expenses
    split: { type: Array }  // Balance tracking object
});
```

**The `split` field is crucial!**
```javascript
// split stores each member's balance
{
    split: [{
        "priya@email.com": 500,   // Positive = owed money
        "rahul@email.com": -300,  // Negative = owes money
        "amit@email.com": -200
    }]
}
// Notice: 500 + (-300) + (-200) = 0 (always sums to zero!)
```

**Why `pendingMembers`?**
When you invite a stranger (someone you haven't been in a group with before), they must accept the invite. This prevents spam.

### Expense Schema
```javascript
const Expense = new mongoose.Schema({
    groupId: { type: String, required: true },
    expenseName: { type: String, required: true },
    expenseDescription: { type: String },
    expenseAmount: { type: Number, required: true },
    expenseCategory: { type: String, default: "Others" },
    expenseCurrency: { type: String, default: "INR" },
    expenseDate: { type: Date, default: Date.now },
    expenseOwner: { type: String, required: true },    // Who paid
    expenseMembers: { type: Array, required: true },   // Who owes
    expensePerMember: { type: Number },                // For equal splits
    expenseType: { type: String, default: "Cash" },
    
    // Split Type Configuration (THE ASSIGNMENT REQUIREMENT)
    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],
        default: 'equal'
    },
    
    // Per-member split details
    splitDetails: [{
        email: { type: String, required: true },
        amount: { type: Number, required: true },      // Calculated share
        percentage: { type: Number, default: null }    // If percentage split
    }],
    
    // Recurring Expenses
    isRecurring: { type: Boolean, default: false },
    recurrenceFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null] },
    nextRecurrenceDate: { type: Date }
});
```

### Settlement Schema
```javascript
const Settlement = new mongoose.Schema({
    groupId: { type: String, required: true },
    settleTo: { type: String, required: true },     // Who receives
    settleFrom: { type: String, required: true },   // Who pays
    settleDate: { type: String, required: true },
    settleAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    currency: { type: String, default: 'INR' },
    
    // IMPORTANT: Prevents duplicate payments
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,  // Allows null values
        index: true
    }
});
```

**What is `idempotencyKey`?**
If someone clicks "Pay" twice quickly, or if there's a network retry, we don't want to record the payment twice. The idempotency key ensures each payment is unique.

### Notification Schema
```javascript
const Notification = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['expense_added', 'expense_edited', 'expense_deleted', 
               'settlement', 'nudge', 'member_added', 'member_removed', 
               'group_invite', 'invite_accepted', 'invite_declined'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    groupId: { type: String },
    groupName: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: Object }
});
```

### ActivityLog Schema (Audit Trail)
```javascript
const ActivityLog = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'group', required: true, index: true },
    action: {
        type: String,
        required: true,
        enum: [
            'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED',
            'SETTLEMENT_MADE', 'MEMBER_JOINED', 'MEMBER_LEFT',
            'GROUP_CREATED', 'GROUP_UPDATED', 'INVITE_SENT', 'INVITE_ACCEPTED'
        ]
    },
    description: { type: String, required: true },
    performedBy: { type: String, required: true },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
});
```

---

# 5. AUTHENTICATION SYSTEM (JWT)

## What is JWT?

JWT (JSON Web Token) is a way to securely transmit information between parties. It's like a "digital ID card" that proves who you are.

**Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.     <- Header (algorithm)
eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.   <- Payload (user data)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c <- Signature (verification)
```

## Dual Token System

**Problem with single token:**
- Short expiry → User must login frequently → Bad UX
- Long expiry → If stolen, attacker has long access → Security risk

**Solution: Two tokens!**

| Token | Lifespan | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | Used for API calls |
| Refresh Token | 7 days | Used to get new access tokens |

## How It Works

```javascript
// File: helper/apiAuthentication.js

// 1. GENERATE TOKENS (on login)
exports.generateTokenPair = (user) => {
    return {
        accessToken: jwt.sign(
            { email: user, type: 'access' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        ),
        refreshToken: jwt.sign(
            { email: user, type: 'refresh' },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        )
    };
}

// 2. VALIDATE TOKEN (middleware for protected routes)
exports.validateToken = (req, res, next) => {
    const token = req.headers["authorization"].split(" ")[1];
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Tell frontend to use refresh token
                return res.status(401).json({ code: "TOKEN_EXPIRED" });
            }
            return res.status(403).json({ message: "Invalid Token" });
        }
        req.user = user.email;  // Attach user to request
        next();                  // Continue to route handler
    });
}

// 3. REFRESH TOKEN (get new access token)
exports.validateRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        );
        if (decoded.type !== 'refresh') return null;
        return decoded;
    } catch (err) {
        return null;
    }
}
```

## Login Flow

```
1. User submits email + password
   ↓
2. Server verifies password (bcrypt.compare)
   ↓
3. Server generates accessToken + refreshToken
   ↓
4. refreshToken stored in database (for rotation)
   ↓
5. Both tokens sent to client
   ↓
6. Client stores accessToken in memory, refreshToken in localStorage
   ↓
7. For API calls: Authorization: Bearer <accessToken>
   ↓
8. When accessToken expires (401 response):
   - Client sends refreshToken to /api/users/v1/refresh
   - Server validates refreshToken
   - Server generates NEW token pair
   - Old refreshToken invalidated (rotation)
```

---

# 6. CORE BUSINESS LOGIC

## Adding an Expense

**File:** `components/expense.js`

```javascript
exports.addExpense = async (req, res) => {
    try {
        var expense = req.body;
        
        // 1. Validate group exists
        var group = await model.Group.findOne({ _id: expense.groupId });
        if (!group) throw new Error("Invalid Group Id");

        // 2. Validate input fields
        validator.notNull(expense.expenseName);
        validator.notNull(expense.expenseAmount);
        validator.notNull(expense.expenseOwner);
        validator.notNull(expense.expenseMembers);

        // 3. Validate owner and members are in the group
        await validator.groupUserValidation(expense.expenseOwner, expense.groupId);
        for (var user of expense.expenseMembers) {
            await validator.groupUserValidation(user, expense.groupId);
        }

        // 4. Handle split type calculations
        const splitType = expense.splitType || 'equal';
        
        if (splitType === 'equal') {
            // Auto-calculate equal share
            const perMember = expense.expenseAmount / expense.expenseMembers.length;
            expense.splitDetails = expense.expenseMembers.map(email => ({
                email,
                amount: Math.round((perMember + Number.EPSILON) * 100) / 100
            }));
        } 
        else if (splitType === 'exact') {
            // Validate: sum of amounts = total
            const total = expense.splitDetails.reduce((sum, d) => sum + d.amount, 0);
            if (Math.abs(total - expense.expenseAmount) > 0.01) {
                throw new Error(`Split amounts must equal expense amount`);
            }
        } 
        else if (splitType === 'percentage') {
            // Validate: sum of percentages = 100
            const totalPct = expense.splitDetails.reduce((sum, d) => sum + d.percentage, 0);
            if (Math.abs(totalPct - 100) > 0.01) {
                throw new Error(`Percentages must sum to 100%`);
            }
            // Calculate amounts from percentages
            expense.splitDetails = expense.splitDetails.map(d => ({
                email: d.email,
                percentage: d.percentage,
                amount: (d.percentage / 100) * expense.expenseAmount
            }));
        }

        // 5. Save expense to database
        var newExpense = await model.Expense.create(expense);

        // 6. Update group balance
        await groupDAO.addSplit(expense.groupId, newExpense);

        // 7. Send notifications
        await notificationService.notifyGroupMembers(...);

        // 8. Emit real-time event
        socketHelper.emitExpenseAdded(expense.groupId, newExpense, expense.expenseOwner);

        // 9. Log activity
        await activityLogger.createActivityLog(expense.groupId, 'EXPENSE_ADDED', ...);

        // 10. Send response
        res.status(200).json({ status: "Success", Id: newExpense._id });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
}
```

## Updating Group Balance (The Split Logic)

**File:** `components/group.js`

```javascript
// When an expense is added, update everyone's balance
exports.addSplit = async (groupId, expense) => {
    var group = await model.Group.findOne({ _id: groupId });

    const expenseAmount = expense.expenseAmount;
    const expenseOwner = expense.expenseOwner;
    const splitDetails = expense.splitDetails;

    // Update group total
    group.groupTotal += expenseAmount;

    // CREDIT the payer (they paid, so they are owed money)
    group.split[0][expenseOwner] += expenseAmount;

    // DEBIT each member (they owe their share)
    for (const detail of splitDetails) {
        group.split[0][detail.email] -= detail.amount;
    }

    // Fix floating-point errors (ensure sum = 0)
    let bal = 0;
    for (const [_, value] of Object.entries(group.split[0])) {
        bal += value;
    }
    group.split[0][expenseOwner] -= bal;  // Adjust owner to make sum = 0

    // Save updated balance
    await model.Group.updateOne({ _id: groupId }, group);
}
```

**Example:**
```
Initial: { priya: 0, rahul: 0, amit: 0 }

Priya pays ₹300 for dinner (split equally among 3):
- Priya is credited ₹300 (she paid)
- Each person debited ₹100 (their share)

Result: { priya: +200, rahul: -100, amit: -100 }
// Priya: +300 - 100 = +200 (she is owed ₹200)
// Rahul: -100 (he owes ₹100)
// Amit: -100 (he owes ₹100)
// Sum: 200 + (-100) + (-100) = 0 ✓
```

---

# 7. DEBT SIMPLIFICATION ALGORITHM

**This is the most important technical topic for your interview!**

**File:** `helper/split.js`

## The Problem

Consider this scenario:
- A owes B ₹100
- B owes C ₹100
- C owes A ₹100

Without simplification: 3 transactions needed
With simplification: 0 transactions needed (everyone's net is zero!)

## The Algorithm: Hybrid O(N log N)

```javascript
function simplifyDebts(transactions) {
    const splits = [];

    // Convert to array: [{ person, amount }, ...]
    let balances = Object.entries(transactions)
        .map(([person, amount]) => ({ person, amount: round(amount) }))
        .filter(b => !isZero(b.amount));

    // ═══════════════════════════════════════════════════════
    // STEP 1: HASH-BASED EXACT MATCH [O(N)]
    // ═══════════════════════════════════════════════════════
    // Find pairs with opposite balances (+50 and -50)
    
    const amountToIndex = new Map();
    const settled = new Set();

    for (let i = 0; i < balances.length; i++) {
        if (settled.has(i)) continue;
        
        const { person, amount } = balances[i];
        const oppositeKey = round(-amount).toString();

        // Check if we've seen the exact opposite
        if (amountToIndex.has(oppositeKey)) {
            const j = amountToIndex.get(oppositeKey);
            if (!settled.has(j)) {
                const other = balances[j];
                const settleAmount = Math.abs(amount);

                // Found a perfect pair!
                if (amount < 0) {
                    splits.push([person, other.person, settleAmount]);
                } else {
                    splits.push([other.person, person, settleAmount]);
                }

                settled.add(i);
                settled.add(j);
                continue;
            }
        }
        
        amountToIndex.set(round(amount).toString(), i);
    }

    // Remove settled people
    balances = balances.filter((_, i) => !settled.has(i));

    // ═══════════════════════════════════════════════════════
    // STEP 2: SORTED TWO-POINTER GREEDY [O(N log N)]
    // ═══════════════════════════════════════════════════════
    
    // Separate into creditors (+) and debtors (-)
    const creditors = balances.filter(b => b.amount > 0);
    const debtors = balances.filter(b => b.amount < 0)
        .map(b => ({ person: b.person, amount: -b.amount }));

    // Sort by amount (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Two-pointer matching
    let i = 0;  // Creditor pointer
    let j = 0;  // Debtor pointer

    while (i < creditors.length && j < debtors.length) {
        const credit = creditors[i];
        const debt = debtors[j];

        // Settle the minimum of the two
        const settleAmount = Math.min(credit.amount, debt.amount);

        if (settleAmount >= 0.01) {
            splits.push([debt.person, credit.person, settleAmount]);
            
            credit.amount -= settleAmount;
            debt.amount -= settleAmount;
        }

        // Move pointers when balance is zero
        if (credit.amount < 0.01) i++;
        if (debt.amount < 0.01) j++;
    }

    return splits;
}
```

## Time Complexity Analysis

| Step | Operation | Complexity |
|------|-----------|------------|
| Convert to array | Object.entries | O(N) |
| Step 1: Exact match | Hash map lookup | O(N) |
| Step 2: Sort | TimSort | O(N log N) |
| Step 2: Two-pointer | Single pass | O(N) |
| **Total** | | **O(N log N)** |

## Example Walkthrough

**Input:**
```javascript
{ Priya: +50, Rahul: -30, Amit: -20, Neha: +30 }
// Priya is owed ₹50, Rahul owes ₹30, Amit owes ₹20, Neha is owed ₹30
```

**Step 1: Exact Match**
- Check Rahul (-30): Is there someone with +30? Yes, Neha!
- Settlement: Rahul pays Neha ₹30
- Both removed from further processing

**Remaining:**
```javascript
{ Priya: +50, Amit: -20 }
```

**Step 2: Two-Pointer**
- Creditors (sorted): [Priya: +50]
- Debtors (sorted): [Amit: -20]
- Match: Amit pays Priya ₹20
- Priya has ₹30 remaining... but no more debtors

**Output:**
```javascript
[
    ["Rahul", "Neha", 30],
    ["Amit", "Priya", 20]
]
// Only 2 transactions instead of potential 4!
```

---

# 8. REAL-TIME SYSTEM (Socket.IO)

**File:** `helper/socketHelper.js`

## How Socket.IO Works

```
Traditional HTTP:
Client → Request → Server → Response → Client
(Connection closes after each request)

WebSocket (Socket.IO):
Client ←→ Open Connection ←→ Server
(Connection stays open, either side can send anytime)
```

## Room-Based Architecture

Each group has its own "room". When a user opens a group, they join that room.

```javascript
// When client connects
io.on('connection', (socket) => {
    // Join group room (when user opens a group)
    socket.on('join-group', (groupId) => {
        socket.join(`group-${groupId}`);
        console.log(`${socket.id} joined group-${groupId}`);
    });

    // Join personal room (for notifications)
    socket.on('join-user', (userEmail) => {
        socket.join(`user-${userEmail}`);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });
});
```

## Emitting Events

```javascript
// When an expense is added (called from expense.js)
function emitExpenseAdded(groupId, expense, addedBy) {
    io.to(`group-${groupId}`).emit('expense-added', {
        expense,
        addedBy,
        timestamp: new Date()
    });
    // All users in that group room receive this event
}

// When a personal notification is needed
function emitNotification(userEmail, notification) {
    io.to(`user-${userEmail}`).emit('notification', {
        notification,
        timestamp: new Date()
    });
}
```

## Frontend Listener (React)

```javascript
// In React component
useEffect(() => {
    socket.emit('join-group', groupId);
    
    socket.on('expense-added', (data) => {
        // Update state to show new expense
        setExpenses(prev => [data.expense, ...prev]);
        toast.success(`New expense added by ${data.addedBy}`);
    });

    return () => {
        socket.emit('leave-group', groupId);
        socket.off('expense-added');
    };
}, [groupId]);
```

---

# 9. EMAIL SERVICE

**File:** `helper/emailService.js`

## Dual Email Provider Strategy

```javascript
// Production: SendGrid (HTTP API - works on Render.com)
// Development: Gmail SMTP (easier to set up locally)

const sendEmail = async (to, subject, html) => {
    // Check which provider is configured
    if (process.env.SENDGRID_API_KEY) {
        // Use SendGrid Web API
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({ to, from, subject, html });
    } else if (process.env.EMAIL_USER) {
        // Use Gmail SMTP
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS  // App password, not regular
            }
        });
        await transporter.sendMail({ to, from, subject, html });
    }
}
```

## Email Templates

```javascript
// Beautiful HTML email templates with inline CSS
const html = `
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white;">💰 Payment Reminder</h1>
        </div>
        <div style="padding: 30px;">
            <p>You owe <strong>${currency}${amount}</strong> to ${toEmail}</p>
            <a href="${appUrl}" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 25px;">
                Settle Now
            </a>
        </div>
    </div>
`;
```

---

# 10. SCHEDULING SYSTEM (Cron Jobs)

**File:** `helper/scheduler.js`

## What is node-cron?

Cron is a time-based job scheduler. It runs functions at specific times.

```javascript
// Cron expression: '0 9 * * *'
// Meaning: At minute 0, hour 9, every day, every month, every weekday
// = 9:00 AM daily

cron.schedule('0 9 * * *', () => {
    sendDailyPaymentReminders();
}, {
    timezone: 'Asia/Kolkata'
});
```

## Scheduled Jobs in SplitBill

```javascript
// 1. Daily Payment Reminders (9 AM IST)
const sendDailyPaymentReminders = async () => {
    const groups = await model.Group.find({});
    
    // Build map of user -> debts
    const userDebts = {};
    for (const group of groups) {
        const settlements = splitCalculator(group.split[0]);
        for (const [from, to, amount] of settlements) {
            if (!userDebts[from]) userDebts[from] = [];
            userDebts[from].push({ to, amount, groupName: group.groupName });
        }
    }
    
    // Send email to each debtor
    for (const [userEmail, debts] of Object.entries(userDebts)) {
        await emailService.sendPaymentReminder(userEmail, debts);
    }
}

// 2. Recurring Expense Processor (Midnight IST)
const processRecurringExpenses = async () => {
    const recurringExpenses = await model.Expense.find({
        isRecurring: true,
        nextRecurrenceDate: { $lte: new Date() }
    });
    
    for (const expense of recurringExpenses) {
        // Create new expense based on template
        await model.Expense.create({
            ...expense,
            isRecurring: false,
            expenseDate: new Date()
        });
        
        // Update next recurrence date
        const nextDate = calculateNextDate(expense);
        await model.Expense.updateOne(
            { _id: expense._id },
            { nextRecurrenceDate: nextDate }
        );
    }
}
```

---

# 11. ANALYTICS (MongoDB Aggregation)

**File:** `routes/analyticsRouter.js`

## What is MongoDB Aggregation?

Aggregation is like SQL's GROUP BY on steroids. It's a pipeline of stages that transform documents.

## Category Breakdown Pipeline

```javascript
router.post('/category-breakdown', async (req, res) => {
    const result = await model.Expense.aggregate([
        // Stage 1: Filter documents
        { $match: { groupId: groupId } },
        
        // Stage 2: Group by category, calculate totals
        {
            $group: {
                _id: '$expenseCategory',
                totalAmount: { $sum: '$expenseAmount' },
                count: { $sum: 1 },
                avgAmount: { $avg: '$expenseAmount' }
            }
        },
        
        // Stage 3: Sort by total (highest first)
        { $sort: { totalAmount: -1 } },
        
        // Stage 4: Rename and format fields
        {
            $project: {
                category: '$_id',
                totalAmount: { $round: ['$totalAmount', 2] },
                count: 1,
                _id: 0
            }
        }
    ]);
    
    res.json({ data: result });
});
```

**Example Output:**
```json
{
    "data": [
        { "category": "Food", "totalAmount": 5000, "count": 15 },
        { "category": "Transport", "totalAmount": 2000, "count": 8 },
        { "category": "Entertainment", "totalAmount": 1500, "count": 5 }
    ]
}
```

## Monthly Trends Pipeline

```javascript
router.post('/monthly-trends', async (req, res) => {
    const result = await model.Expense.aggregate([
        { $match: { expenseDate: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: '$expenseDate' },
                    month: { $month: '$expenseDate' }
                },
                totalAmount: { $sum: '$expenseAmount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Add month names
    const formatted = result.map(item => ({
        ...item,
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`
    }));
    
    res.json({ data: formatted });
});
```

---

# 12. API ENDPOINTS REFERENCE

## Authentication (No token required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/users/v1/register | Create new account |
| POST | /api/users/v1/login | Get tokens |
| POST | /api/users/v1/refresh | Refresh access token |
| POST | /api/users/v1/verify/:token | Verify email |
| POST | /api/users/v1/forgot-password | Request password reset |
| POST | /api/users/v1/reset-password/:token | Reset password |

## User Management (Token required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/users/v1/view | Get user profile |
| POST | /api/users/v1/edit | Update profile |
| POST | /api/users/v1/updatePassword | Change password |
| DELETE | /api/users/v1/delete | Delete account |

## Groups (Token required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/group/v1/add | Create group |
| POST | /api/group/v1/view | Get group details |
| POST | /api/group/v1/user | Get user's groups |
| POST | /api/group/v1/edit | Update group |
| DELETE | /api/group/v1/delete | Delete group |
| POST | /api/group/v1/settlement | Get balance sheet |
| POST | /api/group/v1/makeSettlement | Record payment |
| POST | /api/group/v1/nudge | Send payment reminder |
| POST | /api/group/v1/pendingInvites | Get pending invites |
| POST | /api/group/v1/acceptInvite | Accept group invite |
| POST | /api/group/v1/activity | Get activity log |

## Expenses (Token required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/expense/v1/add | Add expense |
| POST | /api/expense/v1/edit | Edit expense |
| DELETE | /api/expense/v1/delete | Delete expense |
| POST | /api/expense/v1/group | Get group expenses |
| POST | /api/expense/v1/user/recent | Get recent expenses |

## Analytics (Token required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/analytics/category-breakdown | Category-wise spending |
| POST | /api/analytics/monthly-trends | Monthly trends |
| POST | /api/analytics/user-summary | User spending summary |
| POST | /api/analytics/top-spenders | Top spenders in group |

---

# 13. FRONTEND ARCHITECTURE

## Key React Components

```
client/src/components/
├── dashboard/          # Main dashboard view
├── groups/             # Group list and views
│   ├── createGroup/    # Group creation form
│   ├── viewGroup/      # Group detail tabs
│   └── settlement/     # Balance views (GroupBalance, MyBalance)
├── expense/            # Expense forms and cards
├── authentication/     # Login, Register, Forgot Password
├── notification/       # Notification bell and popup
└── common/             # Shared components (Loading, EmptyState)
```

## State Management

```javascript
// AuthContext - Global user state
const AuthContext = createContext();

function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    
    const login = async (email, password) => {
        const response = await authService.login(email, password);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('profile', JSON.stringify(response.user));
        setIsAuthenticated(true);
        setUser(response.user);
    };
    
    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
```

## API Service Layer

```javascript
// client/src/services/expenseService.js
import axios from 'axios';

const API_URL = '/api/expense/v1';

export const addExpense = async (expenseData) => {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_URL}/add`, expenseData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
```

---

# 14. SECURITY FEATURES

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| Password Hashing | bcryptjs (salt rounds: 10) | Passwords never stored in plain text |
| JWT Authentication | Dual access/refresh tokens | Secure, stateless auth |
| Token Rotation | New refresh token on each refresh | Limits token reuse |
| Email Verification | Token-based, 15-min expiry | Prevent fake accounts |
| CORS | Whitelisted origins | Prevent unauthorized access |
| HTTPS | Render.com SSL | Encrypted transmission |
| Input Validation | Validator functions | Prevent injection |
| Idempotency | Unique keys for settlements | Prevent duplicate payments |
| ACID Transactions | Mongoose sessions | Data consistency |
| Gzip Compression | compression middleware | ~70% smaller responses |

---

# 15. COMMON INTERVIEW QUESTIONS

## Technical Questions

**Q: Walk me through adding an expense end-to-end.**
> "User submits form → POST /api/expense/add with JWT → validateToken middleware checks token → addExpense validates split type and calculates amounts → saves to MongoDB → updates group.split → emits Socket.IO event to group room → returns success response → all group members see update in real-time."

**Q: How does your algorithm minimize transactions?**
> "It's a hybrid O(N log N) approach. First, I use a hash map to find exact matches - if A owes ₹50 and B is owed ₹50, that's one transaction. Then I sort remaining creditors and debtors by amount and use two pointers to match the largest with largest, progressively settling until everyone is zero."

**Q: What happens if the database crashes during a settlement?**
> "All settlement operations use MongoDB transactions with Mongoose sessions. If anything fails, the entire transaction rolls back. The group balance and settlement record are updated atomically - either both succeed or neither does."

**Q: How do you prevent duplicate payments?**
> "Settlements have an idempotencyKey field with a unique index. If someone clicks 'Pay' twice, the second insert fails with duplicate key error code 11000, and I return HTTP 409 Conflict saying 'Settlement already processed.' The client knows to not retry."

**Q: Why MongoDB over PostgreSQL?**
> "Expense data is document-oriented - each expense can have different split types with varying numbers of members. MongoDB's flexible schema handles this naturally. Also, the aggregation pipeline is perfect for analytics like category breakdowns and monthly trends without complex SQL joins."

## Behavioral Questions

**Q: What was the most challenging part of this project?**
> "The debt simplification algorithm. I had to balance optimality (minimum transactions) with performance (O(N log N)). I researched existing approaches and combined hash-based exact matching with sorted greedy matching."

**Q: How did you handle the real-time requirement?**
> "I chose Socket.IO because it handles WebSocket with automatic fallback to long-polling. Each group is a 'room' - when someone joins, they're added to that room and receive events only for that group. It scales well and handles reconnection automatically."

---

# 🎯 FINAL TIPS

1. **Before the interview:**
   - Run the app locally, click through every feature
   - Have VS Code open with helper/split.js, components/group.js, model/schema.js
   - Practice explaining the algorithm out loud

2. **During the interview:**
   - If you don't know something, say "I'd need to check the code, but my understanding is..."
   - Draw diagrams if possible (request screen share)
   - Ask clarifying questions

3. **Key phrases to use:**
   - "I designed it this way because..."
   - "The trade-off I considered was..."
   - "To handle edge cases, I..."

**Good luck! You've got this! 🚀**

---

# 16. ADDITIONAL INTERVIEW QUESTIONS

## Node.js / Express Questions

**Q: What is middleware in Express?**
> "Middleware is a function that runs between receiving a request and sending a response. It has access to req, res, and next(). Examples: parsing JSON body, checking authentication, logging requests. In my project, I use validateToken middleware to check JWT before protected routes."

**Q: What is the difference between app.use() and app.get()?**
> "app.use() runs for ALL HTTP methods and can match partial paths. app.get() only runs for GET requests on exact path matches. I use app.use() for middleware like cors() and express.json(), and specific methods for route handlers."

**Q: How does Node.js handle asynchronous operations?**
> "Node.js uses an event loop with a single thread. Async operations (like database calls) are offloaded to the system, and when complete, their callbacks are added to the event queue. The event loop processes these callbacks. This is why we use async/await - to write clean asynchronous code."

**Q: What is the difference between require() and import?**
> "require() is CommonJS (Node's default), synchronous, can be used anywhere. import is ES Modules, must be at top level, supports tree-shaking. My backend uses require() (CommonJS), my React frontend uses import (ES Modules)."

**Q: How do you handle errors in Express?**
> "I use try-catch blocks in async route handlers. If an error occurs, I throw it with a status code. The catch block sends the appropriate error response. I also have a global error handler that logs errors using Winston."

```javascript
// My pattern:
try {
    // Business logic
} catch (err) {
    logger.error(`URL: ${req.originalUrl} | message: ${err.message}`);
    res.status(err.status || 500).json({ message: err.message });
}
```

**Q: What is the purpose of the package.json file?**
> "It defines project metadata, dependencies, scripts, and configuration. Key sections: name/version, scripts (npm run dev, npm run build), dependencies (production packages), devDependencies (build tools). It also locks versions to ensure consistent installs."

**Q: How do environment variables work?**
> "Environment variables store configuration that changes between environments (dev, prod). I use dotenv to load them from a .env file. Examples: MONGODB_URI, ACCESS_TOKEN_SECRET, PORT. This keeps secrets out of code and enables different configs per environment."

---

## MongoDB Questions

**Q: What is the difference between SQL and NoSQL databases?**
> "SQL databases have fixed schemas with tables and rows. NoSQL (like MongoDB) has flexible schemas with documents. SQL uses joins to combine data; MongoDB embeds related data or uses references. I chose MongoDB because expense data varies in structure - different split types have different fields."

**Q: What is indexing in MongoDB?**
> "Indexes speed up queries by creating a sorted data structure for a field. Without an index, MongoDB scans every document. I have indexes on userId in notifications (for quick user lookups) and groupId in ActivityLog. The trade-off is indexes slow down writes."

**Q: Explain MongoDB aggregation pipeline.**
> "Aggregation is a sequence of stages that transform documents. Each stage takes input from the previous stage. Common stages: $match (filter), $group (like SQL GROUP BY), $sort, $project (select fields). I use it for analytics - category breakdown uses $group to sum amounts by category."

**Q: What is the difference between findOne() and find()?**
> "findOne() returns a single document (or null). find() returns a cursor that can iterate over multiple documents. I use findOne() for getting a specific group by ID, find() for getting all groups a user belongs to."

**Q: What are Mongoose schemas and why use them?**
> "Mongoose adds a schema layer on top of MongoDB. It defines structure, validates data, provides middleware (pre/post hooks), and enables virtuals. While MongoDB itself is schema-less, Mongoose schemas give me type checking and required field validation."

**Q: What is the difference between embedding and referencing in MongoDB?**
> "Embedding puts related data inside a document (like split inside Group). Referencing stores an ID and fetches separately (like groupId in Expense). I embed split because it's always accessed with the group. Expenses are separate because they can grow unbounded - embedding would hit the 16MB document limit."

---

## React / Frontend Questions

**Q: What is the Virtual DOM?**
> "React maintains a lightweight copy of the real DOM in memory. When state changes, React creates a new virtual DOM, diffs it with the old one, and only updates the changed parts in the real DOM. This is faster than directly manipulating the DOM."

**Q: What are React hooks? Which ones do you use?**
> "Hooks let you use state and lifecycle features in functional components. I use: useState (component state), useEffect (side effects like API calls), useContext (global state like auth), useRef (DOM references), useCallback (memoized callbacks for performance)."

**Q: Explain useEffect cleanup function.**
> "The cleanup function runs before the component unmounts or before the effect runs again. I use it to unsubscribe from Socket.IO events - prevents memory leaks and duplicate listeners."

```javascript
useEffect(() => {
    socket.on('expense-added', handleExpense);
    return () => socket.off('expense-added');  // Cleanup
}, []);
```

**Q: What is prop drilling and how do you avoid it?**
> "Prop drilling is passing props through many component levels. I avoid it using React Context (AuthContext for user state) and by colocating state near where it's used. For complex state, you could use Redux or Zustand."

**Q: What is the difference between controlled and uncontrolled components?**
> "Controlled components have their value controlled by React state - every change updates state. Uncontrolled components use refs to access DOM values directly. I use controlled components for forms because it gives me more control over validation."

**Q: How do you handle forms in React?**
> "I use controlled components with useState for form fields. On submit, I validate the data, call the API service, and handle success/error. For complex forms, libraries like Formik or React Hook Form help with validation and state management."

**Q: What is React.memo and when would you use it?**
> "React.memo is a higher-order component that memoizes a component - it only re-renders if props change. I'd use it for expensive components that receive the same props frequently, like a chart that doesn't need to re-render on every parent update."

---

## Authentication & Security Questions

**Q: How does JWT authentication work?**
> "After login, the server signs a JSON payload with a secret key, creating a token. The client sends this token in the Authorization header. The server verifies the signature - if valid, it trusts the payload. Stateless - no session storage needed."

**Q: Why use access token AND refresh token?**
> "Security vs UX trade-off. Short-lived access tokens (15 min) limit damage if stolen. Refresh tokens (7 days) let users stay logged in without re-entering credentials. If refresh token is compromised, we can invalidate it in the database."

**Q: What is bcrypt and why use it?**
> "bcrypt is a password hashing algorithm that adds a random salt and is intentionally slow (configurable rounds). This makes rainbow table attacks useless and brute force very slow. I use 10 salt rounds - a good balance of security and performance."

**Q: What is CORS and why is it needed?**
> "Cross-Origin Resource Sharing - browsers block requests from different origins by default (security). CORS headers tell the browser which origins are allowed. I use cors() middleware to allow my frontend domain to call my API."

**Q: How do you store tokens on the client?**
> "Access token in memory (component state) - lost on page refresh but secure. Refresh token in localStorage - persists but vulnerable to XSS. For higher security, use httpOnly cookies for refresh tokens. My app uses localStorage for simplicity."

**Q: What is XSS and how do you prevent it?**
> "Cross-Site Scripting - attackers inject malicious scripts. Prevention: sanitize user input, use React (automatically escapes), use Content-Security-Policy headers. My app uses React which escapes output by default."

---

## System Design Questions

**Q: How would you scale this app to 10x users?**
> "1. Database: Add read replicas for analytics queries, shard by groupId for write scaling. 2. API: Horizontal scaling with load balancer, stateless JWT makes this easy. 3. Socket.IO: Use Redis adapter for multi-server rooms. 4. Caching: Add Redis for frequently accessed data like group balances."

**Q: How would you add a chat feature to groups?**
> "I already have Socket.IO rooms per group. I'd add: 1. Message schema (groupId, senderId, text, timestamp). 2. Socket event 'chat-message' for sending. 3. REST endpoint to fetch message history. 4. React component to display messages. Pagination for history using cursor-based approach."

**Q: How would you implement expense attachments (receipts)?**
> "1. Use cloud storage (S3/Cloudinary) - never store files in MongoDB. 2. Upload endpoint that returns a URL. 3. Add receiptUrl field to Expense schema. 4. Frontend: file input, upload on select, store URL. For security: signed upload URLs, file type validation, size limits."

**Q: How would you add multi-currency support?**
> "1. Store expenseCurrency with each expense. 2. Use a currency conversion API (Open Exchange Rates). 3. Convert all amounts to user's preferred currency for display. 4. For settlements, either convert at time of payment or let users choose currency. Cache exchange rates to reduce API calls."

**Q: How would you implement offline support?**
> "1. Service Worker for caching static assets (already PWA-enabled). 2. IndexedDB for offline data storage. 3. Optimistic UI updates - show changes immediately. 4. Sync queue - store actions when offline, replay when online. 5. Conflict resolution - last-write-wins or merge logic."

---

## Debugging / Problem-Solving Questions

**Q: How would you debug a slow API endpoint?**
> "1. Add timing logs at each step. 2. Check database queries - add explain() to see if indexes are used. 3. Look for N+1 query problems. 4. Check network latency if using external services. 5. Use profiling tools like clinic.js. In my app, I found the settlement calculation was slow because it was called in a loop - I fixed it by batching."

**Q: A user reports data isn't updating in real-time. How do you debug?**
> "1. Check browser console for Socket.IO connection errors. 2. Check server logs for socket events. 3. Verify user joined the correct room. 4. Check if the event is being emitted after the database update. 5. Check if the frontend listener is set up correctly (and not duplicated)."

**Q: How would you handle a production outage?**
> "1. Acknowledge and communicate (status page). 2. Check logs for error spikes (Winston/Render logs). 3. Check database connection. 4. Check recent deployments - rollback if needed. 5. Fix issue in staging first. 6. Deploy fix. 7. Post-mortem - document what happened and how to prevent it."

**Q: Tell me about a bug you fixed in this project.**
> "The MyBalance component showed ₹0 for everyone. I debugged by adding console.logs and found currentUserEmail was being read at module load time, not inside the component. Users who logged in after page load got stale data. I moved the localStorage read inside useEffect, and it fixed immediately."

---

## Behavioral / HR Questions

**Q: Tell me about yourself.**
> "I'm a final year student passionate about backend development. I built this expense sharing app to understand full-stack architecture. I'm interested in fintech because I see how technology can simplify financial problems - like this debt simplification algorithm that minimizes transactions."

**Q: Why do you want to join CredResolve?**
> "CredResolve works on credit resolution which involves complex financial calculations and data processing - areas I'm interested in. I noticed you use PostgreSQL and Spring Boot (from LinkedIn), and while my project uses MongoDB and Node.js, I'm eager to learn new stacks. The startup environment where I can wear multiple hats also excites me."

**Q: What is your biggest weakness?**
> "I tend to over-engineer initial versions. For this project, I added many extra features beyond requirements. I'm learning to build MVPs first and iterate based on feedback - shipping early is more valuable than shipping perfect."

**Q: Where do you see yourself in 5 years?**
> "I want to be a senior engineer who can own entire features end-to-end. I want to mentor junior developers and contribute to architecture decisions. I'm also interested in understanding the business side - how technical decisions impact product and users."

**Q: Describe a time you worked in a team.**
> "During college projects, I often handled the backend while teammates handled frontend. Communication was key - we documented API contracts early. When there were disagreements, we discussed trade-offs and decided based on project goals, not personal preference."

**Q: How do you handle tight deadlines?**
> "1. Prioritize - what's essential vs nice-to-have. 2. Communicate - if deadline is unrealistic, say so early. 3. Cut scope, not quality - shipping fewer features that work is better than many broken ones. 4. Ask for help if stuck - don't waste hours on something a teammate knows."

**Q: Why should we hire you?**
> "I learn fast - I built this full-stack app with technologies I didn't know before. I'm genuinely curious about how things work, not just making them work. I'm not afraid to ask questions or admit when I don't know something. And I care about code quality and user experience."

---

## Project-Specific Deep Dive Questions

**Q: Why did you use Socket.IO instead of Server-Sent Events (SSE)?**
> "SSE is simpler but only supports one-way (server to client). I needed bidirectional - users opening groups (join-room) and sending updates. Socket.IO also handles reconnection automatically and falls back to long-polling if WebSocket fails."

**Q: How do you handle if a user is in multiple groups simultaneously?**
> "Socket.IO supports joining multiple rooms. When a user opens a group tab, they join that room. The socket connection is per-browser, but they can be in many rooms. Events are targeted to specific rooms, so expenses in Group A don't broadcast to Group B."

**Q: What happens if the server crashes while processing an expense?**
> "The expense won't be saved - MongoDB operations are atomic per document. For settlements, I use transactions - either both the Settlement insert and Group.split update succeed, or both rollback. The client will receive a 500 error and can retry."

**Q: How do you validate that split amounts are correct?**
> "For exact splits, I sum all splitDetails amounts and compare to expenseAmount. For percentage splits, I sum percentages and compare to 100. I use a tolerance of 0.01 to handle floating-point rounding. If validation fails, I return 400 with a descriptive error."

**Q: What if a user leaves a group with pending balance?**
> "Currently, I don't allow leaving with non-zero balance. The system shows your balance, and you must settle first. A future improvement could be transferring the debt to remaining members proportionally, but that's complex and requires consensus."

**Q: How does the activity log work?**
> "Every significant action (add expense, settlement, member join) calls activityLogger.createActivityLog(). It stores: groupId, action type, description, performedBy, timestamp, and metadata. The Activity tab in UI fetches this log sorted by timestamp descending."

---

## Quick Fire Round (1-line answers)

| Question | Answer |
|----------|--------|
| HTTP vs HTTPS | HTTPS encrypts data with SSL/TLS |
| GET vs POST | GET reads data, POST creates/modifies |
| REST vs GraphQL | REST: multiple endpoints, GraphQL: single endpoint with queries |
| SQL injection | Prevented by parameterized queries (Mongoose does this) |
| 200 vs 201 | 200 = OK, 201 = Created (after POST) |
| 401 vs 403 | 401 = Not authenticated, 403 = Authenticated but not authorized |
| Cookie vs localStorage | Cookies sent with every request, localStorage is client-only |
| npm install vs npm ci | install updates lock file, ci uses exact lock file (for CI/CD) |
| let vs const | let can be reassigned, const cannot |
| == vs === | == coerces types, === is strict equality |

---

**Remember: It's okay to say "I don't know" - then explain how you would find out!**

---

# 16. FINANCIAL INTEGRITY & CONCURRENCY

**This is critical for a Fintech interview!** When dealing with real money, you can't afford "almost correct." Two problems can destroy trust:
1. **Double Spend** (money deducted twice)
2. **Duplicate Payments** (user charged twice because of a retry)

Let me walk you through exactly how SplitBill handles these at the database level.

---

## 16.1 Handling Race Conditions (ACID Transactions)

### The "Double Spend" Problem

**Scenario:** Two API requests arrive at the exact same millisecond. Both try to update the same user's balance.

```
Timeline (No Protection):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request A                          Request B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READ: balance = 500                READ: balance = 500  ⚠️ STALE!
COMPUTE: 500 - 100 = 400           COMPUTE: 500 - 200 = 300
WRITE: balance = 400               WRITE: balance = 300  💥 OVERWRITES!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULT: balance = 300 (should be 200!)
        Request A's deduction was LOST
```

**This is catastrophic in finance.** One user just got free money.

### The Solution: MongoDB ACID Transactions

**File:** `components/group.js` - `makeSettlement()`

In SplitBill, I wrap the Settlement creation and Group Balance update in a single **atomic transaction**:

```javascript
exports.makeSettlement = async (req, res) => {
    // 1. START A SESSION
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // 2. DEFENSIVE CHECKS (fail fast before any mutation)
        if (req.body.settleAmount <= 0) {
            throw new Error("Settlement amount must be positive");
        }
        if (req.body.settleFrom === req.body.settleTo) {
            throw new Error("Payer and Payee cannot be the same person");
        }

        // 3. READ WITH SESSION (ensures snapshot isolation)
        const group = await model.Group.findOne({
            _id: req.body.groupId
        }).session(session);  // ← CRITICAL: reads within transaction

        if (!group) throw new Error("Invalid Group Id");

        // Verify participants are in the group
        if (!group.split[0].hasOwnProperty(req.body.settleFrom) || 
            !group.split[0].hasOwnProperty(req.body.settleTo)) {
            throw new Error("Payer or Payee not part of this group");
        }

        // 4. ATOMIC UPDATE (both operations succeed or both fail)
        group.split[0][req.body.settleFrom] += req.body.settleAmount;
        group.split[0][req.body.settleTo] -= req.body.settleAmount;

        // Create settlement record WITH session
        await model.Settlement.create([reqBody], { session: session });

        // Update group balance WITH session
        await model.Group.updateOne(
            { _id: group._id },
            { $set: { split: group.split } }
        ).session(session);

        // 5. COMMIT - only now are changes visible
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ status: "Success", message: "Settlement recorded" });
        
    } catch (err) {
        // 6. ROLLBACK - everything reverts to original state
        await session.abortTransaction();
        session.endSession();
        
        // Handle specific errors (see idempotency section below)
        if (err.code === 11000) {
            return res.status(409).json({ 
                message: "Settlement already processed" 
            });
        }
        
        res.status(500).json({ message: err.message });
    }
}
```

### Why This Works

| Without Transaction | With Transaction |
|---------------------|------------------|
| Read → Compute → Write (3 separate ops) | All ops in one atomic unit |
| Other requests can interleave | Isolation: no interleaving |
| Partial failures possible | All-or-nothing guarantee |
| Data inconsistency | Data always consistent |

**Key Points:**
- `startSession()` creates an isolated view of the database
- All operations use `.session(session)` to participate in the transaction
- `commitTransaction()` makes changes permanent **atomically**
- `abortTransaction()` rolls back **everything** if any step fails
- MongoDB's snapshot isolation prevents "dirty reads"

---

## 16.2 Preventing Duplicate Payments (Idempotency)

### The "Network Retry" Problem

**Scenario:** A user clicks "Settle Up." The request succeeds, but the network drops the response. The client retries. Now the same payment could be recorded twice.

```
Timeline (No Protection):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User clicks "Pay ₹500"
→ Request 1 sent
→ Server creates Settlement #ABC, updates balance
→ Response 200 ← ❌ NETWORK DROPS THIS
→ Client shows "timeout", user panics
→ User clicks "Pay ₹500" again (or browser auto-retries)
→ Request 2 sent
→ Server creates Settlement #DEF, updates balance again 💥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULT: ₹1000 deducted instead of ₹500!
```

### The Solution: Idempotency Key with Database Constraint

**File:** `model/schema.js`

```javascript
const Settlement = new mongoose.Schema({
    groupId: { type: String, required: true },
    settleTo: { type: String, required: true },
    settleFrom: { type: String, required: true },
    settleDate: { type: String, required: true },
    settleAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    currency: { type: String, default: 'INR' },
    
    // THE SAFETY MECHANISM
    idempotencyKey: {
        type: String,
        unique: true,   // ← DATABASE ENFORCES UNIQUENESS
        sparse: true,   // ← Allows null for legacy records
        index: true     // ← Fast lookups
    }
});
```

### How It Works

1. **Client generates a unique key** before sending the request (e.g., `uuid-v4` or `groupId-from-to-timestamp`)
2. **Client sends the same key on every retry** for this specific payment
3. **MongoDB's unique constraint rejects duplicates** at the database level

```javascript
// Client sends:
{
    "groupId": "abc123",
    "settleFrom": "alice@email.com",
    "settleTo": "bob@email.com",
    "settleAmount": 500,
    "idempotencyKey": "pay-abc123-alice-bob-1704393600000"  // ← Same key on retry
}
```

### The E11000 Duplicate Key Error

When a duplicate `idempotencyKey` is inserted, MongoDB throws error code `11000`:

```javascript
// In makeSettlement (components/group.js):
catch (err) {
    await session.abortTransaction();
    session.endSession();

    // HANDLE IDEMPOTENCY DUPLICATE
    if (err.code === 11000) {
        logger.warn(`Duplicate settlement attempt: ${err.message}`);
        
        // Return SUCCESS-like response!
        // (Client already succeeded, they just didn't know)
        return res.status(409).json({
            message: "Settlement already processed (Idempotent)",
            status: "Success"  // ← Client treats this as success
        });
    }

    res.status(err.status || 500).json({ message: err.message });
}
```

### Why `sparse: true`?

```javascript
idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,  // ← THIS IS IMPORTANT
    index: true
}
```

**Problem:** What about settlements made before we added idempotency?

**Solution:** `sparse: true` means MongoDB **only indexes documents where the field exists**. Old settlements with `idempotencyKey: null` are ignored by the unique constraint.

| sparse: false | sparse: true |
|---------------|--------------|
| All docs in index (incl. nulls) | Only non-null values indexed |
| Only ONE null allowed | Multiple nulls allowed |
| Breaks with legacy data | Works with legacy data ✓ |

---

## 16.3 Interview Talking Points

**Q: How do you prevent double-spending in your app?**
> "I use MongoDB ACID transactions via `mongoose.startSession()`. The Settlement creation and Group Balance update are wrapped in a single transaction. If either fails—network issue, validation error, anything—the entire operation rolls back. The database never sees a partial state."

**Q: What happens if a user's payment request is sent twice?**
> "Each settlement carries an idempotency key that's unique to that specific payment attempt. The schema has `unique: true` on this field. If the same payment is submitted again—whether from a double-click or network retry—MongoDB throws an E11000 duplicate key error. I catch this and return a 409 Conflict with a success-like message, so the client knows the original payment went through."

**Q: Why not just check if a settlement exists before inserting?**
> "That creates a TOCTOU (Time-Of-Check-Time-Of-Use) race condition. Between my `findOne()` and `create()`, another request could insert. The database-level unique constraint is atomic—it's the only reliable way to guarantee uniqueness under concurrent load."

**Q: What is the `sparse` index option?**
> "It tells MongoDB to only index documents where the field has a value. This lets me have multiple old settlements with `idempotencyKey: null` without violating the unique constraint. It's essential for adding idempotency to existing systems without migrating legacy data."

---

## 16.4 The Full Picture: Defense in Depth

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                                  │
│                          ↓                                           │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 1: Input Validation (Defensive Checks)                       │
│  ───────────────────────────────────────────                         │
│  • Amount > 0                                                        │
│  • Payer ≠ Payee                                                     │
│  • Both users in group                                               │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 2: ACID Transaction (Atomicity)                               │
│  ───────────────────────────────────────                             │
│  • startSession() + startTransaction()                               │
│  • All reads/writes use .session(session)                            │
│  • commitTransaction() or abortTransaction()                         │
├──────────────────────────────────────────────────────────────────────┤
│  LAYER 3: Idempotency Key (Duplicate Protection)                     │
│  ─────────────────────────────────────────────                       │
│  • unique: true on idempotencyKey                                    │
│  • E11000 error → 409 Conflict (safe to retry)                       │
│  • sparse: true for backward compatibility                           │
├──────────────────────────────────────────────────────────────────────┤
│                          ↓                                           │
│                  CONSISTENT DATABASE STATE                           │
└──────────────────────────────────────────────────────────────────────┘
```

**What I can confidently say in an interview:**
> "My settlement system has defense in depth. Defensive checks catch obvious errors fast. ACID transactions guarantee atomicity—no partial updates. Idempotency keys prevent duplicate processing. Each layer protects against different failure modes. This is how production-grade financial systems are built."
