/**
 * 🚀 HYBRID DEBT SETTLEMENT ALGORITHM
 * 
 * Combines O(N) Exact-Match Heuristic with O(N log N) Sorted Greedy
 * Total Complexity: O(N log N)
 * 
 * Features:
 * - Floating-point safe with consistent rounding
 * - Tolerance-based matching (±$0.01)
 * - Hash-based exact match optimization (O(N))
 * - Sorted two-pointer greedy (O(N log N))
 * - Zero-value settlement filtering
 */

const TOLERANCE = 0.01;

/**
 * Round to 2 decimal places to avoid floating-point errors
 */
function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Check if a value is effectively zero within tolerance
 */
function isZero(value) {
    return Math.abs(value) < TOLERANCE;
}

/**
 * HYBRID ALGORITHM - O(N log N)
 * 
 * Step 1: O(N) Hash-based exact match finding
 *         - Uses a Map to find pairs with opposite balances instantly
 *         - Eliminates obvious pairs (A owes $50, B is owed $50)
 * 
 * Step 2: O(N log N) Sorted two-pointer greedy
 *         - Sorts remaining creditors and debtors by amount
 *         - Uses two-pointer technique for optimal matching
 * 
 * @param {Object} transactions - Object with {userEmail: balance}
 *                                Positive = is owed, Negative = owes
 * @returns {Array} Array of [from, to, amount] settlements
 */
function simplifyDebts(transactions) {
    const splits = [];

    // Convert to array of [person, balance] for processing
    let balances = Object.entries(transactions)
        .map(([person, amount]) => ({ person, amount: round(amount) }))
        .filter(b => !isZero(b.amount));

    // --- STEP 1: Exact Match Optimization O(N) ---
    // Uses a Map to find pairs with opposite balances in one pass
    // This is the "heuristic" that makes socially cleaner settlements
    const amountToIndex = new Map();
    const settled = new Set();

    for (let i = 0; i < balances.length; i++) {
        if (settled.has(i)) continue;
        const { person, amount } = balances[i];
        const oppositeKey = round(-amount).toString();

        // Check if we have seen the exact opposite amount
        if (amountToIndex.has(oppositeKey)) {
            const j = amountToIndex.get(oppositeKey);
            if (!settled.has(j)) {
                const other = balances[j];
                // Found a perfect pair! Settle them immediately
                const settleAmount = Math.abs(amount);

                if (amount < 0) {
                    // Current person is debtor (-), other is creditor (+)
                    splits.push([person, other.person, settleAmount]);
                } else {
                    // Current person is creditor (+), other is debtor (-)
                    splits.push([other.person, person, settleAmount]);
                }

                // Mark both as settled
                settled.add(i);
                settled.add(j);
                amountToIndex.delete(oppositeKey);
                continue;
            }
        }

        // No match found yet, store for future matching
        amountToIndex.set(round(amount).toString(), i);
    }

    // Filter out settled balances for Step 2
    balances = balances.filter((_, i) => !settled.has(i));

    // --- STEP 2: Sorted Greedy Algorithm O(N log N) ---
    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors = balances.filter(b => b.amount > 0);
    const debtors = balances.filter(b => b.amount < 0)
        .map(b => ({ person: b.person, amount: -b.amount })); // Store debt as positive

    // Sort descending by amount (largest first) - O(N log N)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Two-pointer matching - O(N)
    let i = 0; // Creditor pointer
    let j = 0; // Debtor pointer

    while (i < creditors.length && j < debtors.length) {
        const credit = creditors[i];
        const debt = debtors[j];

        // Settle the minimum of the two amounts
        const settleAmount = round(Math.min(credit.amount, debt.amount));

        if (settleAmount >= TOLERANCE) {
            splits.push([debt.person, credit.person, settleAmount]);

            // Update internal balances
            credit.amount = round(credit.amount - settleAmount);
            debt.amount = round(debt.amount - settleAmount);
        }

        // Move pointers when balance is fully settled
        if (credit.amount < TOLERANCE) i++;
        if (debt.amount < TOLERANCE) j++;
    }

    return splits;
}

/**
 * LEGACY: Minimum Cash Flow Algorithm
 * Pure sorted two-pointer without the exact-match heuristic
 * Time Complexity: O(N log N)
 * 
 * Kept for backward compatibility
 */
function simplifyDebtsMinCashFlow(transactions) {
    const splits = [];

    // Separate into creditors and debtors
    const creditors = [];
    const debtors = [];

    for (const [person, balance] of Object.entries(transactions)) {
        const rounded = round(balance);
        if (rounded > TOLERANCE) {
            creditors.push({ person, amount: rounded });
        } else if (rounded < -TOLERANCE) {
            debtors.push({ person, amount: -rounded });
        }
    }

    // Sort descending
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Two-pointer matching
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
        const credit = creditors[i];
        const debt = debtors[j];

        const settleAmount = round(Math.min(credit.amount, debt.amount));

        if (settleAmount >= TOLERANCE) {
            splits.push([debt.person, credit.person, settleAmount]);
            credit.amount = round(credit.amount - settleAmount);
            debt.amount = round(debt.amount - settleAmount);
        }

        if (credit.amount < TOLERANCE) i++;
        if (debt.amount < TOLERANCE) j++;
    }

    return splits;
}

// Export both algorithms
module.exports = simplifyDebts;
module.exports.simplifyDebts = simplifyDebts;
module.exports.simplifyDebtsMinCashFlow = simplifyDebtsMinCashFlow;