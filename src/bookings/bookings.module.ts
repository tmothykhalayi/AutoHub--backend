import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingService } from './bookings.service';
import { BookingController } from './bookings.controller';
import { BookingReminderService } from './booking-reminder.service';
import { CancellationPolicyService } from './cancellation-policy.service';
import { RefundService } from './refund.service';
import { LateReturnService } from './late-return.service';
import { VehicleInspectionService } from './vehicle-inspection.service';
import { InvoiceService } from './invoice.service';
import { Booking } from './entities/booking.entity';
import { CancellationPolicy } from './entities/cancellation-policy.entity';
import { Refund } from './entities/refund.entity';
import { LateReturnPenalty } from './entities/late-return-penalty.entity';
import { VehicleInspection } from './entities/vehicle-inspection.entity';
import { Invoice } from './entities/invoice.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { VehicleSpec } from '../vehicle-spec/entities/vehicle-spec.entity';
import { Branch } from '../branches/entities/branch.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      User,
      Vehicle,
      VehicleSpec,
      Branch,
      CancellationPolicy,
      Refund,
      LateReturnPenalty,
      VehicleInspection,
      Invoice,
    ]),
    ScheduleModule.forRoot(),
    MailModule,
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingReminderService,
    CancellationPolicyService,
    RefundService,
    LateReturnService,
    VehicleInspectionService,
    InvoiceService,
  ],
  exports: [
    BookingService,
    CancellationPolicyService,
    RefundService,
    LateReturnService,
    VehicleInspectionService,
    InvoiceService,
  ],
})
export class BookingModule {}
