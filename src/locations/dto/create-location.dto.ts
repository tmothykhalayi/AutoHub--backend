// src/modules/locations/dto/create-location.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Rental Center',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Full address of the location',
    example: '123 Main Street, Downtown, City',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  contact_phone: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP or postal code',
    example: '10001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  zip_code?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: 40.7128,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: -74.006,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Opening time in HH:MM:SS format',
    example: '08:00:00',
    required: false,
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Opening time must be in HH:MM:SS format',
  })
  opening_time?: string;

  @ApiPropertyOptional({
    description: 'Closing time in HH:MM:SS format',
    example: '18:00:00',
    required: false,
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Closing time must be in HH:MM:SS format',
  })
  closing_time?: string;

  @ApiPropertyOptional({
    description: 'Location description',
    example: 'Main downtown rental center with full services',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the location is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}