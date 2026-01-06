/**
 * Validation Council API Server
 * Main entry point
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    logger.log('Starting Validation Council API...');
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`Port: ${process.env.PORT || 4000}`);

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Security
    app.use(helmet());

    // CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    });

    // API Versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger documentation (enabled in non-production)
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Validation Council API')
        .setDescription('API for the Validation Council startup idea validation platform')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('validations', 'Validation endpoints')
        .addTag('agents', 'Agent management endpoints')
        .addTag('users', 'User management endpoints')
        .addTag('evidence', 'Evidence and citation endpoints')
        .addTag('outcomes', 'Outcome tracking endpoints')
        .addTag('audit', 'Audit trail endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
    }

    // Start server
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');

    logger.log(`Validation Council API running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    // Don't exit - allow healthcheck to fail gracefully
    // process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

bootstrap();
