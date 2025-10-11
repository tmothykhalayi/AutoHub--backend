// create-fleetManagement.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFleetManagementDto {
  @IsNotEmpty()
  @IsString()
  managerName: string;

  @IsOptional()
  @IsString()
  maintenanceSchedule?: string;

  @IsOptional()
  @IsString()
  contactInfo?: string;
}
