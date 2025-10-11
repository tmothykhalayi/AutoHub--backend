// create-vehicleSpec.dto.ts
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateVehicleSpecDto {
  @IsNotEmpty()
  @IsString()
  make: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsInt()
  year: number;

  @IsNotEmpty()
  @IsInt()
  seats: number;

  @IsNotEmpty()
  @IsString()
  transmission: string;

  @IsNotEmpty()
  @IsString()
  fuelType: string;
}
