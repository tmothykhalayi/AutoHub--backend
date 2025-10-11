

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { VehicleSpecService } from './vehicle-spec.service';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';

@Controller('vehicle-specs')
export class VehicleSpecController {
  constructor(private readonly vehicleSpecService: VehicleSpecService) {}

  @Post()
  create(@Body() createDto: CreateVehicleSpecDto) {
    return this.vehicleSpecService.create(createDto);
  }

  @Get()
  findAll() {
    return this.vehicleSpecService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleSpecService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateVehicleSpecDto) {
    return this.vehicleSpecService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleSpecService.remove(id);
  }
}
