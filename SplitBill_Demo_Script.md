# SplitBill Demo - Complete Recording Script

## Pre-Recording Setup

**Browsers:**
- Chrome → User 1 (goyalashish809@gmail.com) - Already logged in
- Edge → User 2 (22cs3018@rgipt.ac.in) - Already logged in

**Screen Layout:**
- Side-by-side OR switch between browsers
- Record full screen at 1920x1080

**Server:** `npm run dev` running

---

## FULL SCRIPT (7-8 minutes)

---

### 0:00 - 0:20 | INTRODUCTION

**Screen:** Chrome - Login page

**Speak:**
> "Hi, I'm Ashish Goyal. This is SplitBill - a full-stack expense sharing application that I've built from scratch.
> 
> **For the tech stack, I chose:**
> - React with Material-UI for a responsive, component-based frontend
> - Node.js with Express for fast, non-blocking backend
> - MongoDB because expense data is document-oriented and benefits from flexible schema
> - Socket.IO for real-time collaboration between group members"

**Action:** Click Login (already logged in, goes to dashboard)

---

### 0:20 - 0:50 | DASHBOARD OVERVIEW

**Screen:** Chrome - Dashboard

**Speak:**
> "After login, users land on this dashboard. It shows a quick overview of their groups, recent transactions, and pending invites."

**Action:** Scroll to show the analytics section

**Speak:**
> "Here's the **analytics section** - visual charts showing spending patterns, category-wise breakdown, and monthly expense trends. This helps users understand their spending habits at a glance."

**Action:** Point cursor at the charts/graphs

**Speak:**
> "Users can quickly create a new group or add expenses from the quick action buttons."

**Action:** Point to quick action buttons

---

### 0:50 - 1:30 | CREATE GROUP

**Screen:** Chrome - Create Group page

**Speak:**
> "Let me create a new group. I'll call it 'Goa Trip' - a common use case for expense sharing."

**Action:** Click "Create Group" in sidebar

**Fill in (speak while typing):**
> "Group name: Goa Trip...
> Description: December vacation expenses...
> Category: Travel...
> Currency: Indian Rupee"

**Speak:**
> "Now I have an existing group 'nandi trip' with members. Let me show the expense features there."

**Action:** Click on existing group "nandi trip"

---

### 1:30 - 2:30 | ADD EXPENSE - EQUAL SPLIT

**Screen:** Chrome - Group View → Add Expense

**Speak:**
> "Now let's add an expense. This is the core functionality of the assignment."

**Action:** Click "Add Expense" button

**Speak (while filling):**
> "Expense name: Hotel Booking...
> Amount: 6000 rupees...
> Paid by: Me...
> 
> For split type, I'll choose **Equal Split** first. This is the most common type."

**Action:** Select Equal split, show the auto-calculated amounts

**Speak:**
> "Notice how the system automatically divides 6000 among all 3 members - each person's share is 2000 rupees. I designed it to auto-calculate to prevent manual errors."

**Action:** Submit expense

---

### 2:30 - 3:15 | ADD EXPENSE - PERCENTAGE SPLIT

**Screen:** Chrome - Add another expense

**Speak:**
> "Now let's try **Percentage Split** - useful when people want to contribute different proportions."

**Action:** Click Add Expense again

**Fill in (speak while typing):**
> "Expense name: Dinner...
> Amount: 3000 rupees...
> Split type: Percentage"

**Speak:**
> "I'll assign 50% to one member, 30% to another, and 20% to the third."

**Action:** Enter percentages

**Speak:**
> "The system validates that percentages add up to exactly 100%. If they don't, it shows an error. This server-side validation ensures data integrity."

**Action:** Submit

---

### 3:15 - 3:45 | ADD EXPENSE - EXACT AMOUNT SPLIT

**Screen:** Chrome - Add another expense

**Speak:**
> "Finally, **Exact Amount Split** - for when each person consumed different amounts."

**Action:** Click Add Expense

**Fill in:**
> "Expense name: Shopping...
> Amount: 5000 rupees...
> Split type: Exact Amount"

**Speak:**
> "I'll enter exact amounts: 2500, 1500, and 1000 for each member.
> 
> The system validates that these exact amounts sum to the total expense of 5000."

**Action:** Submit

---

### 3:45 - 5:00 | ALL TABS WALKTHROUGH (IMPORTANT!)

**Screen:** Chrome - Group Expenses tab

**Speak:**
> "Now let me walk through all the tabs. This is the core of the assignment - **tracking and balances**."

**Action:** Show "Group Expenses" tab (should be default)

**Speak:**
> "First, the **Group Expenses** tab - this lists all shared expenses in the group. You can see:
> - Each expense with its name, amount, and who paid
> - The split type used (Equal, Percentage, or Exact)
> - Date and category
> 
> Users can edit or delete their own expenses here."

**Action:** Point to an expense card, show the details

---

**Action:** Click on "Group Balance" tab

**Speak:**
> "Next, the **Group Balance** tab shows the overall group perspective:
> - Total Group Spend - ₹2,390 in this case
> - Settlement cards showing exactly who owes whom
> - And this **bar chart** visualizing each member's balance at a glance"

**Action:** Point to the settlement cards and bar chart

