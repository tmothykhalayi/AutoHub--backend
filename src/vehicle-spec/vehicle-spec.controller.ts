import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehicleSpecService } from './vehicle-spec.service';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';

@Controller('vehicle-spec')
export class VehicleSpecController {
  constructor(private readonly vehicleSpecService: VehicleSpecService) {}

  @Post()
  create(@Body() createVehicleSpecDto: CreateVehicleSpecDto) {
    return this.vehicleSpecService.create(createVehicleSpecDto);
  }

  @Get()
  findAll() {
    return this.vehicleSpecService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleSpecService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleSpecDto: UpdateVehicleSpecDto) {
    return this.vehicleSpecService.update(+id, updateVehicleSpecDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleSpecService.remove(+id);
  }
}
