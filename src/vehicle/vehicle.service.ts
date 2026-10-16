import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleSpec } from '../vehicle-spec/entities/vehicle-spec.entity';
import { Branch } from '../branches/entities/branch.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,

    @InjectRepository(VehicleSpec)
    private vehicleSpecRepository: Repository<VehicleSpec>,

    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const {
      licensePlate,
      registrationNumber,
      specId,
      branchId,
      isAvailable,
      status,
      mileage,
    } = createVehicleDto;

    const spec = await this.vehicleSpecRepository.findOne({
      where: { id: specId },
    });
    if (!spec) throw new NotFoundException('Vehicle specification not found');

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    // Create a new vehicle with all required properties
    const newVehicle = new Vehicle();
    newVehicle.licensePlate = licensePlate;
    newVehicle.registrationNumber = registrationNumber;
    newVehicle.spec = spec;
    newVehicle.branch = branch;
    newVehicle.isAvailable = isAvailable ?? true;

    if (status) {
      newVehicle.status = status;
    }

    if (mileage !== undefined) {
      newVehicle.mileage = mileage;
    }

    // Save and return the saved vehicle
    return await this.vehicleRepository.save(newVehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({ relations: ['spec', 'branch'] });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['spec', 'branch'],
    });
    if (!vehicle)
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (updateVehicleDto.specId) {
      const spec = await this.vehicleSpecRepository.findOne({
        where: { id: updateVehicleDto.specId },
      });
      if (!spec) throw new NotFoundException('Vehicle specification not found');
      vehicle.spec = spec;
    }

    if (updateVehicleDto.branchId) {
      const branch = await this.branchRepository.findOne({
        where: { id: updateVehicleDto.branchId },
      });
      if (!branch) throw new NotFoundException('Branch not found');
      vehicle.branch = branch;
    }

    if (updateVehicleDto.registrationNumber !== undefined) {
      vehicle.registrationNumber = updateVehicleDto.registrationNumber;
    }

    if (updateVehicleDto.isAvailable !== undefined) {
      vehicle.isAvailable = updateVehicleDto.isAvailable;
    }

    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }
}
