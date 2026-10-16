import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({
    summary: 'Create vehicle',
    description: 'Create a new vehicle in the system',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vehicle data',
  })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all vehicles',
    description: 'Retrieve all vehicles in the system',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all vehicles' })
  findAll() {
    return this.vehicleService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get vehicle by ID',
    description: 'Retrieve a specific vehicle by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the vehicle' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update vehicle',
    description: 'Update a vehicle by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vehicle data',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete vehicle',
    description: 'Delete a vehicle by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.remove(id);
  }
}
