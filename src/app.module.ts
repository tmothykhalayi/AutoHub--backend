import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { VehicleSpecModule } from './vehicle-spec/vehicle-spec.module';
import {BookingModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { FleetManagementModule } from './fleet-management/fleet-management.module';
import { SupportModule } from './support/support.module';
import { BranchModule } from './branches/branches.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './logger.middleware';
import { LogsModule } from './logs/logs.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { AtGuard } from './auth/guards';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available throughout the application
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // seconds
          limit: 30, // max number of requests within ttl
        },
      ],
    }),
    DatabaseModule, // Add DatabaseModule first so TypeORM is initialized before other modules
    AuthModule,
    UsersModule,
    VehicleModule, 
    VehicleSpecModule,
    BookingModule, 
    PaymentsModule,
    FleetManagementModule, 
    SupportModule,
    BranchModule,
    LogsModule,
    MailModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
