import { Module } from '@nestjs/common';
import { FleetManagementService } from './fleet-management.service';
import { FleetManagementController } from './fleet-management.controller';

@Module({
  controllers: [FleetManagementController],
  providers: [FleetManagementService],
})
export class FleetManagementModule {}
