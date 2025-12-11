/**
 * Currency Conversion Helper
 * 
 * Provides exchange rates and conversion utilities for multi-currency support.
 * Rates are based on approximate values - for production, integrate a forex API.
 */

// Base currency: USD
// Rates as of approximate values (update periodically or integrate API)
const EXCHANGE_RATES = {
    USD: 1.0,
    INR: 83.50,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    AUD: 1.53,
    CAD: 1.36,
    CHF: 0.88,
    CNY: 7.24,
    SGD: 1.34
};

// Currency symbols for display
const CURRENCY_SYMBOLS = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    SGD: 'S$'
};

// Supported currencies list
const SUPPORTED_CURRENCIES = Object.keys(EXCHANGE_RATES);

/**
 * Get exchange rate between two currencies
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @returns {number} Exchange rate
 */
function getRate(from, to) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (!EXCHANGE_RATES[from]) {
        throw new Error(`Unsupported currency: ${from}`);
    }
    if (!EXCHANGE_RATES[to]) {
        throw new Error(`Unsupported currency: ${to}`);
    }

    // Convert via USD as base
    const fromToUsd = 1 / EXCHANGE_RATES[from];
    const usdToTarget = EXCHANGE_RATES[to];

    return round(fromToUsd * usdToTarget);
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @returns {number} Converted amount
 */
function convert(amount, from, to) {
    if (from === to) return round(amount);

    const rate = getRate(from, to);
    return round(amount * rate);
}

/**
 * Convert all balances in a split to a target currency
 * @param {Object} balances - Object with {userEmail: {amount, currency}}
 * @param {string} targetCurrency - Currency to convert all to
 * @returns {Object} Normalized balances in target currency
 */
function normalizeBalances(balances, targetCurrency) {
    const normalized = {};

    for (const [user, data] of Object.entries(balances)) {
        if (typeof data === 'object' && data.currency) {
            normalized[user] = convert(data.amount, data.currency, targetCurrency);
        } else {
            // Assume already in target currency
            normalized[user] = round(data);
        }
    }

    return normalized;
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount string
 */
function formatCurrency(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
    return `${symbol}${round(amount).toFixed(2)}`;
}

/**
 * Round to 2 decimal places
 */
function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Check if currency is supported
 * @param {string} currency - Currency code to check
 * @returns {boolean}
 */
function isSupported(currency) {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

module.exports = {
    convert,
    getRate,
    normalizeBalances,
    formatCurrency,
    isSupported,
    SUPPORTED_CURRENCIES,
    CURRENCY_SYMBOLS,
    EXCHANGE_RATES
};
