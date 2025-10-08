import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class VehicleResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  make: string;

  @ApiProperty()
  @Expose()
  model: string;

  @ApiProperty()
  @Expose()
  rentalRate: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  category?: {
    id: string;
    name: string;
  };

  @ApiProperty({ required: false })
  @Expose()
  location?: {
    id: string;
    name: string;
    address: string;
  };

  @ApiProperty({ required: false })
  @Expose()
  bookings?: any[];

  constructor(partial: Partial<VehicleResponseDto>) {
    Object.assign(this, partial);
  }
}