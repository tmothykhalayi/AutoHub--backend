// create-vehicle.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @IsNotEmpty()
  @IsNumber()
  specId: number;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsOptional()
  @IsNumber()
  fleetId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  mileage?: number;
}

