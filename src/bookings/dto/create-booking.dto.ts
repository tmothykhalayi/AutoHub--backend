// create-booking.dto.ts
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID of the user making the booking', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'ID of the vehicle to book', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  vehicleId: number;

  @ApiProperty({ description: 'Start date and time of the booking in ISO format', example: '2025-11-01T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date and time of the booking in ISO format', example: '2025-11-05T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Status of the booking', example: 'confirmed', enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Location where the vehicle will be picked up', example: 'Main Branch - Manhattan Downtown' })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional({ description: 'Location where the vehicle will be dropped off', example: 'Main Branch - Manhattan Downtown' })
  @IsOptional()
  @IsString()
  dropoffLocation?: string;
}

