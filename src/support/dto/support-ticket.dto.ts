// src/modules/support/dto/support-ticket.dto.ts
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { TicketStatus, TicketPriority, TicketCategory } from '../entities/support-ticket.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { SupportTicketResponseDto } from './support-ticket-response.dto';

@Exclude()
export class SupportTicketDto {
  @ApiProperty({
    description: 'Ticket unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  ticket_id: string;

  @ApiProperty({
    description: 'Human-readable ticket number',
    example: 'TKT-2024-001',
  })
  @Expose()
  ticket_number: string;

  @ApiProperty({
    description: 'User who created the ticket',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({
    description: 'Ticket subject',
    example: 'Issue with booking payment',
  })
  @Expose()
  subject: string;

  @ApiProperty({
    description: 'Ticket description',
    example: 'I have an issue with my recent booking payment...',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Ticket category',
    enum: TicketCategory,
    example: TicketCategory.PAYMENT,
  })
  @Expose()
  category: TicketCategory;

  @ApiProperty({
    description: 'Ticket priority',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
  })
  @Expose()
  priority: TicketPriority;

  @ApiProperty({
    description: 'Ticket status',
    enum: TicketStatus,
    example: TicketStatus.OPEN,
  })
  @Expose()
  status: TicketStatus;

  @ApiProperty({
    description: 'Assigned admin user',
    type: UserResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => UserResponseDto)
  assigned_to?: UserResponseDto;

  @ApiProperty({
    description: 'Related booking ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    required: false,
  })
  @Expose()
  related_booking_id?: string;

  @ApiProperty({
    description: 'Ticket responses',
    type: [SupportTicketResponseDto],
  })
  @Expose()
  @Type(() => SupportTicketResponseDto)
  responses: SupportTicketResponseDto[];

  @ApiProperty({
    description: 'Number of responses',
    example: 3,
  })
  @Expose()
  @Transform(({ obj }) => obj.responses?.length || 0)
  response_count: number;

  @ApiProperty({
    description: 'Last response date',
    example: '2024-01-16T10:30:00.000Z',
    required: false,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.responses && obj.responses.length > 0) {
      return new Date(Math.max(...obj.responses.map(r => new Date(r.created_at).getTime())));
    }
    return obj.created_at;
  })
  last_activity: Date;

  @ApiProperty({
    description: 'Due date for resolution',
    example: '2024-01-30T23:59:59.000Z',
    required: false,
  })
  @Expose()
  due_date?: Date;

  @ApiProperty({
    description: 'Resolution date',
    example: '2024-01-20T15:45:00.000Z',
    required: false,
  })
  @Expose()
  resolved_at?: Date;

  @ApiProperty({
    description: 'Ticket creation timestamp',
    example: '2024-01-15T08:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Ticket last update timestamp',
    example: '2024-01-15T14:30:00.000Z',
  })
  @Expose()
  updated_at: Date;

  constructor(partial: Partial<SupportTicketDto>) {
    Object.assign(this, partial);
  }
}