
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { FleetManagementService } from './fleet-management.service';
import { CreateFleetManagementDto } from './dto/create-fleet-management.dto';
import { UpdateFleetManagementDto } from './dto/update-fleet-management.dto';

@Controller('fleet-management')
export class FleetManagementController {
  constructor(private readonly fleetManagementService: FleetManagementService) {}

  @Post()
  create(@Body() createFleetManagementDto: CreateFleetManagementDto) {
    return this.fleetManagementService.create(createFleetManagementDto);
  }

  @Get()
  findAll() {
    return this.fleetManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fleetManagementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFleetManagementDto: UpdateFleetManagementDto,
  ) {
    return this.fleetManagementService.update(id, updateFleetManagementDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fleetManagementService.remove(id);
  }
}
