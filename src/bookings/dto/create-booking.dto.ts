//xport class CreateBookingDto {}
// src/modules/bookings/dto/create-booking.dto.ts
import { 
  IsUUID, 
  IsDateString, 
  IsNumber, 
  IsPositive, 
  IsOptional, 
  IsString,
  ValidateIf,
  IsNotEmpty,
  MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Vehicle ID to book',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  vehicle_id: string;

  @ApiProperty({
    description: 'Location ID for pickup',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({
    description: 'Booking start date and time',
    example: '2024-01-20T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  booking_date: string;

  @ApiProperty({
    description: 'Booking end date and time',
    example: '2024-01-25T15:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  return_date: string;

  @ApiPropertyOptional({
    description: 'Special requests or notes',
    example: 'Need child seat and GPS',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  special_requests?: string;

  @ApiPropertyOptional({
    description: 'Insurance option selected',
    example: 'premium',
    required: false,
  })
  @IsOptional()
  @IsString()
  insurance_option?: string;

  @ApiPropertyOptional({
    description: 'Additional driver information',
    example: 'John Doe, license: ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  additional_drivers?: string;
}