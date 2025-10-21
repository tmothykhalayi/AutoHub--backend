// create-fleetManagement.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFleetManagementDto {
  @ApiProperty({ description: 'Name of the fleet manager', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  managerName: string;

  @ApiPropertyOptional({ description: 'Maintenance schedule for the fleet', example: 'Monthly on the first Monday' })
  @IsOptional()
  @IsString()
  maintenanceSchedule?: string;

  @ApiPropertyOptional({ description: 'Contact information for the fleet manager', example: 'john.doe@autohub.com, +1-234-567-8900' })
  @IsOptional()
  @IsString()
  contactInfo?: string;
}
