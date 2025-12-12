/**
 * API Authentication Helper
 * 
 * Features:
 * - JWT Access Token (short-lived: 15 minutes)
 * - JWT Refresh Token (long-lived: 7 days)
 * - Token rotation for enhanced security
 */

var jwt = require('jsonwebtoken')
var logger = require('./logger')

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

/**
 * Generate short-lived access token
 * @param {string} user - User email
 * @returns {string} JWT access token
 */
exports.generateAccessToken = (user) => {
    return jwt.sign(
        { email: user, type: 'access' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generate long-lived refresh token
 * @param {string} user - User email
 * @returns {string} JWT refresh token
 */
exports.generateRefreshToken = (user) => {
    return jwt.sign(
        { email: user, type: 'refresh' },
        process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

/**
 * Generate both tokens (for login)
 * @param {string} user - User email
 * @returns {Object} { accessToken, refreshToken }
 */
exports.generateTokenPair = (user) => {
    return {
        accessToken: exports.generateAccessToken(user),
        refreshToken: exports.generateRefreshToken(user)
    };
}

/**
 * Validate access token middleware
 */
exports.validateToken = (req, res, next) => {
    // Bypass Authentication when DISABLE_API_AUTH is set in the env file for dev purpose only 
    if (process.env.DISABLE_API_AUTH == "true") {
        next()
    } else {
        // Checking if authorization is present in the header
        if (req.headers["authorization"] == null) {
            logger.error(`URL : ${req.originalUrl} | API Authentication Fail | message: Token not present`)
            res.status(403).json({
                message: "Token not present"
            })
        } else {
            const authHeader = req.headers["authorization"]
            const token = authHeader.split(" ")[1]

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    // Check if token expired (not invalid)
                    if (err.name === 'TokenExpiredError') {
                        logger.warn(`URL : ${req.originalUrl} | Token Expired`)
                        return res.status(401).json({
                            message: "Token expired",
                            code: "TOKEN_EXPIRED"
                        })
                    }
                    logger.error(`URL : ${req.originalUrl} | API Authentication Fail | message: Invalid Token`)
                    res.status(403).json({
                        message: "Invalid Token"
                    })
                } else {
                    // Support both old format (string) and new format (object with email)
                    req.user = typeof user === 'string' ? user : user.email
                    next()
                }
            })
        }
    }
}

/**
 * Validate refresh token
 * @param {string} token - Refresh token to validate
 * @returns {Object|null} Decoded user or null if invalid
 */
exports.validateRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET
        );
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch (err) {
        return null;
    }
}

/**
 * Validation function to check if the user is same as the token user
 */
exports.validateUser = (user, emailId) => {
    if (process.env.DISABLE_API_AUTH != "true" &&
        user != emailId
    ) {
        var err = new Error("Access Denied")
        err.status = 403
        throw err
    } else
        return true
}

// Export expiry times for reference
exports.ACCESS_TOKEN_EXPIRY = ACCESS_TOKEN_EXPIRY;
exports.REFRESH_TOKEN_EXPIRY = REFRESH_TOKEN_EXPIRY;