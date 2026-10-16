import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCancellationPolicyDto {
  @ApiProperty({
    description: 'Policy name',
    example: 'Standard 24-hour policy',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Policy description',
    example: 'Full refund if cancelled 24 hours before booking',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Hours before booking start when policy applies',
    example: 24,
  })
  @IsNumber()
  @Min(0)
  hoursBeforeStart: number;

  @ApiProperty({
    description: 'Refund percentage (0-100)',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  refundPercentage: number;

  @ApiPropertyOptional({
    description: 'Flat cancellation fee',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationFee?: number;

  @ApiPropertyOptional({
    description: 'Grace period in hours (no penalty)',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriodHours?: number;

  @ApiPropertyOptional({
    description: 'Priority level (higher = more important)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether policy is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
