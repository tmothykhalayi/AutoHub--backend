// create-vehicle.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsBoolean ,IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @IsNotEmpty()
  @IsNumber()
  specId: number;
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  
  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  


  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean; 



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

