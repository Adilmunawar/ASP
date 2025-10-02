const TrafficBot = require('./traffic-bot');
const config = require('./config');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: config.logging.file.error,
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: config.logging.file.combined 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

async function main() {
  try {
    logger.info('Starting traffic bot with configuration', {
      config: config.defaultSettings
    });

    const bot = new TrafficBot(config.defaultSettings);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT. Cleaning up...');
      await bot.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM. Cleaning up...');
      await bot.cleanup();
      process.exit(0);
    });

    // Start the bot
    await bot.start();

    // Log statistics periodically
    setInterval(() => {
      const stats = bot.getStats();
      logger.info('Traffic bot statistics', { stats });
    }, 60000); // Every minute

  } catch (error) {
    logger.error('Fatal error in traffic bot', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error in main', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  });
}

module.exports = {
  TrafficBot,
  startBot: main
};
