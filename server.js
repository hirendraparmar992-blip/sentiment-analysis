const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

const { router: commentsRouter, calculateStats, memoryComments } = require('./routes/comments');
const { router: authRouter } = require('./routes/auth');
const policiesRouter = require('./routes/policies');
const { authenticateToken, COOKIE_NAME } = require('./middleware/auth');
const Comment = require('./models/Comment');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

function isAllowedOrigin(origin) {
  return !origin ||
    allowedOrigins.includes(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
  }
});

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || '';
  const sessionCookie = cookieHeader.split(';').map(value => value.trim())
    .find(value => value.startsWith(`${COOKIE_NAME}=`));
  const token = sessionCookie ? sessionCookie.slice(COOKIE_NAME.length + 1) : '';
  const user = authenticateToken(token);

  if (!user) return next(new Error('Authentication required'));
  socket.user = user;
  next();
});

// Attach io to express app so routes can access it via req.app.get('io')
app.set('io', io);

// Middleware
app.use(cors({ origin: (origin, callback) => callback(null, isAllowedOrigin(origin)), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/comments', commentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/policies', policiesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected (using in-memory fallback)',
    geminiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  });
});

// Fallback route for SPA client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Socket.io Connection Management
io.on('connection', async (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Send initial stats immediately to the newly connected client
  try {
    let stats;
    if (mongoose.connection.readyState === 1) {
      const allComments = await Comment.find({}, 'sentiment topic emotion priority');
      stats = calculateStats(allComments);
    } else {
      stats = calculateStats(memoryComments);
    }
    socket.emit('stats-update', stats);
  } catch (err) {
    console.error('[Socket.io] Error preparing initial stats for client:', err.message);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentiment_analysis';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 4000
  })
  .then(() => {
    console.log('✓ Successfully connected to MongoDB database:', MONGODB_URI);
  })
  .catch((err) => {
    console.warn('! Notice: MongoDB connection failed (' + err.message + ').');
    console.warn('! Operating in high-performance in-memory fallback mode. All features remain fully functional.');
  });

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  E-Consultation Sentiment Analysis Service Running`);
  console.log(`  Server Port:      http://localhost:${PORT}`);
  console.log(`  Static Frontend:  ${frontendDir}`);
  console.log(`  Realtime Events:  Socket.io enabled on port ${PORT}`);
  console.log(`=======================================================`);
});

module.exports = { app, server, io };
