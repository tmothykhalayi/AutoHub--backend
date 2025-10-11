import { Module } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, UsersModule, VehicleModule, 
    VehicleSpecModule, BookingModule, 
    PaymentsModule, FleetManagementModule, 
    SupportModule, BranchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
