import { PartialType } from '@nestjs/mapped-types';
import { CreateFleetManagementDto } from './create-fleet-management.dto';

export class UpdateFleetManagementDto extends PartialType(
  CreateFleetManagementDto,
) {}
