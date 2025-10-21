
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FleetManagementService } from './fleet-management.service';
import { CreateFleetManagementDto } from './dto/create-fleet-management.dto';
import { UpdateFleetManagementDto } from './dto/update-fleet-management.dto';

@ApiTags('fleet-management')
@ApiBearerAuth()
@Controller('fleet-management')
export class FleetManagementController {
  constructor(private readonly fleetManagementService: FleetManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create fleet management entry', description: 'Create a new fleet management record' })
  @ApiBody({ type: CreateFleetManagementDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Fleet management record successfully created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data' })
  create(@Body() createFleetManagementDto: CreateFleetManagementDto) {
    return this.fleetManagementService.create(createFleetManagementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fleet management records', description: 'Retrieve all fleet management records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all fleet management records' })
  findAll() {
    return this.fleetManagementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fleet record by ID', description: 'Retrieve a specific fleet management record by ID' })
  @ApiParam({ name: 'id', description: 'Fleet record ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the fleet management record' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fleet management record not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fleetManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fleet record', description: 'Update a fleet management record by ID' })
  @ApiParam({ name: 'id', description: 'Fleet record ID' })
  @ApiBody({ type: UpdateFleetManagementDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fleet management record successfully updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fleet management record not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFleetManagementDto: UpdateFleetManagementDto,
  ) {
    return this.fleetManagementService.update(id, updateFleetManagementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fleet record', description: 'Delete a fleet management record by ID' })
  @ApiParam({ name: 'id', description: 'Fleet record ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fleet management record successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Fleet management record not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fleetManagementService.remove(id);
  }
}
