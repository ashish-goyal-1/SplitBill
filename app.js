var dotenv = require('dotenv')
var express = require('express')
var http = require('http')
var compression = require('compression')
var logger = require('./helper/logger')
var requestLogger = require('./helper/requestLogger')
var apiAuth = require('./helper/apiAuthentication')
var cors = require('cors')
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

app.use(cors())
app.use(express.json())
app.use(requestLogger)

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
