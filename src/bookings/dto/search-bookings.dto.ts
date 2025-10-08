// src/modules/bookings/dto/search-bookings.dto.ts
import { 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsDateString,
  IsUUID
} from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';
import { PaginationDto } from '../../users/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchBookingsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by user name or email',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString()
  userQuery?: string;

  @ApiPropertyOptional({
    description: 'Search by vehicle model or manufacturer',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  vehicleQuery?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by vehicle ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking date (after)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  booking_date_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking date (before)',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  booking_date_before?: string;

  @ApiPropertyOptional({
    description: 'Filter by return date (after)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  return_date_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by return date (before)',
    example: '2024-01-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  return_date_before?: string;
}