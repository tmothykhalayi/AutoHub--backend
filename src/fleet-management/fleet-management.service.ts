
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FleetManagement } from './entities/fleet-management.entity';
import { CreateFleetManagementDto } from './dto/create-fleet-management.dto';
import { UpdateFleetManagementDto } from './dto/update-fleet-management.dto';

@Injectable()
export class FleetManagementService {
  constructor(
    @InjectRepository(FleetManagement)
    private fleetManagementRepository: Repository<FleetManagement>,
  ) {}

  async create(createFleetManagementDto: CreateFleetManagementDto): Promise<FleetManagement> {
    const fleetMgmt = this.fleetManagementRepository.create(createFleetManagementDto);
    return this.fleetManagementRepository.save(fleetMgmt);
  }

  async findAll(): Promise<FleetManagement[]> {
    return this.fleetManagementRepository.find();
  }

  async findOne(id: number): Promise<FleetManagement> {
    const fleetMgmt = await this.fleetManagementRepository.findOne({ where: { id } });
    if (!fleetMgmt) throw new NotFoundException(`FleetManagement with id ${id} not found`);
    return fleetMgmt;
  }

  async update(id: number, updateFleetManagementDto: UpdateFleetManagementDto): Promise<FleetManagement> {
    const fleetMgmt = await this.findOne(id);
    Object.assign(fleetMgmt, updateFleetManagementDto);
    return this.fleetManagementRepository.save(fleetMgmt);
  }

  async remove(id: number): Promise<void> {
    const fleetMgmt = await this.findOne(id);
    await this.fleetManagementRepository.remove(fleetMgmt);
  }
}
