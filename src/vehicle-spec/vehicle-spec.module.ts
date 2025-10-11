import { Module } from '@nestjs/common';
import { VehicleSpecService } from './vehicle-spec.service';
import { VehicleSpecController } from './vehicle-spec.controller';

@Module({
  controllers: [VehicleSpecController],
  providers: [VehicleSpecService],
})
export class VehicleSpecModule {}
