// src/modules/locations/locations.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../users/dto/pagination.dto';
import { SearchLocationsDto } from './dto/search-locations.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new location (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Location created successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Location with this name already exists',
  })
  async create(@Body() createLocationDto: CreateLocationDto): Promise<LocationResponseDto> {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Locations retrieved successfully',
    type: [LocationResponseDto],
  })
  async findAll(
    @Query() paginationDto?: PaginationDto,
  ): Promise<{ data: LocationResponseDto[]; pagination: any }> {
    return this.locationsService.findAll(paginationDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search locations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Locations retrieved successfully',
    type: [LocationResponseDto],
  })
  async searchLocations(
    @Query() searchDto: SearchLocationsDto,
  ): Promise<{ data: LocationResponseDto[]; pagination: any }> {
    return this.locationsService.searchLocations(searchDto);
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Find nearest locations' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearest locations retrieved successfully',
    type: [LocationResponseDto],
  })
  async findNearestLocations(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance: number = 50,
  ): Promise<LocationResponseDto[]> {
    return this.locationsService.findNearestLocations(latitude, longitude, maxDistance);
  }

  @Get('stats/count')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get location count statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getLocationsCount(): Promise<{ total: number; active: number; with_coordinates: number }> {
    return this.locationsService.countLocations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location retrieved successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LocationResponseDto> {
    return this.locationsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get location statistics (Admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getLocationStats(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.locationsService.getLocationStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update location (Admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Location updated successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete location (Admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Location deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Location not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Location has assigned vehicles or active bookings',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.locationsService.remove(id);
  }

  @Post('bulk-update')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk update locations (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed',
  })
  async bulkUpdateLocations(
    @Body() body: { locationIds: string[]; updateData: Partial<UpdateLocationDto> },
  ): Promise<{ success: string[]; failed: { id: string; reason: string }[] }> {
    return this.locationsService.bulkUpdateLocations(body.locationIds, body.updateData);
  }
}