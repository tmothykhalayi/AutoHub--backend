import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundStatus } from '../entities/refund.entity';

export class CreateRefundDto {
  @ApiProperty({
    description: 'Booking ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  bookingId: number;

  @ApiPropertyOptional({
    description: 'Reason for refund',
    example: 'Customer requested cancellation',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Approved by manager',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessRefundDto {
  @ApiProperty({
    description: 'Refund ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  refundId: string;

  @ApiPropertyOptional({
    description: 'Refund status',
    enum: RefundStatus,
  })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @ApiPropertyOptional({
    description: 'Processing notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
