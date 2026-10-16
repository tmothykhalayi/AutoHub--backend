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
import { VehicleSpecService } from './vehicle-spec.service';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('vehicle-specs')
@ApiBearerAuth()
@Controller('vehicle-specs')
export class VehicleSpecController {
  constructor(private readonly vehicleSpecService: VehicleSpecService) {}

  @Post()
  @ApiOperation({
    summary: 'Create vehicle spec',
    description: 'Create a new vehicle specification',
  })
  @ApiBody({ type: CreateVehicleSpecDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle spec successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vehicle spec data',
  })
  create(@Body() createDto: CreateVehicleSpecDto) {
    return this.vehicleSpecService.create(createDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all vehicle specs',
    description: 'Retrieve all vehicle specifications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all vehicle specs',
  })
  findAll() {
    return this.vehicleSpecService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get vehicle spec by ID',
    description: 'Retrieve a specific vehicle specification by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle spec ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the vehicle spec',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle spec not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleSpecService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update vehicle spec',
    description: 'Update a vehicle specification by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle spec ID' })
  @ApiBody({ type: UpdateVehicleSpecDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle spec successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle spec not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vehicle spec data',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVehicleSpecDto,
  ) {
    return this.vehicleSpecService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete vehicle spec',
    description: 'Delete a vehicle specification by its ID',
  })
  @ApiParam({ name: 'id', description: 'Vehicle spec ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle spec successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle spec not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleSpecService.remove(id);
  }
}
