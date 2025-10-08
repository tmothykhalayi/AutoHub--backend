import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { LocationsModule } from './locations/locations.module';
import { SupportModule } from './support/support.module';
import { FleetModule } from './fleet/fleet.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { VehicleCategoryModule } from './vehicle-category/vehicle-category.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from  './logger.middleware';
import { AllExceptionsFilter } from './http-exception.filter';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    LogsModule,
    UsersModule, 
    VehiclesModule, 
    BookingsModule, 
    PaymentsModule, 
    LocationsModule, 
    SupportModule, 
    FleetModule, 
    MailModule, 
    AuthModule, 
    VehicleCategoryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
