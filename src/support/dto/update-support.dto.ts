// src/modules/support/dto/update-support-ticket.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { CreateSupportTicketDto } from './create-support-ticket.dto';
import { TicketStatus, TicketPriority } from '../entities/support-ticket.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupportTicketDto extends PartialType(CreateSupportTicketDto) {
  @ApiPropertyOptional({
    description: 'Ticket status',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Assigned admin user ID',
    example: 'd4e5f6g7-h8i9-0123-defg-456789012345',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({
    description: 'Admin notes (internal)',
    example: 'Customer needs assistance with payment gateway',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  admin_notes?: string;

  @ApiPropertyOptional({
    description: 'Due date for resolution',
    example: '2024-01-30T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Ticket priority update',
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}