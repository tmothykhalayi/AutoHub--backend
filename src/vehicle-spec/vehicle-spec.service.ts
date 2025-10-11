import { Injectable } from '@nestjs/common';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';

@Injectable()
export class VehicleSpecService {
  create(createVehicleSpecDto: CreateVehicleSpecDto) {
    return 'This action adds a new vehicleSpec';
  }

  findAll() {
    return `This action returns all vehicleSpec`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicleSpec`;
  }

  update(id: number, updateVehicleSpecDto: UpdateVehicleSpecDto) {
    return `This action updates a #${id} vehicleSpec`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicleSpec`;
  }
}
