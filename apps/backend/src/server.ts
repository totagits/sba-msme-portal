import { createApp } from './app';
import { config } from './config';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║          SBA MSMEs Online Database and Reporting Portal      ║
║          Bureau of Small Business Administration             ║
║          Ministry of Commerce and Industry, Liberia          ║
╚══════════════════════════════════════════════════════════════╝

  🚀 Server running at: http://localhost:${config.port}
  📚 API Docs:          http://localhost:${config.port}/api/docs
  🏥 Health Check:      http://localhost:${config.port}/health
  🌍 Environment:       ${config.env}
  📅 Started:           ${new Date().toISOString()}
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
