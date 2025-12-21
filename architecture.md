# System Architecture

## High-Level Architecture

SplitBill uses a **Client-Server** architecture powered by the MERN stack. Unlike traditional REST apps, we use **Socket.io** alongside HTTP to ensure real-time synchronization of expenses between group members.

```
┌─────────────────┐         ┌─────────────────────────────────────────┐
│  Client Browser │◄──────► │              Node.js Server             │
│  (React + MUI)  │  HTTPS  │           (Express + Socket.io)         │
│     :3000       │   WSS   │                 :3001                   │
└─────────────────┘         └───────────────────┬─────────────────────┘
                                                │
                                                │ Mongoose
                                                ▼
                                    ┌───────────────────────┐
                                    │    MongoDB Atlas      │
                                    │  (Cloud Database)     │
                                    └───────────────────────┘
```

---

## Backend Architecture (Node.js)

We follow a **Route-Helper-Model** pattern to keep business logic organized.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    API Routes (Express Router)                       │
│      /routes/userRouter.js, groupRouter.js, expenseRouter.js         │
│              (Endpoint definitions, input validation)                │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Helper Layer (/helper)                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│   │ apiAuthentication│  │  socketHelper  │  │   emailService  │      │
│   │  (JWT Verify)   │  │ (Real-time IO)  │  │ (Notifications) │      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│   │   scheduler     │  │  activityLogger │  │     logger      │      │
│   │ (Recurring Exp) │  │ (Audit Trail)   │  │ (Winston Logs)  │      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Data Layer (Mongoose Models)                      │
│                        /model/schema.js                              │
│        (User, Group, Expense, Settlement, Notification, ActivityLog) │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (NoSQL - MongoDB)

We use MongoDB for flexible document storage with Mongoose ODM.

```
┌────────────────────┐          ┌────────────────────┐
│       User         │          │       Group        │
├────────────────────┤          ├────────────────────┤
│ _id                │◄────────┐│ _id                │
│ firstName          │         ││ groupName          │
│ lastName           │         ││ groupDescription   │
│ emailId (unique)   │         ││ groupCurrency      │
│ password (hashed)  │         └┤ groupOwner (email) │
│ refreshToken       │          │ groupMembers []    │
│ paymentMethods []  │          │ pendingMembers []  │
│ isVerified         │          │ groupTotal         │
│ verificationToken  │          │ split []           │
└────────────────────┘          └─────────┬──────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│      Expense       │    │    Settlement      │    │   ActivityLog      │
├────────────────────┤    ├────────────────────┤    ├────────────────────┤
│ _id                │    │ _id                │    │ _id                │
│ groupId            │    │ groupId            │    │ groupId            │
│ expenseName        │    │ settleTo           │    │ action (enum)      │
│ expenseAmount      │    │ settleFrom         │    │ description        │
│ expenseOwner       │    │ settleAmount       │    │ performedBy        │
│ expenseMembers []  │    │ settleDate         │    │ timestamp          │
│ splitType (enum)   │    │ paymentMethod      │    │ metadata {}        │
│ splitDetails []    │    │ currency           │    └────────────────────┘
│ isRecurring        │    └────────────────────┘
│ recurrenceFrequency│
└────────────────────┘

┌────────────────────┐
│   Notification     │
├────────────────────┤
│ _id                │
│ userId             │
│ type (enum)        │
│ title              │
│ message            │
│ groupId            │
│ isRead             │
│ createdAt          │
└────────────────────┘
```

---

## Request Flow: Adding an Expense (HTTP + Socket.io)

This flow demonstrates the hybrid synchronous + real-time architecture.

```
User A (Browser)
      │
      │ 1. POST /api/expense/v1/add
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  [expenseRouter.js]                                             │
│  - Validate JWT token (apiAuthentication.validateToken)         │
│  - Parse request body                                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  [Route Handler - Business Logic]                               │
│  - Create Expense document in MongoDB                           │
│  - Update Group.groupTotal                                      │
│  - Recalculate Group.split[] (Debt Simplification)              │
│  - Log action to ActivityLog                                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  [socketHelper.js - Real-time Broadcast]                        │
│  - Emit 'EXPENSE_ADDED' event to all group members              │
│  - Create Notification documents for each member                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   User B (WS)             User C (WS)             User D (WS)
   UI Refreshes            UI Refreshes            UI Refreshes
```

---

## Core Algorithm: Debt Simplification

Instead of N² individual payments, we use a **Hybrid O(N log N)** algorithm to minimize transactions.

```
   Input: { Priya: +50, Rahul: -30, Amit: -20, Neha: +30 }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Hash-based Exact Match [O(N)]                          │
│  ─────────────────────────────────────                          │
│  • Build Map of {amount → person}                               │
│  • Find pairs: Rahul(-30) ↔ Neha(+30) ✓ Exact match!            │
│  • Settlement: Rahul pays Neha ₹30                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Sorted Two-Pointer [O(N log N)]                        │
│  ────────────────────────────────────────                       │
│  • Remaining: Priya(+50), Amit(-20)                             │
│  • Sort creditors & debtors                                     │
│  • Match using two pointers                                     │
│  • Settlement: Amit pays Priya ₹20                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
   Output: [ [Rahul, Neha, 30], [Amit, Priya, 20] ]
   Total Transactions: 2 (minimized from potential 4)
```

| Step | Complexity | Technique |
|------|------------|-----------|
| Exact Match | O(N) | Hash Map lookup |
| Sorting | O(N log N) | JavaScript TimSort |
| Two-Pointer | O(N) | Greedy matching |
| **Total** | **O(N log N)** | Hybrid approach |

---

## Security Architecture

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| Authentication | JWT (Dual Token) | Access Token (15m) + Refresh Token (7d) with rotation |
| Password Storage | bcryptjs | Salted hashing before storage |
| Email Verification | Token-based | 15-minute expiry verification links |
| Transport | HTTPS / WSS | Encrypted data in transit |
| CORS | Whitelisted Origins | Prevents unauthorized frontend access |
| Gzip | compression middleware | ~70% response size reduction |

---

## Deployment Architecture

```
┌─────────────┐      ┌─────────────────────────────────────────────────┐
│  Developer  │──────│                   GitHub                        │
└─────────────┘ push └───────────────────────┬─────────────────────────┘
                                             │
                                       (Auto-Deploy)
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │     Render.com           │
                              │  (Node.js + React Build) │
                              └────────────┬─────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     ▼                     ▼                     ▼
            ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
            │  Express API │     │  React SPA   │     │ MongoDB Atlas│
            │   (Backend)  │     │  (Frontend)  │     │  (Database)  │
            │    :3001     │     │   (Static)   │     │   (Cloud)    │
            └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Frontend Architecture (React)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          App.js (Root)                               │
│              (AuthProvider → SocketProvider → ThemeProvider)         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Routes (react-router-dom)                       │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│   │    Dashboard    │  │     Groups      │  │    Expenses     │      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│   │     Profile     │  │   Auth Pages    │  │     About       │      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Services Layer                                │
│         /services/auth.js, groupServices.js, expenseServices.js      │
│                    (Axios API calls to backend)                      │
└──────────────────────────────────────────────────────────────────────┘
```
