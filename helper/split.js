/**
 * Settlement Algorithm - Simplify group debts into minimal transactions
 * 
 * Features:
 * - Floating-point safe with consistent rounding
 * - Tolerance-based matching (±$0.01)
 * - Iterative greedy loop (no recursion)
 * - Zero-value settlement filtering
 * - Optional Minimum Cash Flow optimizer
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
 * Check if two values are equal within tolerance
 */
function isEqual(a, b) {
    return Math.abs(a - b) < TOLERANCE;
}

/**
 * Greedy Algorithm - Fast and good enough for most cases
 * Time Complexity: O(n²) where n = number of members
 * 
 * @param {Object} transactions - Object with {userEmail: balance}
 *                                Positive = is owed, Negative = owes
 * @returns {Array} Array of [from, to, amount] settlements
 */
function simplifyDebts(transactions) {
    const splits = [];
    const balances = new Map(Object.entries(transactions).map(
        ([key, val]) => [key, round(val)]
    ));

    // STEP 1: Settle exact opposite balances first (tolerance-based)
    // This optimization reduces the number of transactions when
    // two people have exactly opposite balances
    const settled = new Set();
    const keys = Array.from(balances.keys());

    for (let i = 0; i < keys.length; i++) {
        if (settled.has(keys[i])) continue;
        const bal1 = balances.get(keys[i]);
        if (isZero(bal1)) continue;

        for (let j = i + 1; j < keys.length; j++) {
            if (settled.has(keys[j])) continue;
            const bal2 = balances.get(keys[j]);

            // Check if they are opposite (within tolerance)
            if (isEqual(bal2, -bal1)) {
                if (bal1 > 0) {
                    // keys[j] pays keys[i]
                    splits.push([keys[j], keys[i], round(bal1)]);
                } else {
                    // keys[i] pays keys[j]
                    splits.push([keys[i], keys[j], round(bal2)]);
                }
                balances.set(keys[i], 0);
                balances.set(keys[j], 0);
                settled.add(keys[i]);
                settled.add(keys[j]);
                break;
            }
        }
    }

    // STEP 2: Iterative greedy loop - match max creditor with max debtor
    // Continue until all balances are settled
    while (true) {
        // Find max creditor (most positive balance)
        let maxCreditor = null;
        let maxCredit = 0;

        // Find max debtor (most negative balance)
        let maxDebtor = null;
        let maxDebt = 0;

        for (const [person, balance] of balances.entries()) {
            if (balance > maxCredit) {
                maxCredit = balance;
                maxCreditor = person;
            }
            if (balance < maxDebt) {
                maxDebt = balance;
                maxDebtor = person;
            }
        }

        // Exit if no more settlements needed
        if (maxCreditor === null || maxDebtor === null) break;
        if (isZero(maxCredit) || isZero(maxDebt)) break;

        // Settle the minimum of what's owed and what's due
        const settleAmount = round(Math.min(maxCredit, -maxDebt));

        if (settleAmount > 0) {
            // Record: debtor pays creditor
            splits.push([maxDebtor, maxCreditor, settleAmount]);

            // Update balances
            balances.set(maxCreditor, round(balances.get(maxCreditor) - settleAmount));
            balances.set(maxDebtor, round(balances.get(maxDebtor) + settleAmount));
        } else {
            // No more meaningful settlements possible
            break;
        }
    }

    // STEP 3: Filter out any zero-value or negligible settlements
    return splits.filter(([from, to, amount]) => amount >= TOLERANCE);
}

/**
 * Minimum Cash Flow Algorithm - Optimal solution for advanced users
 * Uses a sorted two-pointer approach to minimize transactions
 * Time Complexity: O(n log n)
 * 
 * @param {Object} transactions - Object with {userEmail: balance}
 * @returns {Array} Array of [from, to, amount] settlements
 */
function simplifyDebtsMinCashFlow(transactions) {
    const splits = [];

    // Separate into creditors (owed money) and debtors (owe money)
    const creditors = [];
    const debtors = [];

    for (const [person, balance] of Object.entries(transactions)) {
        const rounded = round(balance);
        if (rounded > TOLERANCE) {
            creditors.push({ person, amount: rounded });
        } else if (rounded < -TOLERANCE) {
            debtors.push({ person, amount: -rounded }); // Store as positive
        }
    }

    // Sort both arrays by amount (descending) for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Two-pointer approach to match creditors with debtors
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
        const credit = creditors[i];
        const debt = debtors[j];

        // Settle the minimum of the two amounts
        const settleAmount = round(Math.min(credit.amount, debt.amount));

        if (settleAmount >= TOLERANCE) {
            splits.push([debt.person, credit.person, settleAmount]);

            credit.amount = round(credit.amount - settleAmount);
            debt.amount = round(debt.amount - settleAmount);
        }

        // Move pointer if balance is settled
        if (credit.amount < TOLERANCE) i++;
        if (debt.amount < TOLERANCE) j++;
    }

    return splits;
}

// Export both algorithms
module.exports = simplifyDebts;
module.exports.simplifyDebts = simplifyDebts;
module.exports.simplifyDebtsMinCashFlow = simplifyDebtsMinCashFlow;