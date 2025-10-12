import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { LogsService } from './logs/logs.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const httpAdapter = app.get(HttpAdapterHost);
  const logsService = app.get(LogsService);
  
  // Set global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter.httpAdapter, logsService));
  
  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Apply rate limiting is done via ThrottlerModule in the AppModule
  // The guard is registered there as a global provider
  
  // Get port from config with fallback
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
