
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleSpecService } from './vehicle-spec.service';
import { VehicleSpecController } from './vehicle-spec.controller';
import { VehicleSpec } from '../vehicle-spec/entities/vehicle-spec.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleSpec])],
  controllers: [VehicleSpecController],
  providers: [VehicleSpecService],
  exports: [VehicleSpecService],
})
export class VehicleSpecModule {}
