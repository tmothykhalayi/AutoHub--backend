// src/modules/locations/locations.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual, In, Not, IsNull } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { SearchLocationsDto } from './dto/search-locations.dto';
import { PaginationDto } from '../users/dto/pagination.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
  ) {}

  public mapToResponseDto(location: Location): LocationResponseDto {
    const { bookings, vehicles, ...locationData } = location;
    return new LocationResponseDto({
      ...locationData,
      vehicle_count: vehicles?.length || 0,
      booking_count: bookings?.length || 0,
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async create(createLocationDto: CreateLocationDto): Promise<LocationResponseDto> {
    try {
      // Check if location with same name already exists
      const existingLocation = await this.locationsRepository.findOne({
        where: { name: createLocationDto.name },
      });

      if (existingLocation) {
        throw new ConflictException('Location with this name already exists');
      }

      const location = this.locationsRepository.create(createLocationDto);
      const savedLocation = await this.locationsRepository.save(location);
      
      return this.mapToResponseDto(savedLocation);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create location');
    }
  }

  async findAll(paginationDto?: PaginationDto): Promise<{
    data: LocationResponseDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [locations, total] = await this.locationsRepository.findAndCount({
        relations: ['vehicles', 'bookings'],
        skip,
        take: limit,
        order: { name: 'ASC' },
      });

      return {
        data: locations.map(location => this.mapToResponseDto(location)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch locations');
    }
  }

  async findOne(id: string): Promise<LocationResponseDto> {
    try {
      const location = await this.locationsRepository.findOne({
        where: { location_id: id },
        relations: ['vehicles', 'bookings'],
      });

      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      return this.mapToResponseDto(location);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch location');
    }
  }

  async update(id: string, updateLocationDto: UpdateLocationDto): Promise<LocationResponseDto> {
    try {
      const location = await this.locationsRepository.findOne({
        where: { location_id: id },
      });

      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      // Check if name is being changed to an existing one
      if (updateLocationDto.name && updateLocationDto.name !== location.name) {
        const existingLocation = await this.locationsRepository.findOne({
          where: { name: updateLocationDto.name },
        });

        if (existingLocation) {
          throw new ConflictException('Location with this name already exists');
        }
      }

      Object.assign(location, updateLocationDto);
      const updatedLocation = await this.locationsRepository.save(location);
      
      return this.mapToResponseDto(updatedLocation);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update location');
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.locationsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const location = await queryRunner.manager.findOne(Location, {
        where: { location_id: id },
        relations: ['vehicles', 'bookings'],
      });

      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      // Check if location has active vehicles
      if (location.vehicles && location.vehicles.length > 0) {
        throw new BadRequestException('Cannot delete location with assigned vehicles');
      }

      // Check if location has active bookings
      const activeBookings = location.bookings?.filter(
        booking => booking.booking_status === 'confirmed' || booking.booking_status === 'active'
      );

      if (activeBookings && activeBookings.length > 0) {
        throw new BadRequestException('Cannot delete location with active bookings');
      }

      await queryRunner.manager.delete(Location, id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete location');
    } finally {
      await queryRunner.release();
    }
  }

  async searchLocations(searchDto: SearchLocationsDto): Promise<{
    data: LocationResponseDto[];
    pagination: any;
  }> {
    try {
      const { query, city, state, country, is_active, radius, latitude, longitude, page = 1, limit = 10 } = searchDto;
      const skip = (page - 1) * limit;

      let locations: Location[];
      let total: number;

      if (radius && latitude && longitude) {
        // Radius-based search
        const allLocations = await this.locationsRepository.find({
          where: { is_active: is_active !== undefined ? is_active : undefined },
          relations: ['vehicles', 'bookings'],
        });

        // Filter locations within radius
        locations = allLocations.filter(location => {
          if (location.latitude && location.longitude) {
            const distance = this.calculateDistance(
              latitude,
              longitude,
              location.latitude,
              location.longitude
            );
            return distance <= radius;
          }
          return false;
        });

        total = locations.length;
        locations = locations.slice(skip, skip + limit);
      } else {
        // Regular search
        const where: any = {};

        if (query) {
          where.name = Like(`%${query}%`);
        }

        if (city) {
          where.city = Like(`%${city}%`);
        }

        if (state) {
          where.state = Like(`%${state}%`);
        }

        if (country) {
          where.country = Like(`%${country}%`);
        }

        if (is_active !== undefined) {
          where.is_active = is_active;
        }

        [locations, total] = await this.locationsRepository.findAndCount({
          where,
          relations: ['vehicles', 'bookings'],
          skip,
          take: limit,
          order: { name: 'ASC' },
        });
      }

      return {
        data: locations.map(location => this.mapToResponseDto(location)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search locations');
    }
  }

  async findNearestLocations(latitude: number, longitude: number, maxDistance: number = 50): Promise<LocationResponseDto[]> {
    try {
      const allLocations = await this.locationsRepository.find({
        where: { is_active: true },
        relations: ['vehicles', 'bookings'],
      });

      const locationsWithDistance = allLocations
        .filter(location => location.latitude && location.longitude)
        .map(location => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            location.latitude,
            location.longitude
          );
          return { location, distance };
        })
        .filter(item => item.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(item => this.mapToResponseDto(item.location));

      return locationsWithDistance;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find nearest locations');
    }
  }

  async getLocationStats(locationId: string): Promise<any> {
    try {
      const location = await this.locationsRepository.findOne({
        where: { location_id: locationId },
        relations: ['vehicles', 'bookings'],
      });

      if (!location) {
        throw new NotFoundException(`Location with ID ${locationId} not found`);
      }

      const bookings = location.bookings || [];
      const vehicles = location.vehicles || [];

      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(b => 
        ['confirmed', 'active'].includes(b.booking_status)
      ).length;
      const completedBookings = bookings.filter(b => 
        b.booking_status === 'completed'
      ).length;

      // TODO: Implement availability checking logic based on current bookings
      const availableVehicles = vehicles.length; // Placeholder - all vehicles considered available for now
      const occupiedVehicles = 0; // Placeholder

      const totalRevenue = bookings
        .filter(b => b.booking_status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.total_amount.toString()), 0);

      return {
        location_id: locationId,
        stats: {
          total_bookings: totalBookings,
          active_bookings: activeBookings,
          completed_bookings: completedBookings,
          total_vehicles: vehicles.length,
          available_vehicles: availableVehicles,
          occupied_vehicles: occupiedVehicles,
          total_revenue: totalRevenue,
          avg_booking_value: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get location statistics');
    }
  }

  async bulkUpdateLocations(locationIds: string[], updateData: Partial<UpdateLocationDto>): Promise<{
    success: string[];
    failed: { id: string; reason: string }[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const locationId of locationIds) {
      try {
        const location = await this.locationsRepository.findOne({
          where: { location_id: locationId },
        });

        if (!location) {
          results.failed.push({ id: locationId, reason: 'Location not found' });
          continue;
        }

        Object.assign(location, updateData);
        await this.locationsRepository.save(location);
        results.success.push(locationId);
      } catch (error) {
        results.failed.push({ id: locationId, reason: error.message });
      }
    }

    return results;
  }

  async countLocations(): Promise<{ total: number; active: number; with_coordinates: number }> {
    try {
      const [total, active, withCoordinates] = await Promise.all([
        this.locationsRepository.count(),
        this.locationsRepository.count({ where: { is_active: true } }),
        this.locationsRepository.count({ 
          where: { 
            latitude: Not(IsNull()),
            longitude: Not(IsNull())
          } 
        }),
      ]);

      return { total, active, with_coordinates: withCoordinates };
    } catch (error) {
      throw new InternalServerErrorException('Failed to count locations');
    }
  }
}