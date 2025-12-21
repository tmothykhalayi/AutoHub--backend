import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetManagementService } from './fleet-management.service';
import { FleetManagementController } from './fleet-management.controller';
import { FleetAnalyticsService } from './fleet-analytics.service';
import { FleetManagement } from './entities/fleet-management.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FleetManagement, Vehicle, Booking])],
  controllers: [FleetManagementController],
  providers: [FleetManagementService, FleetAnalyticsService],
  exports: [FleetManagementService, FleetAnalyticsService],
})
export class FleetManagementModule {}
