import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User, Booking]),
    forwardRef(() => UsersModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
