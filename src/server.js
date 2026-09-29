const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');
const { initializeChatSocket } = require('./sockets/chatSocket');
const { seedInitialData } = require('./utils/seed');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start Server
const startServer = async () => {
  await connectDB();

  // Run seed check (creates admin if none exists, populates default categories)
  try {
    await seedInitialData();
  } catch (err) {
    console.error('[Seed Notice]:', err.message);
  }

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Attach io instance to express app so routes can access it if needed
  app.set('io', io);

  // Initialize Socket.IO chat handlers
  initializeChatSocket(io);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Skilled Service Platform Backend running on port ${PORT}`);
    console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Swagger Docs: http://localhost:${PORT}/api/docs`);
    console.log(` Socket.IO   : Active and listening`);
    console.log(`====================================================`);
  });
};

startServer();
