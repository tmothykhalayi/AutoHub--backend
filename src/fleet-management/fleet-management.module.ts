import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetManagementService } from './fleet-management.service';
import { FleetManagementController } from './fleet-management.controller';
import { FleetManagement } from './entities/fleet-management.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FleetManagement])],
  controllers: [FleetManagementController],
  providers: [FleetManagementService],
  exports: [FleetManagementService],
})
export class FleetManagementModule {}
