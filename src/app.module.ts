import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { VehicleSpecModule } from './vehicle-spec/vehicle-spec.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { FleetManagementModule } from './fleet-management/fleet-management.module';
import { SupportModule } from './support/support.module';
import { BranchesModule } from './branches/branches.module';

@Module({
  imports: [AuthModule, UsersModule, VehicleModule, VehicleSpecModule, BookingsModule, PaymentsModule, FleetManagementModule, SupportModule, BranchesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
