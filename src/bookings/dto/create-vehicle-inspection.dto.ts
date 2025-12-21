import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InspectionType,
  InspectionStatus,
  DamageSeverity,
} from '../entities/vehicle-inspection.entity';

class DamageDetailDto {
  @ApiProperty({ example: 'Front bumper' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'Scratch' })
  @IsString()
  type: string;

  @ApiProperty({ enum: DamageSeverity })
  @IsEnum(DamageSeverity)
  severity: DamageSeverity;

  @ApiProperty({ example: 'Small scratch on right side' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

class ChecklistItemDto {
  @ApiProperty({ example: 'Tire condition' })
  @IsString()
  item: string;

  @ApiProperty({ enum: ['pass', 'fail', 'needs_attention'] })
  @IsEnum(['pass', 'fail', 'needs_attention'])
  status: 'pass' | 'fail' | 'needs_attention';

  @ApiPropertyOptional({ example: 'Tires are worn' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateVehicleInspectionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  vehicleId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  bookingId?: number;

  @ApiProperty({ enum: InspectionType })
  @IsEnum(InspectionType)
  inspectionType: InspectionType;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  inspectorName?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  mileageAtInspection?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  fuelLevel?: number;

  @ApiPropertyOptional({ enum: DamageSeverity })
  @IsOptional()
  @IsEnum(DamageSeverity)
  overallCondition?: DamageSeverity;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  damagePhotos?: string[];

  @ApiPropertyOptional({ type: [DamageDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DamageDetailDto)
  damageDetails?: DamageDetailDto[];

  @ApiPropertyOptional({ example: 500.0 })
  @IsOptional()
  @IsNumber()
  estimatedRepairCost?: number;

  @ApiPropertyOptional({ type: [ChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional({ example: 'Vehicle in good condition' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInspectionStatusDto {
  @ApiProperty({ enum: InspectionStatus })
  @IsEnum(InspectionStatus)
  status: InspectionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveInspectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
