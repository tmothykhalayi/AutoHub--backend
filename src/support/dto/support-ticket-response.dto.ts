// src/modules/support/dto/support-ticket-response.dto.ts
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ResponseType } from '../entities/support-ticket-response.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Exclude()
export class SupportTicketResponseDto {
  @ApiProperty({
    description: 'Response unique identifier',
    example: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
  })
  @Expose()
  response_id: string;

  @ApiProperty({
    description: 'Ticket ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  ticket_id: string;

  @ApiProperty({
    description: 'User who created the response',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({
    description: 'Response message',
    example: 'Thank you for contacting support...',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Response type',
    enum: ResponseType,
    example: ResponseType.ADMIN,
  })
  @Expose()
  response_type: ResponseType;

  @ApiProperty({
    description: 'Whether this is an internal note',
    example: false,
  })
  @Expose()
  is_internal: boolean;

  @ApiProperty({
    description: 'Attachment URLs',
    example: ['https://example.com/file1.jpg'],
    required: false,
  })
  @Expose()
  @Transform(({ value }) => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  })
  attachments: string[];

  @ApiProperty({
    description: 'Response creation timestamp',
    example: '2024-01-15T14:30:00.000Z',
  })
  @Expose()
  created_at: Date;

  constructor(partial: Partial<SupportTicketResponseDto>) {
    Object.assign(this, partial);
  }
}