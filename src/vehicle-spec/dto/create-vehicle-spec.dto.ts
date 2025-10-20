// create-vehicleSpec.dto.ts
import { IsInt, IsNotEmpty, IsString, MinLength, MaxLength, IsNumber, Min, Max, IsIn, IsOptional } from 'class-validator';

export class CreateVehicleSpecDto {
  @IsNotEmpty()
  @IsString()
  make: string;
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
weeklyRate?: number;
dailyRate?: number;
  @IsString()
  @MinLength(1)
  model: string;

  @IsNumber()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsString()
  @IsIn(['petrol', 'diesel', 'electric', 'hybrid'])
  fuelType: string;

  @IsNumber()
  @Min(0.5)
  @Max(10)
  @IsOptional()
  engineSize?: number;

  @IsNumber()
  @Min(1)
  @Max(20)
  seats: number;

  @IsString()
  @IsIn(['manual', 'automatic'])
  transmission: string;

}
