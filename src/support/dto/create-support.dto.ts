
// src/modules/support/dto/create-support-ticket.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketCategory, TicketPriority } from '../entities/support-ticket.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Ticket subject',
    example: 'Issue with my booking payment',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'I made a payment for my booking but it shows as pending...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Ticket category',
    enum: TicketCategory,
    example: Object.values(TicketCategory)[0], // Use the first available enum value
  })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({
    description: 'Ticket priority',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Related booking ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  related_booking_id?: string;

  @ApiPropertyOptional({
    description: 'Related vehicle ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  related_vehicle_id?: string;

  @ApiPropertyOptional({
    description: 'Related payment ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  related_payment_id?: string;
}