// src/modules/locations/dto/location-response.dto.ts
import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class LocationResponseDto {
  @ApiProperty({
    description: 'Location unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  location_id: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Rental Center',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Full address',
    example: '123 Main Street, Downtown, City',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1234567890',
  })
  @Expose()
  contact_phone: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
    required: false,
  })
  @Expose()
  city?: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
    required: false,
  })
  @Expose()
  state?: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '10001',
    required: false,
  })
  @Expose()
  zip_code?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @Expose()
  country?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    required: false,
  })
  @Expose()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
    required: false,
  })
  @Expose()
  longitude?: number;

  @ApiProperty({
    description: 'Opening time',
    example: '08:00:00',
    required: false,
  })
  @Expose()
  opening_time?: string;

  @ApiProperty({
    description: 'Closing time',
    example: '18:00:00',
    required: false,
  })
  @Expose()
  closing_time?: string;

  @ApiProperty({
    description: 'Location description',
    example: 'Main downtown rental center with full services',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Whether the location is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Number of vehicles at this location',
    example: 15,
  })
  @Expose()
  @Transform(({ obj }) => obj.vehicles?.length || 0)
  vehicle_count: number;

  @ApiProperty({
    description: 'Number of bookings for this location',
    example: 45,
  })
  @Expose()
  @Transform(({ obj }) => obj.bookings?.length || 0)
  booking_count: number;

  @ApiProperty({
    description: 'Location creation timestamp',
    example: '2024-01-10T08:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Location last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updated_at: Date;

  constructor(partial: Partial<LocationResponseDto>) {
    Object.assign(this, partial);
  }
}