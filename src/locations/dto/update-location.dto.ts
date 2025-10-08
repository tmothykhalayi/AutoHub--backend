// src/modules/locations/dto/update-location.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches,
  Length,
} from 'class-validator';
import { CreateLocationDto } from './create-location.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ApiPropertyOptional({
    description: 'Location name',
    example: 'Updated Downtown Rental Center',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number',
    example: '+1987654321',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  contact_phone?: string;
}