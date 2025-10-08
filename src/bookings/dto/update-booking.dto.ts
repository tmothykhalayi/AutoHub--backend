
import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsDateString, 
  IsString, 
  MaxLength,
  IsEnum
} from 'class-validator';
import { CreateBookingDto } from './create-booking.dto';
import { BookingStatus } from '../entities/booking.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['vehicle_id'] as const)
) {
  @ApiPropertyOptional({
    description: 'Booking status',
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  booking_status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Admin notes for the booking',
    example: 'Customer requested early pickup',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  admin_notes?: string;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Customer changed plans',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellation_reason?: string;
}