import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { LogsService } from './logs/logs.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const httpAdapter = app.get(HttpAdapterHost);
  const logsService = app.get(LogsService);

  // Set global exception filter
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapter.httpAdapter, logsService),
  );

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Apply global class serializer interceptor to exclude password from responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Apply rate limiting is done via ThrottlerModule in the AppModule
  // The guard is registered there as a global provider

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AutoHub API')
    .setDescription(
      `
      AutoHub is a comprehensive vehicle rental service API that allows customers to browse, book, and manage car rentals across multiple branch locations.
      
      The system provides:
      - User authentication and account management
      - Vehicle browsing and filtering by specifications
      - Booking creation, modification, and cancellation
      - Branch location management and availability checks
      - Payment processing and invoice generation
      - Customer support ticketing system
      - Fleet management for administrators
      - Email notifications for bookings, payments, and support interactions
      
      This API powers both customer-facing applications and administrative tools for managing the car rental business.
    `,
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('bookings', 'Booking management endpoints')
    .addTag('vehicles', 'Vehicle management endpoints')
    .addTag('vehicle-specs', 'Vehicle specifications endpoints')
    .addTag('branches', 'Branch management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('support', 'Customer support endpoints')
    .addTag('fleet-management', 'Fleet management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Get port from config with fallback
  const port = process.env.PORT || configService.get<string>('PORT') || '3000';
  await app.listen(parseInt(port, 10), '0.0.0.0');

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
