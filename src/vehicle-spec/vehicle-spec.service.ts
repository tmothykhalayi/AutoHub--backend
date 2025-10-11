
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleSpec } from './entities/vehicle-spec.entity';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';

@Injectable()
export class VehicleSpecService {
  constructor(
    @InjectRepository(VehicleSpec)
    private vehicleSpecRepository: Repository<VehicleSpec>,
  ) {}

  async create(createDto: CreateVehicleSpecDto): Promise<VehicleSpec> {
    const vehicleSpec = this.vehicleSpecRepository.create(createDto);
    return this.vehicleSpecRepository.save(vehicleSpec);
  }

  async findAll(): Promise<VehicleSpec[]> {
    return this.vehicleSpecRepository.find({ relations: ['vehicles'] });
  }

  async findOne(id: number): Promise<VehicleSpec> {
    const spec = await this.vehicleSpecRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });
    if (!spec) throw new NotFoundException(`Vehicle specification with id ${id} not found`);
    return spec;
  }

  async update(id: number, updateDto: UpdateVehicleSpecDto): Promise<VehicleSpec> {
    const spec = await this.findOne(id);
    Object.assign(spec, updateDto);
    return this.vehicleSpecRepository.save(spec);
  }

  async remove(id: number): Promise<void> {
    const spec = await this.findOne(id);
    await this.vehicleSpecRepository.remove(spec);
  }
}
