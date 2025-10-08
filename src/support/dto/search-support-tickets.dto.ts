// src/modules/support/dto/search-support-tickets.dto.ts
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { TicketStatus, TicketPriority, TicketCategory } from '../entities/support-ticket.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchSupportTicketsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
  @ApiPropertyOptional({
    description: 'Search by subject or description',
    example: 'payment issue',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TicketStatus,
    example: TicketStatus.OPEN,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: TicketCategory,
    example: Object.values(TicketCategory)[0], // Use first enum value as example
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by assigned admin ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Filter by related booking ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  related_booking_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (after)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (before)',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Filter by overdue tickets',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by unassigned tickets',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  unassigned?: boolean;
}