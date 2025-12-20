// create-vehicleSpec.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleSpecDto {
  @ApiProperty({ description: 'Make of the vehicle', example: 'Toyota' })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({ description: 'Name of the vehicle model', example: 'Corolla' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Weekly rate for the vehicle',
    example: 350,
  })
  weeklyRate?: number;

  @ApiPropertyOptional({
    description: 'Daily rate for the vehicle',
    example: 70,
  })
  dailyRate?: number;

  @ApiProperty({ description: 'Model of the vehicle', example: 'Sedan' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiProperty({
    description: 'Manufacturing year of the vehicle',
    example: 2022,
  })
  @IsNumber()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({
    description: 'Fuel type of the vehicle',
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    example: 'petrol',
  })
  @IsString()
  @IsIn(['petrol', 'diesel', 'electric', 'hybrid'])
  fuelType: string;

  @ApiPropertyOptional({ description: 'Engine size in liters', example: 2.0 })
  @IsNumber()
  @Min(0.5)
  @Max(10)
  @IsOptional()
  engineSize?: number;

  @ApiProperty({ description: 'Number of seats in the vehicle', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  seats: number;

  @ApiProperty({
    description: 'Transmission type of the vehicle',
    enum: ['manual', 'automatic'],
    example: 'automatic',
  })
  @IsString()
  @IsIn(['manual', 'automatic'])
  transmission: string;
}
