import {
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../entities/payment.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;
  @Type(() => Number)
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  @IsOptional()
  bookingId?: number;
  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
