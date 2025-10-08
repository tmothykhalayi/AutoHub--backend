import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleResponseDto } from './dto/vehicle-response.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = this.vehiclesRepository.create(createVehicleDto);
    const savedVehicle = await this.vehiclesRepository.save(vehicle);
    return new VehicleResponseDto(savedVehicle);
  }

  async findAll(): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehiclesRepository.find({
      relations: ['category', 'location'],
    });
    return vehicles.map(vehicle => new VehicleResponseDto(vehicle));
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: ['category', 'location', 'bookings'],
    });
    
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    
    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, updateVehicleDto);
    const updatedVehicle = await this.vehiclesRepository.save(vehicle);
    return new VehicleResponseDto(updatedVehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehiclesRepository.remove(vehicle);
  }
}
