// create-vehicle.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'License plate of the vehicle',
    example: 'ABC-1234',
  })
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @ApiProperty({ description: 'ID of the vehicle specification', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  specId: number;

  @ApiProperty({
    description: 'Registration number of the vehicle',
    example: 'REG12345678',
  })
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  @ApiProperty({
    description: 'ID of the branch where the vehicle is located',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @ApiPropertyOptional({
    description: 'Whether the vehicle is available for booking',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'ID of the fleet this vehicle belongs to',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  fleetId?: number;

  @ApiPropertyOptional({
    description: 'Current status of the vehicle',
    example: 'active',
    enum: ['active', 'maintenance', 'repair', 'retired'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Current mileage of the vehicle in kilometers',
    example: 15000,
  })
  @IsOptional()
  @IsNumber()
  mileage?: number;
}
