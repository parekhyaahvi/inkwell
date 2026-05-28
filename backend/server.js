import app from './app.js';
import { prisma } from './services/db.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Verify Database Connection before booting port listeners
    console.log('[Server Init]: Verifying database connection...');
    await prisma.$connect();
    console.log('[Server Init]: Database connection verified successfully.');

    // 2. Bind port listeners
    app.listen(PORT, () => {
      console.log(`
🚀 InkWell Server Running Successfully!
---------------------------------------
🌐 Port:     http://localhost:${PORT}
🚀 Mode:     ${process.env.NODE_ENV || 'development'}
---------------------------------------
      `);
    });
  } catch (err) {
    console.error('❌ Server failed to start due to critical error:', err.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

startServer();
