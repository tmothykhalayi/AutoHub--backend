// src/modules/locations/dto/search-locations.dto.ts
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { PaginationDto } from '../../users/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchLocationsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by location name or address',
    example: 'downtown',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by state',
    example: 'NY',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by country',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Search within radius (in kilometers)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  radius?: number;

  @ApiPropertyOptional({
    description: 'Latitude for radius search',
    example: 40.7128,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for radius search',
    example: -74.006,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}