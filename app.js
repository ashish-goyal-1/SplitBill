var dotenv = require('dotenv')
var express = require('express')
var http = require('http')
var compression = require('compression')
var logger = require('./helper/logger')
var requestLogger = require('./helper/requestLogger')
var apiAuth = require('./helper/apiAuthentication')
var cors = require('cors')
var mongoose = require('mongoose')
var helmet = require('helmet')
var rateLimit = require('express-rate-limit')
var socketHelper = require('./helper/socketHelper')

const path = require('path');
dotenv.config()

var usersRouter = require('./routes/userRouter')
var gorupRouter = require('./routes/groupRouter')
var expenseRouter = require('./routes/expenseRouter')
var notificationRouter = require('./routes/notificationRouter')
var analyticsRouter = require('./routes/analyticsRouter')

var app = express()

// Create HTTP server for Socket.io
var server = http.createServer(app)

// Initialize Socket.io for real-time communication
socketHelper.initializeSocket(server)

// Gzip compression - reduces response size by ~70%
app.use(compression())

// Security Headers
app.use(helmet())

// General Rate Limiting (All API routes)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Stricter Rate Limiting for Auth/Registration
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per window (as requested)
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many registration attempts from this IP, please try again after an hour'
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/users/v1/register', authLimiter);
app.use('/api/users/v1/login', authLimiter);

app.use(requestLogger)
app.use(cors())
app.use(express.json())

// Health check endpoint - used by UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).send('OK')
})

app.use('/api/users', usersRouter)
app.use('/api/group', apiAuth.validateToken, gorupRouter)
app.use('/api/expense', apiAuth.validateToken, expenseRouter)
app.use('/api/notification', apiAuth.validateToken, notificationRouter)
app.use('/api/analytics', apiAuth.validateToken, analyticsRouter)

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

//To detect and log invalid api hits 
app.all('*', (req, res) => {
    logger.error(`[Invalid Route] ${req.originalUrl}`)
    res.status(404).json({
        status: 'fail',
        message: 'Invalid path'
    })
})

// Global Express Error Middleware
app.use((err, req, res, next) => {
    logger.error(`[Express Error] URL: ${req.originalUrl} | Message: ${err.message} | Stack: ${err.stack}`);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR'
    });
});

const port = process.env.PORT || 3001

// Use server.listen instead of app.listen for Socket.io
server.listen(port, (err) => {
    console.log(`Server started in PORT | ${port}`)
    console.log(`Socket.io ready for real-time connections`)
    logger.info(`Server started in PORT | ${port}`)

    // Initialize email scheduler
    const scheduler = require('./helper/scheduler');
    scheduler.initScheduler();
})

// Set server timeout to 30 seconds to prevent hanging connections
server.setTimeout(30000);

// Graceful shutdown function
const gracefulShutdown = (signal) => {
    logger.info(`${signal} signal received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
        logger.info('HTTP server closed.');

        // Close DB connection
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed.');
            process.exit(0);
        });
    });

    // Forced shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Global error handlers for process stability
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} | Reason: ${reason}`)
})

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message} | Stack: ${error.stack}`)
    // For uncaught exceptions, we should ideally shut down gracefully
    // but keep it alive for now to avoid persistent 503s on Render
})
