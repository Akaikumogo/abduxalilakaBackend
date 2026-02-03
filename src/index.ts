import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { startTelegramPolling } from './services/telegram.js';

async function main() {
  // Connect to MongoDB
  await connectDB();

  const app = express();

  // Middleware - Allow all origins
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API routes
  app.use('/api', routes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  // Start server
  app.listen(config.port, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API URL: http://localhost:${config.port}/api`);
    console.log('='.repeat(50));

    // Start Telegram polling
    if (config.telegram.botToken) {
      startTelegramPolling();
    }
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
