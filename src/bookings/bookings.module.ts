// src/modules/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { LocationsModule } from '../locations/locations.module';
import { PaymentsModule } from '../payments/payments.module';
import {MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    forwardRef(() => UsersModule),
    forwardRef(() => VehiclesModule),
    LocationsModule,
    PaymentsModule,
    MailModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}