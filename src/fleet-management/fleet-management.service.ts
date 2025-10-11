import { Injectable } from '@nestjs/common';
import { CreateFleetManagementDto } from './dto/create-fleet-management.dto';
import { UpdateFleetManagementDto } from './dto/update-fleet-management.dto';

@Injectable()
export class FleetManagementService {
  create(createFleetManagementDto: CreateFleetManagementDto) {
    return 'This action adds a new fleetManagement';
  }

  findAll() {
    return `This action returns all fleetManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fleetManagement`;
  }

  update(id: number, updateFleetManagementDto: UpdateFleetManagementDto) {
    return `This action updates a #${id} fleetManagement`;
  }

  remove(id: number) {
    return `This action removes a #${id} fleetManagement`;
  }
}