**Speak:**
> "**A key design decision** - I implemented a **Hybrid O(N log N) debt simplification algorithm**.
> 
> The problem was: if A owes B, B owes C, and C owes A, we'd have circular debt with 3 transactions.
> 
> My solution uses two steps:
> - **Step 1: O(N) Hash-based exact match** - first, I find debts that can cancel exactly
> - **Step 2: O(N log N) Sorted two-pointer greedy** - then I sort remaining balances and match largest creditors with largest debtors
> 
> This minimizes the number of transactions to settle up."

**Action:** Click on "My Balance" tab

**Speak:**
> "Now the **My Balance** tab - this is the personal view. It shows:
> - **Your Net Balance** - whether you're overall in credit or debt
> - **You Owe** section - listing people you need to pay
> - **Owed to You** section - listing people who owe you money
> 
> This design separates **group-level** and **personal-level** views because users care about both. The group owner needs the full picture, while individual members mainly care about their own balance."

**Action:** Point to the "Your Net Balance" card

**Action:** Click on "Activity" tab

**Speak:**
> "Finally, the **Activity** tab - this is an audit log showing all actions taken in the group. Every expense added, edited, or deleted is recorded here for transparency."

---

### 5:00 - 5:15 | SETTLEMENT

**Screen:** Chrome - Settlement section

**Speak:**
> "When someone wants to pay their dues, we record a settlement."

**Action:** Click on a settlement option or show the settlement area

**Speak:**
> "After settlement, balances are updated immediately. Both parties see the updated status."

---

### 5:15 - 5:45 | REAL-TIME DEMO (MULTI-BROWSER)

**Screen:** SWITCH TO EDGE (User 2)

**Speak:**
> "Now let me show **real-time updates**. I chose Socket.IO because it handles WebSocket fallbacks automatically and supports room-based messaging - perfect for group collaboration."

**Action:** Show Edge browser with User 2's dashboard

**Speak:**
> "This is User 2's view. Watch what happens when User 1 adds an expense."

**Action:** Arrange browsers side-by-side if possible, OR switch back to Chrome

**Screen:** Chrome (User 1) - Add a quick expense

**Speak:**
> "User 1 adds a new expense..."

**Action:** Add a small expense quickly

**Screen:** Edge (User 2)

**Speak:**
> "And User 2's screen updates automatically - no refresh needed! This is Socket.IO real-time synchronization."

---

### 5:45 - 6:30 | INVITE SYSTEM DEMO

**Screen:** Chrome (User 1) - Show notification icon

**Speak:**
> "Now let me explain the **invite system**. This was an interesting design challenge."

**Action:** Click on a group, show the Add Member button

**Speak:**
> "When a group owner adds a member by email, the system handles two scenarios:
> 
> **Case 1: Registered User** → Creates a pending invite notification
> 
> **Case 2: Unregistered User** → Sends an **email invitation** with a link to join the app, and stores the invite. When they register with that email, the pending invite is already waiting for them.
> 
> This ensures no one is left out, whether they have an account or not."

**Action:** Switch to Edge (User 2), show notification bell

**Speak:**
> "The invited user sees a notification badge. Let me show the pending invites."

**Action:** Click notification bell or pending invites section

**Speak:**
> "They can accept or decline. On accept, they're immediately added to the group and can see all shared expenses. This is all handled through a clean REST API."

---

### 6:30 - 7:00 | BONUS FEATURES

**Screen:** Chrome - Sidebar

**Speak:**
> "A few bonus features I implemented:"

**Action:** Toggle dark mode

**Speak:**
> "Dark mode support..."

**Action:** Show email reminder button if visible

**Speak:**
> "Email notifications for payment reminders..."

**Action:** Point to activity tab

**Speak:**
> "And an activity log for transparency."

---

### 7:00 - 7:30 | CONCLUSION

**Screen:** Chrome - Dashboard or Group view

**Speak:**
> "To summarize, this application covers all the assignment requirements:
> - Group creation ✓
> - All three split types: Equal, Percentage, and Exact ✓
> - Balance tracking with debt simplification ✓
> - Settlement recording ✓
> 
> Plus additional features like real-time updates, email notifications, and a responsive UI.
> 
> Thank you for watching!"

---

## KEY PHRASES TO REMEMBER

Use these naturally during the demo:

- "I **designed** this to..."
- "The **validation ensures** that..."
- "I implemented a **debt simplification algorithm**..."
- "This **minimizes** the number of transactions..."
- "The system **automatically calculates**..."
- "**Real-time synchronization** using Socket.IO..."

---

## IF SOMETHING GOES WRONG

| Problem | What to Say |
|---------|-------------|
| Page loads slowly | "The app has loading states for better UX..." |
| Error appears | "Let me refresh that..." (just continue) |
| Email doesn't work | "Email is configured for production, works locally" |

---

## FINAL CHECKLIST

Before recording:
- [ ] Both browsers logged in with test accounts
- [ ] Server running (`npm run dev`)
- [ ] Existing group with 2-3 members ready
- [ ] Dark mode OFF initially (toggle it later)
- [ ] Practice once without recording
- [ ] Check microphone is working

**Good luck! 🚀**
