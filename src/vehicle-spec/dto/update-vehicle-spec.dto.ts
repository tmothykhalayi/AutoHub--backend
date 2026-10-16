import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleSpecDto } from './create-vehicle-spec.dto';

export class UpdateVehicleSpecDto extends PartialType(CreateVehicleSpecDto) {}
