require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSockets } = require('./sockets/socketHandler');
const seedInitialData = require('./utils/seed');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Socket.IO events and WebRTC signaling
initializeSockets(io);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    server.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`🚀 SecureChat Server running on port ${PORT}`);
      console.log(`🌐 REST API: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Security: Helmet, CORS, Rate Limiters ACTIVE`);
      console.log(`⚡ Real-Time: Socket.IO & WebRTC Signaling READY`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
