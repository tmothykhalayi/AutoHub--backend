// src/modules/support/dto/create-ticket-response.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ResponseType } from '../entities/support-ticket-response.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Thank you for contacting support. We are looking into your issue...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({
    description: 'Response type',
    enum: ResponseType,
    example: ResponseType.ADMIN,
    default: ResponseType.USER,
  })
  @IsOptional()
  @IsEnum(ResponseType)
  response_type?: ResponseType;

  @ApiPropertyOptional({
    description: 'Whether this is an internal note',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_internal?: boolean;

  @ApiPropertyOptional({
    description: 'Attachment URLs (JSON array)',
    example: '["https://example.com/file1.jpg", "https://example.com/file2.pdf"]',
    required: false,
  })
  @IsOptional()
  @IsString()
  attachments?: string;
}