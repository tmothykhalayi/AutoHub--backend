
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingService } from './bookings.service';
import { BookingController } from './bookings.controller';
import { BookingReminderService } from './booking-reminder.service';
import { Booking } from './entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Vehicle]),
    ScheduleModule.forRoot(),
    MailModule
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingReminderService],
  exports: [BookingService],
})
export class BookingModule {}
