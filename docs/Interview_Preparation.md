# 🎯 CredResolve Interview Preparation Guide
## Backend/Fullstack Engineer Position - SplitBill Project

**Interview Date:** January 3, 2026 @ 11:00 AM  
**Duration:** 20 minutes  
**Interviewer:** Mohit (BE) / Prashanth (AI) - Founding Member, IIT Roorkee

---

## ⚠️ CRITICAL: How to Frame Your Experience

**Be Honest, But Strategic:**
> "I built this project by researching open-source solutions, identifying a strong foundation, and then extensively customizing it using AI-assisted development. I focused on understanding the architecture, adding features like the invite system and real-time sync, and debugging edge cases. This reflects how modern developers work - leveraging tools to be more productive."

**What You DID Do (Own This):**
- ✅ Understood the architecture and data flow
- ✅ Added features: Invite system, Activity logs, Analytics
- ✅ Debugged and fixed issues (like the MyBalance bug we found)
- ✅ Designed the UI/UX enhancements
- ✅ Learned the tech stack through hands-on iteration
- ✅ Created video demo, documentation, README

**If Asked "Did you write all this code?":**
> "I used a combination of a starter template and AI-assisted development. But I made sure to understand every component - I can walk you through any part of the codebase."

---

## 🧠 MUST-KNOW CONCEPTS (Memorize These)

### 1. Debt Simplification Algorithm (THE STAR OF YOUR PROJECT)

**File:** `helper/split.js`

**The Problem:**
> If A owes B ₹100, B owes C ₹100, and C owes A ₹100 → 3 transactions needed.
> But net balance is ZERO for everyone → 0 transactions needed!

**My Solution - Hybrid O(N log N):**

```
STEP 1: Hash-based Exact Match [O(N)]
├── Build a Map of {amount → person}
├── Find pairs: If someone owes ₹50 and someone is owed ₹50 → instant match!
└── Example: Rahul(-30) ↔ Neha(+30) → Rahul pays Neha ₹30

STEP 2: Sorted Two-Pointer [O(N log N)]
├── Sort creditors (positive balance) descending
├── Sort debtors (negative balance) descending
├── Use two pointers to match largest with largest
└── Example: Priya(+50), Amit(-20) → Amit pays Priya ₹20
```

**Why This Matters:**
- Minimizes number of transactions (UX improvement)
- Prevents circular payments
- Handles floating-point precision with TOLERANCE = 0.01

**Code to Explain:**
```javascript
// Two-pointer matching - O(N)
let i = 0; // Creditor pointer
let j = 0; // Debtor pointer

while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(credit.amount, debt.amount);
    splits.push([debt.person, credit.person, settleAmount]);
    // Move pointers when balance is fully settled
    if (credit.amount < TOLERANCE) i++;
    if (debt.amount < TOLERANCE) j++;
}
```

---

### 2. JWT Authentication (Dual Token System)

**File:** `helper/apiAuthentication.js`

**Why Dual Tokens?**
- **Access Token** (15 minutes): Short-lived, used for API calls
- **Refresh Token** (7 days): Long-lived, stored in DB for rotation

**Flow:**
```
LOGIN:
User → Login → Server generates both tokens → Stores refreshToken in DB

API CALL:
Request with accessToken → validateToken middleware → Proceed or 401

TOKEN REFRESH:
accessToken expires → Client sends refreshToken → New accessToken issued
```

**Code to Explain:**
```javascript
exports.validateToken = (req, res, next) => {
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ code: "TOKEN_EXPIRED" });
        }
        req.user = user.email;
        next();
    });
}
```

---

### 3. Real-Time Updates (Socket.IO)

**File:** `helper/socketHelper.js`

**Architecture:**
```
User A adds expense → HTTP POST to /api/expense/add
                    ↓
              Save to MongoDB
                    ↓
              socketHelper.emitExpenseAdded(groupId, expense)
                    ↓
              All users in that group's "room" receive update
                    ↓
              React UI refreshes automatically
```

**Why Socket.IO over alternatives?**
- Auto-fallback (WebSocket → Long Polling)
- Room-based messaging (each group = 1 room)
- Built-in reconnection handling

---

### 4. MongoDB Schema Design

**File:** `model/schema.js`

**6 Collections:**
| Collection | Purpose | Key Fields |
|------------|---------|------------|
| User | Authentication | emailId, password (bcrypt), refreshToken |
| Group | Expense groups | groupMembers[], pendingMembers[], split[] |
| Expense | Individual expenses | splitType (equal/exact/percentage), splitDetails[] |
| Settlement | Payment records | idempotencyKey (prevents duplicates) |
| Notification | In-app alerts | type, isRead, userId |
| ActivityLog | Audit trail | action, performedBy, timestamp |

**Design Decision - Embedding vs Referencing:**
> "I embedded `split` directly in Group because it's always accessed together - reduces joins. But `expenses` are separate documents because they can grow unbounded."

---

### 5. Split Types (Equal, Exact, Percentage)

