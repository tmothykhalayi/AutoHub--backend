// src/modules/bookings/dto/booking-response.dto.ts
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { BookingStatus } from '../entities/booking.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { VehicleResponseDto } from '../../vehicles/dto/vehicle-response.dto';
import { LocationResponseDto } from '../../locations/dto/location-response.dto';

@Exclude()
export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking unique identifier',
    example: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
  })
  @Expose()
  booking_id: string;

  @ApiProperty({
    description: 'User ID who made the booking',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  user_id: string;

  @ApiProperty({
    description: 'Vehicle ID that was booked',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  })
  @Expose()
  vehicle_id: string;

  @ApiProperty({
    description: 'Location ID for pickup',
    example: 'd4e5f6g7-h8i9-0123-defg-456789012345',
  })
  @Expose()
  location_id: string;

  @ApiProperty({
    description: 'Booking start date and time',
    example: '2024-01-20T10:00:00.000Z',
  })
  @Expose()
  booking_date: Date;

  @ApiProperty({
    description: 'Booking end date and time',
    example: '2024-01-25T15:00:00.000Z',
  })
  @Expose()
  return_date: Date;

  @ApiProperty({
    description: 'Total amount for the booking',
    example: 450.75,
  })
  @Expose()
  total_amount: number;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @Expose()
  booking_status: BookingStatus;

  @ApiProperty({
    description: 'Special requests',
    example: 'Need child seat and GPS',
    required: false,
  })
  @Expose()
  special_requests?: string;

  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Customer changed plans',
    required: false,
  })
  @Expose()
  cancellation_reason?: string;

  @ApiProperty({
    description: 'Admin notes',
    example: 'Customer requested early pickup',
    required: false,
  })
  @Expose()
  admin_notes?: string;

  @ApiProperty({
    description: 'Booking creation timestamp',
    example: '2024-01-15T08:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Booking last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updated_at: Date;

  @ApiProperty({
    description: 'User details',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  @ApiProperty({
    description: 'Vehicle details',
    type: VehicleResponseDto,
  })
  @Expose()
  @Type(() => VehicleResponseDto)
  vehicle?: VehicleResponseDto;

  @ApiProperty({
    description: 'Location details',
    type: LocationResponseDto,
  })
  @Expose()
  @Type(() => LocationResponseDto)
  location?: LocationResponseDto;

  @ApiProperty({
    description: 'Payment status information',
    example: { status: 'completed', amount: 450.75 },
    required: false,
  })
  @Expose()
  @Transform(({ obj }) => obj.payment ? {
    status: obj.payment.payment_status,
    amount: obj.payment.amount,
    method: obj.payment.payment_method
  } : null)
  payment_info?: any;

  constructor(partial: Partial<BookingResponseDto>) {
    Object.assign(this, partial);
  }
}