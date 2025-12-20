// create-branch.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  IsLatitude,
  IsLongitude,
  Matches,
  Min,
  Max,
  IsString,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Unique branch code (auto-generated if not provided)',
    example: 'NYC01',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Branch code cannot exceed 10 characters' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Branch code can only contain uppercase letters and numbers',
  })
  branchCode?: string;

  @ApiProperty({
    description: 'Branch address',
    example: '123 Main Street, Downtown',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address: string;

  @ApiProperty({
    description: 'City where branch is located',
    example: 'New York',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'City name must be at least 2 characters long' })
  @MaxLength(50, { message: 'City name cannot exceed 50 characters' })
  city: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'State cannot exceed 50 characters' })
  state?: string;

  @ApiPropertyOptional({
    description: 'ZIP or postal code',
    example: '10001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code cannot exceed 20 characters' })
  postalCode?: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Country name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Country name cannot exceed 50 characters' })
  country: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
  })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @IsLatitude({ message: 'Invalid latitude value' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @IsLongitude({ message: 'Invalid longitude value' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude: number;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1234567890',
  })
  @IsString()
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, {
    message:
      'Invalid phone number format. Use international format: +1234567890',
  })
  phone: string;

  @ApiPropertyOptional({
    description:
      'Operating hours in format "HH:MM-HH:MM" or "HH:MM-HH:MM,HH:MM-HH:MM"',
    example: '09:00-18:00',
    pattern:
      '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9](,([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9])*$',
  })
  @IsOptional()
  @IsString()
  @Matches(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9](,([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9])*$/,
    {
      message:
        'Operating hours must be in format "HH:MM-HH:MM" or "HH:MM-HH:MM,HH:MM-HH:MM" for multiple ranges',
    },
  )
  operatingHours?: string;

  @ApiPropertyOptional({
    description: 'Branch description',
    example: 'Our flagship downtown location with premium vehicles',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the branch is active (default: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum vehicle capacity of the branch',
    example: 50,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Branch manager name',
    example: 'John Smith',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Manager name cannot exceed 100 characters' })
  manager?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