**How Each Works:**
```javascript
// EQUAL: Auto-calculate
perMember = totalAmount / members.length

// PERCENTAGE: Validate sum = 100%
if (percentages.reduce((a,b) => a+b) !== 100) throw Error

// EXACT: Validate sum = total amount
if (amounts.reduce((a,b) => a+b) !== totalAmount) throw Error
```

---

## 🔥 EXPECTED QUESTIONS & ANSWERS

### Technical Deep-Dive

**Q: Walk me through what happens when a user adds an expense.**
> "When a user submits an expense:
> 1. Frontend sends POST to `/api/expense/v1/add` with JWT token
> 2. `validateToken` middleware checks access token
> 3. Business logic validates split type and calculates splitDetails
> 4. Expense saved to MongoDB, Group.split updated
> 5. `socketHelper.emitExpenseAdded()` broadcasts to all group members
> 6. All connected clients' UIs update in real-time"

**Q: How does your balance calculation work?**
> "Each group has a `split` object storing net balance per member. Positive = owed money, Negative = owes money. When we need settlements, I run a Hybrid O(N log N) algorithm:
> - First, exact-match pairs using a hash map (O(N))
> - Then, two-pointer greedy on sorted lists (O(N log N))
> This minimizes the number of transactions."

**Q: How do you handle concurrency/race conditions?**
> "For settlements, I use MongoDB ACID transactions via `mongoose.startSession()`. All balance updates happen atomically. If anything fails, the entire transaction rolls back."

**Q: What happens if the same payment is submitted twice (network retry)?**
> "Settlements have an `idempotencyKey` field with a unique index. If the same key is submitted twice, MongoDB returns a duplicate key error (code 11000), and I return HTTP 409 Conflict saying 'Settlement already processed.'"

**Q: Why MongoDB over SQL?**
> "Expense data is document-oriented - each expense has variable split details. Flexible schema lets me add fields like `recurrenceFrequency` without migrations. Plus, MongoDB's aggregation pipeline is perfect for analytics."

---

### System Design Questions

**Q: How would you scale this to 1 million users?**
> "Current architecture handles it well:
> - MongoDB Atlas scales horizontally with sharding
> - Socket.IO can use Redis adapter for multi-server rooms
> - Stateless JWT means any server can handle any request
> For extreme scale, I'd add:
> - Read replicas for analytics queries
> - Message queue (like Bull) for email notifications
> - CDN for static assets"

**Q: What if Socket.IO connection drops?**
> "Socket.IO has built-in reconnection. On reconnect, the client fetches fresh data from REST API. The socket is just for push updates - source of truth is always the database."

---

### Behavioral Questions

**Q: Tell me about a challenging bug you fixed.**
> "The MyBalance component was showing ₹0 for everyone. I debugged and found that `currentUserEmail` was being read at module load time, not inside the component. If someone logged in after page load, the email was stale. I moved the localStorage read inside useEffect, and it fixed immediately."

**Q: Why did you choose this project?**
> "I wanted to solve a real problem I face - splitting bills with friends. Splitwise is great but I wanted to understand how features like debt simplification work under the hood. Building it myself taught me full-stack architecture, real-time systems, and algorithm design."

---

## 📋 QUICK REFERENCE - Files to Know

| File | Purpose | Key Function |
|------|---------|--------------|
| `components/group.js` | Core business logic | createGroup, addSplit, groupBalanceSheet |
| `helper/split.js` | Debt algorithm | simplifyDebts (hybrid O(N log N)) |
| `helper/apiAuthentication.js` | JWT handling | validateToken, generateTokenPair |
| `helper/socketHelper.js` | Real-time events | emitExpenseAdded, joinGroupRoom |
| `model/schema.js` | Database schemas | User, Group, Expense, Settlement |
| `routes/groupRouter.js` | API endpoints | POST /add, /settlement, /nudge |

---

## 🎤 YOUR 2-MINUTE ELEVATOR PITCH

> "SplitBill is a full-stack expense sharing app I built to understand real-world backend architecture. The most interesting technical challenge was the debt simplification algorithm - I implemented a hybrid O(N log N) approach that first does hash-based exact matching, then uses a two-pointer greedy to minimize transactions.

> For real-time sync, I chose Socket.IO with room-based messaging so group members see updates instantly. Authentication uses a dual JWT system - short-lived access tokens with refresh rotation for security.

> The project taught me how to think about edge cases like floating-point precision, network retries causing duplicate payments, and graceful degradation when WebSockets aren't available."

---

## ✅ PRE-INTERVIEW CHECKLIST

- [ ] Have the project running locally (`npm run dev`)
- [ ] Open Chrome with the app logged in
- [ ] Have VS Code open with key files ready
- [ ] Review this document one more time
- [ ] Test your camera/mic before the call
- [ ] Keep water nearby
- [ ] Deep breath - you've got this! 🚀

---

## 🔗 Quick Links for Reference

- **Live Demo:** https://splitbill-7p1s.onrender.com
- **GitHub:** https://github.com/ashish-goyal-1/SplitBill
- **YouTube Demo:** [Your uploaded video link]

**Good luck, Ashish!** You've put genuine effort into understanding this project. Be confident, be honest, and show them you can learn and build. 💪
